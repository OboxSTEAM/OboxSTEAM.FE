"use client";

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { EditorContent, Extension, useEditor, type Editor } from "@tiptap/react";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { SuggestionProps } from "@tiptap/suggestion";
import { AtSign, Loader2, Paperclip, Send, X } from "lucide-react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { MentionPicker, mentionOptionId } from "@/components/advisory-chat/mention-picker";
import { Button } from "@/components/ui/button";
import {
  useDiscussionAttachments,
  type ComposerAttachment,
} from "@/hooks/use-discussion-attachments";
import { formatAttachmentSize } from "@/lib/advisory/attachment-format";
import {
  encodeMentionNodeId,
  messageTextToDoc,
} from "@/lib/advisory/composer-content";
import { groupMentionResults } from "@/lib/advisory/mention-search";
import { MENTION_TARGET_TYPE_LABELS, mentionKey, type MentionToken } from "@/lib/advisory/mention-token";
import type { DiscussionAttachment, DiscussionReference, MentionTarget } from "@/lib/api";
import { showAppError } from "@/lib/errors";
import {
  DISCUSSION_ATTACHMENT_EXTENSIONS,
  DISCUSSION_MAX_MENTIONS,
  DISCUSSION_MESSAGE_MAX_LENGTH,
} from "@/lib/validations";
import { cn } from "@/lib/utils";

const LENGTH_WARNING_THRESHOLD = DISCUSSION_MESSAGE_MAX_LENGTH - 300;
const FILE_INPUT_ACCEPT = DISCUSSION_ATTACHMENT_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export type AdvisoryComposerHandle = {
  insertMention: (token: MentionToken) => void;
  focus: () => void;
};

export type AdvisoryComposerPayload = {
  text: string;
  attachments: DiscussionAttachment[];
};

type AdvisoryComposerProps = {
  ref?: Ref<AdvisoryComposerHandle>;
  /** `create` clears immediately (optimistic send); `edit` waits for `onSubmit`. */
  mode?: "create" | "edit";
  initialText?: string;
  initialReferences?: DiscussionReference[];
  disabled?: boolean;
  disabledReason?: string;
  placeholder?: string;
  onSubmit: (payload: AdvisoryComposerPayload) => Promise<unknown> | void;
  onCancel?: () => void;
};

type SuggestionState = {
  query: string;
  command: SuggestionProps<unknown, { id: string; label: string }>["command"];
};

