"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  deleteDiscussionMessage,
  editDiscussionMessage,
  getDiscussionMessage,
  getDiscussionMessages,
  postDiscussionMessage,
  recordDiscussionRead,
  type CurriculumTargetType,
  type DiscussionAttachment,
  type DiscussionMessage,
  type DiscussionPage,
} from "@/lib/api";
import { DISCUSSION_PAGE_SIZE } from "@/lib/validations";
import { registerAdvisorySyncHandler } from "@/lib/realtime/advisory-sync-bus";
import { useAdvisoryPresence } from "@/hooks/use-advisory-presence";

const NEWER_PAGE_SIZE = 100;
const MAX_CATCH_UP_ROUNDS = 5;

export type DiscussionTargetFilter = {
  targetType: CurriculumTargetType;
  targetId: string;
};

export type PendingDiscussionMessage = {
  programId: string;
  clientMessageId: string;
  text: string;
  attachments: DiscussionAttachment[];
  createdAt: string;
  status: "sending" | "failed";
};

export type SendDiscussionMessageInput = {
  text: string;
  attachments: DiscussionAttachment[];
};

type UseAdvisoryDiscussionOptions = {
  enabled?: boolean;
  /** Only messages mentioning this component (read-only view; no read receipts). */
  filter?: DiscussionTargetFilter | null;
};

export type UseAdvisoryDiscussionResult = {
  /** Loaded messages, ascending by `sequence`. */
  messages: DiscussionMessage[];
  /** Optimistic sends not yet confirmed by the server (unfiltered view only). */
  pending: PendingDiscussionMessage[];
  isLoading: boolean;
  error: unknown;
  hasMoreBefore: boolean;
  isLoadingOlder: boolean;
  reload: () => Promise<void>;
  loadOlder: () => Promise<void>;
  send: (input: SendDiscussionMessageInput) => Promise<DiscussionMessage>;
  retry: (item: PendingDiscussionMessage) => Promise<DiscussionMessage>;
  discard: (clientMessageId: string) => void;
  edit: (messageId: string, text: string) => Promise<DiscussionMessage>;
  remove: (messageId: string) => Promise<void>;
  /** Apply a message returned by another mutation (pin actions). */
  applyMessage: (message: DiscussionMessage) => void;
  /** Record the newest loaded message as read; `true` when the server accepted a new position. */
  markRead: () => Promise<boolean>;
};

type ThreadState = {
  key: string;
  byId: Record<string, DiscussionMessage>;
  hasMoreBefore: boolean;
};

type ThreadCursors = {
  key: string;
  before: string | null;
  after: string | null;
  hasMoreBefore: boolean;
};

type ThreadFailure = { key: string; error: unknown };

type PageMode = "replace" | "newer" | "older";

/**
 * Program chat thread: cursor paging, realtime catch-up, optimistic sends and
 * read receipts. Messages are keyed by `id` and ordered by `sequence` — system
 * messages such as `CurriculumUpdated` keep their id but may move to a later sequence.
 */
