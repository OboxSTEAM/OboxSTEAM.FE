"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import type { MediaAsset } from "@/lib/api/entities/media";
import {
  deleteMedia,
  getMediaByClassSession,
  uploadClassMedia,
} from "@/lib/api/media";
import { MEDIA_ACCEPT } from "@/lib/classes/constants";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { uploadClassMediaFileSchema } from "@/lib/validations/media";
import { cn } from "@/lib/utils";

type SessionEvidencePanelProps = {
  classId: string;
  sessionId: string;
  requireMediaEvidence?: boolean;
  onCountChange?: (count: number) => void;
  className?: string;
};

function isVideoAsset(item: MediaAsset): boolean {
  const type = (item.fileType ?? "").toLowerCase();
  if (type.includes("video") || type === "mp4" || type === "mov") return true;
  const href = (item.fileUrl ?? "").toLowerCase();
  return href.endsWith(".mp4") || href.endsWith(".mov");
}

function validateEvidenceFiles(files: File[]): File[] {
  const valid: File[] = [];
  for (const file of files) {
    const parsed = uploadClassMediaFileSchema.safeParse({ file });
    if (parsed.success) {
      valid.push(file);
    } else {
      showAppErrorFromUnknown(parsed.error, "classSessions.evidence.upload");
    }
  }
  return valid;
}

function EvidenceThumbnail({
  item,
  deleting,
  onDelete,
}: {
  item: MediaAsset;
  deleting: boolean;
  onDelete: () => void;
}) {
  const url = item.fileUrl?.trim();
  if (!url) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
        {item.isReady ? "Không có URL" : (item.statusLabel ?? "Đang xử lý…")}
      </div>
    );
  }

  const video = isVideoAsset(item);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/20">
      {video ? (
        <video
          src={url}
          className="size-full object-cover"
          muted
          preload="metadata"
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Minh chứng buổi học"
          className="size-full object-cover"
          loading="lazy"
        />
      )}
      {!item.isReady && item.statusLabel ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
          {item.statusLabel}
        </span>
      ) : null}
      <Button
        type="button"
        size="icon"
        variant="destructive"
        disabled={deleting}
        className="absolute top-2 right-2 size-8 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        aria-label="Xóa minh chứng"
        onClick={onDelete}
      >
        {deleting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-4" aria-hidden />
        )}
      </Button>
    </div>
  );
}

export function SessionEvidencePanel({
  classId,
  sessionId,
  requireMediaEvidence = false,
  onCountChange,
  className,
}: SessionEvidencePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: evidenceEnvelope,
    isLoading,
    retry,
    mutate,
  } = useClientFetch({
    enabled: Boolean(sessionId),
    fetcher: async () => getMediaByClassSession(sessionId),
    deps: [sessionId],
    onError: (error) =>
      showAppErrorFromUnknown(error, "classSessions.evidence.list"),
  });

  const items = evidenceEnvelope?.data ?? [];

  useEffect(() => {
    onCountChange?.(items.length);
  }, [items.length, onCountChange]);

  const handleUploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = validateEvidenceFiles(Array.from(fileList));
      if (files.length === 0) return;

      setUploadingCount((count) => count + files.length);
      try {
        for (const file of files) {
          const result = await uploadClassMedia(file, {
            classId,
            classSessionId: sessionId,
          });
          const uploaded = result?.data;
          if (uploaded) {
            mutate((prev) => {
              const prevItems = prev?.data ?? [];
              return {
                code: prev?.code ?? "OK",
                message: prev?.message ?? "",
                data: [...prevItems, uploaded],
              };
            });
          }
        }
        showAppSuccess({
          title: "Đã tải minh chứng",
          description:
            files.length === 1
              ? "File đã vào pipeline media (có thể dùng cho highlight)."
              : `Đã tải ${files.length} file vào pipeline media.`,
        });
      } catch (error) {
        showAppErrorFromUnknown(error, "classSessions.evidence.upload");
        retry();
      } finally {
        setUploadingCount((count) => Math.max(0, count - files.length));
      }
    },
    [classId, mutate, retry, sessionId],
  );

  const handleDelete = useCallback(
    async (mediaId: string) => {
      setDeletingId(mediaId);
      try {
        await deleteMedia(mediaId);
        mutate((prev) => {
          const prevItems = prev?.data ?? [];
          return {
            code: prev?.code ?? "OK",
            message: prev?.message ?? "",
            data: prevItems.filter((item) => item.id !== mediaId),
          };
        });
        showAppSuccess({
          title: "Đã xóa minh chứng",
          description: "Media đã được gỡ khỏi buổi học.",
        });
      } catch (error) {
        showAppErrorFromUnknown(error, "classSessions.evidence.delete");
      } finally {
        setDeletingId(null);
      }
    },
    [mutate],
  );

  const isUploading = uploadingCount > 0;

  return (
    <div className={cn("border-b border-border bg-muted/5 px-4 py-4 sm:px-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Minh chứng buổi học</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ảnh JPG/PNG hoặc video MP4/MOV — hệ thống xử lý để AI tạo highlight sau này.
          </p>
          {requireMediaEvidence ? (
            <p className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              Hoạt động này yêu cầu minh chứng — nên tải file trước khi hoàn thành.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={MEDIA_ACCEPT}
            multiple
            className="sr-only"
            onChange={(event) => {
              const files = event.target.files;
              if (files?.length) {
                void handleUploadFiles(files);
              }
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading || !sessionId || !classId}
            className="h-8 gap-1.5 rounded-md"
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-3.5" aria-hidden />
            )}
            {isUploading ? "Đang tải…" : "Thêm media"}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && items.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            Chưa có minh chứng. Nhấn &quot;Thêm media&quot; để tải ảnh hoặc video.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <EvidenceThumbnail
                key={item.id}
                item={item}
                deleting={deletingId === item.id}
                onDelete={() => {
                  void handleDelete(item.id);
                }}
              />
            ))}
            {isUploading
              ? Array.from({ length: Math.min(uploadingCount, 3) }).map((_, index) => (
                  <Skeleton key={`upload-${index}`} className="aspect-square rounded-xl" />
                ))
              : null}
          </div>
        )}
      </div>
    </div>
  );
}