/** Chat composer: TipTap with `@` component mentions, attachments, Enter to send. */
export function AdvisoryComposer({
  ref,
  mode = "create",
  initialText = "",
  initialReferences = [],
  disabled = false,
  disabledReason,
  placeholder = "Nhập tin nhắn… gõ @ để nhắc đến một mục",
  onSubmit,
  onCancel,
}: AdvisoryComposerProps) {
  const { programId, mentions, takeQueuedMentions } = useAdvisoryChat();
  const isEdit = mode === "edit";
  const attachments = useDiscussionAttachments(programId);
  const listboxId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [suggestion, setSuggestion] = useState<SuggestionState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [draftLength, setDraftLength] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const submitRef = useRef<() => boolean>(() => false);
  const pickerKeyRef = useRef<(event: KeyboardEvent) => boolean>(() => false);
  const addFilesRef = useRef(attachments.addFiles);
  const [initialContent] = useState(() =>
    isEdit
      ? messageTextToDoc(initialText, (token) =>
          resolveMentionLabel(token, mentions.getTarget, initialReferences),
        )
      : "",
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      autofocus: isEdit ? "end" : false,
      content: initialContent,
      extensions: [
        StarterKit.configure({
          heading: false,
          bold: false,
          italic: false,
          strike: false,
          underline: false,
          code: false,
          codeBlock: false,
          blockquote: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          listKeymap: false,
          horizontalRule: false,
          link: false,
          trailingNode: false,
        }),
        Placeholder.configure({ placeholder }),
        Mention.configure({
          HTMLAttributes: {
            class: "rounded-md bg-accent/15 px-1 py-px font-medium text-foreground",
          },
          renderText: ({ node }) => `@[${String(node.attrs.id)}]`,
          deleteTriggerWithBackspace: true,
          suggestion: {
            char: "@",
            allowSpaces: true,
            items: () => [],
            render: () => ({
              onStart: (props) => {
                setSuggestion({ query: props.query, command: props.command });
                setActiveIndex(0);
              },
              onUpdate: (props) => {
                setSuggestion({ query: props.query, command: props.command });
                setActiveIndex(0);
              },
              onKeyDown: ({ event }) => pickerKeyRef.current(event),
              onExit: () => setSuggestion(null),
            }),
          },
        }),
        Extension.create({
          name: "advisorySubmitOnEnter",
          addKeyboardShortcuts() {
            return { Enter: () => submitRef.current() };
          },
        }),
      ],
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": isEdit ? "Chỉnh sửa tin nhắn" : "Soạn tin nhắn",
          "aria-autocomplete": "list",
          class:
            "max-h-40 min-h-[2.75rem] overflow-y-auto px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none [&_p]:m-0 [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        },
        handlePaste: (_view, event) => {
          const files = Array.from(event.clipboardData?.files ?? []);
          if (files.length === 0 || isEdit) return false;
          addFilesRef.current(files);
          return true;
        },
        handleDrop: (_view, event) => {
          const files = Array.from(event.dataTransfer?.files ?? []);
          if (files.length === 0 || isEdit) return false;
          event.preventDefault();
          addFilesRef.current(files);
          return true;
        },
      },
      onUpdate: ({ editor: current }) => setDraftLength(serializeDraft(current).length),
      onCreate: ({ editor: current }) => setDraftLength(serializeDraft(current).length),
    },
    [],
  );

  const { search: searchMentions } = mentions;
  const results = useMemo(
    () => (suggestion ? searchMentions(suggestion.query) : []),
    [searchMentions, suggestion],
  );
  const groups = useMemo(() => groupMentionResults(results), [results]);
  const flatResults = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const isPickerOpen =
    suggestion !== null && (flatResults.length > 0 || !suggestion.query.includes(" "));
  const safeActiveIndex = Math.min(activeIndex, Math.max(flatResults.length - 1, 0));
  const activeTarget = isPickerOpen ? flatResults[safeActiveIndex] : undefined;

  const insertMentionNode = useCallback(
    (token: MentionToken, label: string) => {
      if (!editor) return;
      if (countMentions(editor) >= DISCUSSION_MAX_MENTIONS) {
        showMentionLimitError();
        return;
      }
      editor
        .chain()
        .focus()
        .insertContent([
          { type: "mention", attrs: { id: encodeMentionNodeId(token), label } },
          { type: "text", text: " " },
        ])
        .run();
    },
    [editor],
  );

  const selectTarget = useCallback(
    (target: MentionTarget) => {
      if (!editor || !suggestion) return;
      if (countMentions(editor) >= DISCUSSION_MAX_MENTIONS) {
        showMentionLimitError();
        return;
      }
      suggestion.command({
        id: encodeMentionNodeId({ targetType: target.targetType, targetId: target.targetId }),
        label: target.label,
      });
    },
    [editor, suggestion],
  );

  const submit = useCallback((): boolean => {
    if (!editor) return true;
    if (isPickerOpen && flatResults.length > 0) return false;
    if (disabled || isSaving) return true;

    const text = serializeDraft(editor);
    if (text.length > DISCUSSION_MESSAGE_MAX_LENGTH) {
      showAppError({
        title: "Tin nhắn quá dài",
        reason: `Tin nhắn không được quá ${DISCUSSION_MESSAGE_MAX_LENGTH} ký tự.`,
        action: "Rút gọn nội dung hoặc chia thành nhiều tin nhắn.",
      });
      return true;
    }
    if (attachments.isUploading) {
      showAppError({
        title: "Tệp vẫn đang tải lên",
        reason: "Tin nhắn chưa thể gửi khi tệp đính kèm chưa tải xong.",
        action: "Đợi tệp tải xong rồi gửi lại.",
      });
      return true;
    }
    if (attachments.items.some((item) => item.status === "error")) {
      showAppError({
        title: "Có tệp tải lên không thành công",
        reason: "Một số tệp đính kèm bị lỗi khi tải lên.",
        action: "Gỡ các tệp bị lỗi rồi gửi lại.",
      });
      return true;
    }
    if (!text && attachments.uploaded.length === 0) return true;

    const payload: AdvisoryComposerPayload = { text, attachments: attachments.uploaded };
    if (!isEdit) {
      editor.commands.clearContent(true);
      attachments.clear();
      void Promise.resolve(onSubmit(payload)).catch(() => undefined);
      return true;
    }

    setIsSaving(true);
    Promise.resolve(onSubmit(payload))
      .catch(() => undefined)
      .finally(() => setIsSaving(false));
    return true;
  }, [attachments, disabled, editor, flatResults.length, isEdit, isPickerOpen, isSaving, onSubmit]);

  const handlePickerKey = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!isPickerOpen) return false;
      if (event.key === "Escape") {
        setSuggestion(null);
        return true;
      }
      if (flatResults.length === 0) return false;
      if (event.key === "ArrowDown") {
        setActiveIndex((safeActiveIndex + 1) % flatResults.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setActiveIndex((safeActiveIndex - 1 + flatResults.length) % flatResults.length);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const target = flatResults[safeActiveIndex];
        if (target) selectTarget(target);
        return true;
      }
      return false;
    },
    [flatResults, isPickerOpen, safeActiveIndex, selectTarget],
  );

  useEffect(() => {
    submitRef.current = submit;
    pickerKeyRef.current = handlePickerKey;
    addFilesRef.current = attachments.addFiles;
  }, [attachments.addFiles, handlePickerKey, submit]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    dom.setAttribute("aria-expanded", String(isPickerOpen));
    if (isPickerOpen) dom.setAttribute("aria-controls", listboxId);
    else dom.removeAttribute("aria-controls");
    if (activeTarget) dom.setAttribute("aria-activedescendant", mentionOptionId(listboxId, activeTarget));
    else dom.removeAttribute("aria-activedescendant");
  }, [activeTarget, editor, isPickerOpen, listboxId]);

  useEffect(() => {
    if (!editor || isEdit) return;
    for (const token of takeQueuedMentions()) {
      insertMentionNode(token, resolveMentionLabel(token, mentions.getTarget));
    }
  }, [editor, insertMentionNode, isEdit, mentions.getTarget, takeQueuedMentions]);

  useImperativeHandle(
    ref,
    () => ({
      insertMention: (token) =>
        insertMentionNode(token, resolveMentionLabel(token, mentions.getTarget)),
      focus: () => editor?.commands.focus("end"),
    }),
    [editor, insertMentionNode, mentions.getTarget],
  );

  function openMentionPicker() {
    if (!editor || disabled) return;
    const { from } = editor.state.selection;
    const before = from > 1 ? editor.state.doc.textBetween(from - 1, from, "\n", " ") : "";
    editor
      .chain()
      .focus()
      .insertContent(before && !/\s/.test(before) ? " @" : "@")
      .run();
  }

  const isOverLimit = draftLength > DISCUSSION_MESSAGE_MAX_LENGTH;
  const canSubmit =
    !disabled &&
    !isSaving &&
    !isOverLimit &&
    !attachments.isUploading &&
    (draftLength > 0 || attachments.uploaded.length > 0);

  return (
    <div
      className="relative"
      onDragOver={(event) => {
        if (isEdit || disabled || !event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragOver(false);
      }}
      onDrop={(event) => {
        setIsDragOver(false);
        if (isEdit || disabled || event.defaultPrevented) return;
        const files = Array.from(event.dataTransfer.files);
        if (files.length === 0) return;
        event.preventDefault();
        attachments.addFiles(files);
      }}
    >
      {isPickerOpen ? (
        <MentionPicker
          listboxId={listboxId}
          query={suggestion?.query ?? ""}
          groups={groups}
          flatResults={flatResults}
          activeIndex={safeActiveIndex}
          isLoading={mentions.isLoading}
          onSelect={selectTarget}
          onActiveIndexChange={setActiveIndex}
        />
      ) : null}

      <div
        className={cn(
          "rounded-xl border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 dark:border-white/10 dark:bg-white/4 dark:focus-within:border-ring",
          isDragOver && "border-ring bg-accent/5",
          disabled && "opacity-70",
        )}
      >
        {attachments.items.length > 0 ? (
          <ComposerAttachmentTray items={attachments.items} onRemove={attachments.remove} />
        ) : null}

        <EditorContent editor={editor} />

        <div className="flex items-center gap-1 px-1.5 pb-1.5">
          {!isEdit ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Đính kèm ảnh hoặc tệp"
                title="Đính kèm ảnh hoặc tệp"
              >
                <Paperclip className="size-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={FILE_INPUT_ACCEPT}
                className="hidden"
                onChange={(event) => {
                  attachments.addFiles(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={openMentionPicker}
            aria-label="Nhắc đến một mục"
            title="Nhắc đến một mục (@)"
          >
            <AtSign className="size-4" />
          </Button>

          <span
            className={cn(
              "ml-auto px-1 text-[11px] tabular-nums",
              isOverLimit ? "font-semibold text-destructive" : "text-muted-foreground",
              draftLength < LENGTH_WARNING_THRESHOLD && "sr-only",
            )}
            aria-live="polite"
          >
            {draftLength}/{DISCUSSION_MESSAGE_MAX_LENGTH}
          </span>

          {isEdit ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
                Huỷ
              </Button>
              <Button type="button" size="sm" onClick={() => submit()} disabled={!canSubmit}>
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                Lưu
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="icon-sm"
              onClick={() => submit()}
              disabled={!canSubmit}
              aria-label="Gửi tin nhắn"
              title="Gửi (Enter) · Xuống dòng (Shift+Enter)"
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {disabled && disabledReason ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{disabledReason}</p>
      ) : null}
    </div>
  );
}

function ComposerAttachmentTray({
  items,
  onRemove,
}: {
  items: ComposerAttachment[];
  onRemove: (localId: string) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-1.5 px-2 pt-2" aria-label="Tệp đính kèm">
      {items.map((item) => (
        <li
          key={item.localId}
          className={cn(
            "relative flex max-w-full items-center gap-2 rounded-lg border bg-muted/40 py-1 pr-1 pl-1 dark:bg-white/5",
            item.status === "error" ? "border-destructive/50" : "border-border dark:border-white/8",
          )}
          title={item.errorMessage ?? item.fileName}
        >
          {item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img
              src={item.previewUrl}
              alt=""
              className="size-9 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-[10px] font-semibold text-muted-foreground uppercase dark:bg-white/8">
              {item.fileName.split(".").pop()?.slice(0, 4)}
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <span className="max-w-36 truncate text-xs font-medium text-foreground">
              {item.fileName}
            </span>
            <span
              className={cn(
                "text-[11px]",
                item.status === "error" ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {item.status === "uploading"
                ? "Đang tải lên…"
                : item.status === "error"
                  ? "Tải lên thất bại"
                  : formatAttachmentSize(item.sizeBytes)}
            </span>
          </span>
          {item.status === "uploading" ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(item.localId)}
            aria-label={`Gỡ ${item.fileName}`}
            className="size-7"
          >
            <X className="size-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function serializeDraft(editor: Editor): string {
  return editor.getText({ blockSeparator: "\n" }).trim();
}

function countMentions(editor: Editor): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") count += 1;
  });
  return count;
}

function showMentionLimitError(): void {
  showAppError({
    title: "Đã đạt giới hạn nhắc đến",
    reason: `Mỗi tin nhắn chỉ nhắc đến tối đa ${DISCUSSION_MAX_MENTIONS} mục.`,
    action: "Gửi tin nhắn này rồi nhắc đến các mục còn lại trong tin nhắn tiếp theo.",
  });
}

function resolveMentionLabel(
  token: MentionToken,
  getTarget: (targetType: MentionToken["targetType"], targetId: string) => MentionTarget | undefined,
  references: DiscussionReference[] = [],
): string {
  const target = getTarget(token.targetType, token.targetId);
  if (target) return target.label;
  const key = mentionKey(token.targetType, token.targetId);
  const reference = references.find(
    (item) => mentionKey(item.targetType, item.targetId) === key,
  );
  return reference?.capturedLabel ?? MENTION_TARGET_TYPE_LABELS[token.targetType];
}
