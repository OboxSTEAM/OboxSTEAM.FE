"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { uploadDiscussionAttachment, type DiscussionAttachment } from "@/lib/api";
import { resolveAppError, showAppError } from "@/lib/errors";
import {
  DISCUSSION_MAX_ATTACHMENTS,
  getDiscussionAttachmentKind,
  validateDiscussionAttachmentFile,
} from "@/lib/validations";

export type ComposerAttachment = {
  localId: string;
  fileName: string;
  sizeBytes: number;
  kind: "Image" | "File";
  /** Object URL for image previews; revoked on removal/unmount. */
  previewUrl: string | null;
  status: "uploading" | "uploaded" | "error";
  attachment: DiscussionAttachment | null;
  errorMessage: string | null;
};

export type UseDiscussionAttachmentsResult = {
  items: ComposerAttachment[];
  addFiles: (files: Iterable<File>) => void;
  remove: (localId: string) => void;
  /** Drop all items (after a send); previews are revoked. */
  clear: () => void;
  isUploading: boolean;
  uploaded: DiscussionAttachment[];
};

/** Composer attachment tray: validates, uploads immediately, keeps previews. */
export function useDiscussionAttachments(programId: string): UseDiscussionAttachmentsResult {
  const [items, setItems] = useState<ComposerAttachment[]>([]);
  const itemsRef = useRef<ComposerAttachment[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(
    () => () => {
      for (const item of itemsRef.current) revokePreview(item);
    },
    [],
  );

  const updateItem = useCallback((localId: string, patch: Partial<ComposerAttachment>) => {
    setItems((list) => list.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  }, []);

  const addFiles = useCallback(
    (files: Iterable<File>) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;

      const slots = DISCUSSION_MAX_ATTACHMENTS - itemsRef.current.length;
      const rejected: string[] = [];
      const accepted: { item: ComposerAttachment; file: File }[] = [];

      for (const file of incoming) {
        const problem = validateDiscussionAttachmentFile(file);
        if (problem) {
          rejected.push(`${file.name}: ${problem}`);
          continue;
        }
        if (accepted.length >= slots) {
          rejected.push(
            `${file.name}: Mỗi tin nhắn đính kèm tối đa ${DISCUSSION_MAX_ATTACHMENTS} tệp.`,
          );
          continue;
        }
        const kind = getDiscussionAttachmentKind(file.name);
        accepted.push({
          file,
          item: {
            localId: crypto.randomUUID(),
            fileName: file.name,
            sizeBytes: file.size,
            kind,
            previewUrl: kind === "Image" ? URL.createObjectURL(file) : null,
            status: "uploading",
            attachment: null,
            errorMessage: null,
          },
        });
      }

      if (rejected.length > 0) {
        showAppError({
          title: "Không thể đính kèm một số tệp",
          reason: rejected.slice(0, 3).join(" "),
          action: "Chọn tệp khác hoặc giảm số lượng tệp rồi thử lại.",
        });
      }
      if (accepted.length === 0) return;

      setItems((list) => [...list, ...accepted.map(({ item }) => item)]);

      for (const { item, file } of accepted) {
        uploadDiscussionAttachment(programId, file).then(
          (attachment) => updateItem(item.localId, { status: "uploaded", attachment }),
          (caught: unknown) => {
            const state = resolveAppError(caught, "advisory.attachment.upload");
            updateItem(item.localId, { status: "error", errorMessage: state.reason });
          },
        );
      }
    },
    [programId, updateItem],
  );

  const remove = useCallback((localId: string) => {
    setItems((list) => {
      const target = list.find((item) => item.localId === localId);
      if (target) revokePreview(target);
      return list.filter((item) => item.localId !== localId);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((list) => {
      for (const item of list) revokePreview(item);
      return [];
    });
  }, []);

  const uploaded = useMemo(
    () =>
      items.flatMap((item) =>
        item.status === "uploaded" && item.attachment ? [item.attachment] : [],
      ),
    [items],
  );
  const isUploading = items.some((item) => item.status === "uploading");

  return { items, addFiles, remove, clear, isUploading, uploaded };
}

function revokePreview(item: ComposerAttachment): void {
  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
}