export function useAdvisoryDiscussion(
  programId: string,
  options: UseAdvisoryDiscussionOptions = {},
): UseAdvisoryDiscussionResult {
  const { enabled = true, filter = null } = options;
  const filterType = filter?.targetType ?? null;
  const filterId = filter?.targetId.toLowerCase() ?? null;
  const isFiltered = filterType !== null && filterId !== null;
  const isActive = enabled && Boolean(programId);
  const key = isFiltered ? `${programId}|${filterType}:${filterId}` : programId;

  const [thread, setThread] = useState<ThreadState | null>(null);
  const [failure, setFailure] = useState<ThreadFailure | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingDiscussionMessage[]>([]);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const keyRef = useRef(key);
  const cursorsRef = useRef<ThreadCursors>(emptyCursors(key));
  const threadRef = useRef<ThreadState | null>(null);
  const latestMessageRef = useRef<DiscussionMessage | null>(null);
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const isResyncQueuedRef = useRef(false);
  const isLoadingOlderRef = useRef(false);
  const lastReadSequenceRef = useRef(-1);

  useAdvisoryPresence(programId, isActive);

  const currentThread = thread?.key === key ? thread : null;
  const error = failure?.key === key ? failure.error : null;
  const isLoading = isActive && currentThread === null && error === null;

  const filterParams = useMemo(
    () =>
      filterType && filterId
        ? { targetType: filterType, targetId: filterId }
        : {},
    [filterId, filterType],
  );

  const messages = useMemo(
    () => (currentThread ? Object.values(currentThread.byId).sort(bySequence) : []),
    [currentThread],
  );

  const pending = useMemo(() => {
    if (isFiltered) return [];
    const confirmedClientIds = new Set(
      messages.map((message) => message.clientMessageId).filter(Boolean),
    );
    return pendingItems.filter(
      (item) =>
        item.programId === programId && !confirmedClientIds.has(item.clientMessageId),
    );
  }, [isFiltered, messages, pendingItems, programId]);

  useEffect(() => {
    threadRef.current = currentThread;
    latestMessageRef.current = messages.at(-1) ?? null;
  }, [currentThread, messages]);

  const matchesFilter = useCallback(
    (message: DiscussionMessage) =>
      !filterType ||
      !filterId ||
      message.references.some(
        (reference) =>
          reference.targetType === filterType &&
          reference.targetId.toLowerCase() === filterId,
      ),
    [filterId, filterType],
  );

  const applyPage = useCallback(
    (requestKey: string, page: DiscussionPage, mode: PageMode): ThreadCursors => {
      const edges = edgeCursors(page.messages);
      const previous =
        mode !== "replace" && cursorsRef.current.key === requestKey ? cursorsRef.current : null;

      const next: ThreadCursors = {
        key: requestKey,
        after:
          mode === "older"
            ? (previous?.after ?? null)
            : (page.after ?? edges.last ?? previous?.after ?? null),
        before:
          mode === "newer" && previous
            ? previous.before
            : (page.before ?? edges.first ?? previous?.before ?? null),
        hasMoreBefore:
          mode === "newer" && previous ? previous.hasMoreBefore : page.hasMoreBefore,
      };
      cursorsRef.current = next;

      setThread((prev) => {
        const base = mode !== "replace" && prev?.key === requestKey ? prev.byId : {};
        return {
          key: requestKey,
          byId: mergeMessages(base, page.messages),
          hasMoreBefore: next.hasMoreBefore,
        };
      });
      return next;
    },
    [],
  );

  const upsertMessage = useCallback(
    (message: DiscussionMessage, force = false) => {
      const requestKey = keyRef.current;
      setThread((prev) => {
        if (!prev || prev.key !== requestKey) return prev;
        const isKnown = message.id in prev.byId;
        if (!isKnown && !force) return prev;
        if (!isKnown && !matchesFilter(message)) return prev;
        return { ...prev, byId: { ...prev.byId, [message.id]: message } };
      });
    },
    [matchesFilter],
  );

  const reload = useCallback((): Promise<void> => {
    if (!isActive) return Promise.resolve();
    const requestKey = key;
    return getDiscussionMessages(programId, {
      pageSize: DISCUSSION_PAGE_SIZE,
      ...filterParams,
    }).then(
      (page) => {
        if (keyRef.current !== requestKey) return;
        applyPage(requestKey, page, "replace");
        setFailure(null);
      },
      (caught: unknown) => {
        if (keyRef.current === requestKey) setFailure({ key: requestKey, error: caught });
      },
    );
  }, [applyPage, filterParams, isActive, key, programId]);

  /** Pull everything after the newest cursor; concurrent calls coalesce into one extra pass. */
  const fetchNewer = useCallback((): Promise<void> => {
    if (!isActive) return Promise.resolve();
    if (syncPromiseRef.current) {
      isResyncQueuedRef.current = true;
      return syncPromiseRef.current;
    }

    const requestKey = key;
    const run = async () => {
      do {
        isResyncQueuedRef.current = false;
        let cursor =
          cursorsRef.current.key === requestKey ? cursorsRef.current.after : null;

        for (let round = 0; round < MAX_CATCH_UP_ROUNDS; round += 1) {
          const page = await getDiscussionMessages(
            programId,
            cursor
              ? { after: cursor, pageSize: NEWER_PAGE_SIZE, ...filterParams }
              : { pageSize: DISCUSSION_PAGE_SIZE, ...filterParams },
          );
          if (keyRef.current !== requestKey) return;
          const next = applyPage(requestKey, page, "newer").after;
          setFailure(null);
          if (!page.hasMoreAfter || !next || next === cursor) break;
          cursor = next;
        }
      } while (isResyncQueuedRef.current && keyRef.current === requestKey);
    };

    const promise: Promise<void> = run()
      .catch(() => {
        /* Catch-up is best-effort; the next event or reconnect retries. */
      })
      .finally(() => {
        if (syncPromiseRef.current === promise) syncPromiseRef.current = null;
      });
    syncPromiseRef.current = promise;
    return promise;
  }, [applyPage, filterParams, isActive, key, programId]);

  /** Re-read one message (edit, delete, pin change, re-sequenced system message). */
  const refreshMessage = useCallback(
    async (messageId: string) => {
      if (!isActive) return;
      const loaded = threadRef.current;
      if (!loaded || loaded.key !== key) return;

      const isKnown = messageId in loaded.byId;
      if (!isKnown && isFiltered) return;

      const message = await getDiscussionMessage(programId, messageId);
      if (keyRef.current !== key) return;

      const oldestSequence = Object.values(loaded.byId).reduce(
        (min, item) => Math.min(min, item.sequence),
        Number.POSITIVE_INFINITY,
      );
      const isInLoadedWindow = message.sequence >= oldestSequence || !loaded.hasMoreBefore;
      upsertMessage(message, isKnown || isInLoadedWindow);
    },
    [isActive, isFiltered, key, programId, upsertMessage],
  );

  useEffect(() => {
    keyRef.current = key;
    cursorsRef.current = emptyCursors(key);
    syncPromiseRef.current = null;
    isResyncQueuedRef.current = false;
    lastReadSequenceRef.current = -1;
    if (!isActive) return;
    void reload();
  }, [isActive, key, reload]);

  useEffect(() => {
    if (!isActive) return;
    return registerAdvisorySyncHandler(programId, (signal) => {
      switch (signal.scope) {
        case "advisory.discussionChanged":
          return signal.payload.messageId
            ? refreshMessage(signal.payload.messageId)
            : fetchNewer();
        case "advisory.pinChanged":
          return refreshMessage(signal.payload.messageId);
        case "resync":
          return fetchNewer();
        default:
          return undefined;
      }
    });
  }, [fetchNewer, isActive, programId, refreshMessage]);

  const loadOlder = useCallback(async () => {
    const cursors = cursorsRef.current;
    if (
      !isActive ||
      cursors.key !== key ||
      !cursors.hasMoreBefore ||
      !cursors.before ||
      isLoadingOlderRef.current
    ) {
      return;
    }

    isLoadingOlderRef.current = true;
    setIsLoadingOlder(true);
    try {
      const page = await getDiscussionMessages(programId, {
        before: cursors.before,
        pageSize: DISCUSSION_PAGE_SIZE,
        ...filterParams,
      });
      if (keyRef.current === key) applyPage(key, page, "older");
    } finally {
      isLoadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }, [applyPage, filterParams, isActive, key, programId]);

  const submit = useCallback(
    async (item: PendingDiscussionMessage) => {
      try {
        const message = await postDiscussionMessage(item.programId, {
          text: item.text,
          attachmentIds: item.attachments.map((attachment) => attachment.id),
          clientMessageId: item.clientMessageId,
        });
        if (item.programId === programId) upsertMessage(message, true);
        setPendingItems((list) =>
          list.filter((entry) => entry.clientMessageId !== item.clientMessageId),
        );
        return message;
      } catch (caught) {
        setPendingItems((list) =>
          list.map((entry) =>
            entry.clientMessageId === item.clientMessageId
              ? { ...entry, status: "failed" }
              : entry,
          ),
        );
        throw caught;
      }
    },
    [programId, upsertMessage],
  );

  const send = useCallback(
    (input: SendDiscussionMessageInput) => {
      const item: PendingDiscussionMessage = {
        programId,
        clientMessageId: crypto.randomUUID(),
        text: input.text,
        attachments: input.attachments,
        createdAt: new Date().toISOString(),
        status: "sending",
      };
      setPendingItems((list) => [...list, item]);
      return submit(item);
    },
    [programId, submit],
  );

  const retry = useCallback(
    (item: PendingDiscussionMessage) => {
      setPendingItems((list) =>
        list.map((entry) =>
          entry.clientMessageId === item.clientMessageId
            ? { ...entry, status: "sending" }
            : entry,
        ),
      );
      return submit({ ...item, status: "sending" });
    },
    [submit],
  );

  const discard = useCallback((clientMessageId: string) => {
    setPendingItems((list) => list.filter((entry) => entry.clientMessageId !== clientMessageId));
  }, []);

  const edit = useCallback(
    async (messageId: string, text: string) => {
      const message = await editDiscussionMessage(programId, messageId, { text });
      upsertMessage(message, true);
      return message;
    },
    [programId, upsertMessage],
  );

  const remove = useCallback(
    async (messageId: string) => {
      await deleteDiscussionMessage(programId, messageId);
      const requestKey = keyRef.current;
      setThread((prev) => {
        const existing = prev?.key === requestKey ? prev.byId[messageId] : undefined;
        if (!prev || !existing) return prev;
        return {
          ...prev,
          byId: {
            ...prev.byId,
            [messageId]: {
              ...existing,
              text: "",
              references: [],
              attachments: [],
              isDeleted: true,
            },
          },
        };
      });
    },
    [programId],
  );

  const applyMessage = useCallback(
    (message: DiscussionMessage) => upsertMessage(message),
    [upsertMessage],
  );

  const markRead = useCallback(async () => {
    if (!isActive || isFiltered) return false;
    const latest = latestMessageRef.current;
    if (!latest || latest.sequence <= lastReadSequenceRef.current) return false;

    const previous = lastReadSequenceRef.current;
    lastReadSequenceRef.current = latest.sequence;
    try {
      await recordDiscussionRead(programId, {
        lastDisplayedSequence: latest.sequence,
        cursor: latest.cursor,
      });
      return true;
    } catch {
      if (lastReadSequenceRef.current === latest.sequence) {
        lastReadSequenceRef.current = previous;
      }
      return false;
    }
  }, [isActive, isFiltered, programId]);

  return {
    messages,
    pending,
    isLoading,
    error,
    hasMoreBefore: currentThread?.hasMoreBefore ?? false,
    isLoadingOlder,
    reload,
    loadOlder,
    send,
    retry,
    discard,
    edit,
    remove,
    applyMessage,
    markRead,
  };
}

function emptyCursors(key: string): ThreadCursors {
  return { key, before: null, after: null, hasMoreBefore: false };
}

function bySequence(a: DiscussionMessage, b: DiscussionMessage): number {
  return a.sequence - b.sequence;
}

function mergeMessages(
  byId: Record<string, DiscussionMessage>,
  messages: DiscussionMessage[],
): Record<string, DiscussionMessage> {
  if (messages.length === 0) return byId;
  const next = { ...byId };
  for (const message of messages) next[message.id] = message;
  return next;
}

function edgeCursors(messages: DiscussionMessage[]): {
  first: string | null;
  last: string | null;
} {
  if (messages.length === 0) return { first: null, last: null };
  const sorted = [...messages].sort(bySequence);
  return { first: sorted[0]?.cursor ?? null, last: sorted.at(-1)?.cursor ?? null };
}
