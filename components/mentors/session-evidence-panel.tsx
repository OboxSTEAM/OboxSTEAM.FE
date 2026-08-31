"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import type { MediaAsset } from "@/lib/api/entities/media";
import {
  deleteSessionEvidence,
  listSessionEvidence,
  uploadSessionEvidence,
} from "@/lib/api/class-sessions";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { uploadSessionEvidenceSchema } from "@/lib/validations/class-sessions";
import { cn } from "@/lib/utils";

type SessionEvidencePanelProps = {
  sessionId: string;
  requireMediaEvidence?: boolean;
  onCountChange?: (count: number) => void;
  className?: string;
};

function validateEvidenceFiles(files: File[]): File[] {
  const valid: File[] = [];
  for (const file of files) {
    const parsed = uploadSessionEvidenceSchema.safeParse({ file });
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
        Không có URL
      </div>
    );
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Minh chứng buổi học"
        className="size-full object-cover"
        loading="lazy"
      />
      <Button
        type="button"
        size="icon"
        variant="destructive"
        disabled={deleting}
        className="absolute top-2 right-2 size-8 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        aria-label="Xóa ảnh minh chứng"
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
    fetcher: async () => listSessionEvidence(sessionId),
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
          const result = await uploadSessionEvidence(sessionId, file);
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
              ? "Ảnh đã được lưu cho buổi học."
              : `Đã tải ${files.length} ảnh.`,
        });
      } catch (error) {
        showAppErrorFromUnknown(error, "classSessions.evidence.upload");
        retry();
      } finally {
        setUploadingCount((count) => Math.max(0, count - files.length));
      }
    },
    [mutate, retry, sessionId],
  );

  const handleDelete = useCallback(
    async (mediaId: string) => {
      setDeletingId(mediaId);
      try {
        await deleteSessionEvidence(sessionId, mediaId);
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
          description: "Ảnh đã được gỡ khỏi buổi học.",
        });
      } catch (error) {
        showAppErrorFromUnknown(error, "classSessions.evidence.delete");
      } finally {
        setDeletingId(null);
      }
    },
    [mutate, sessionId],
  );

  const isUploading = uploadingCount > 0;

  return (
    <div className={cn("border-b border-border bg-muted/5 px-4 py-4 sm:px-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Minh chứng buổi học</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ảnh hiện trường JPG/PNG, tối đa 10 MB mỗi ảnh.
          </p>
          {requireMediaEvidence ? (
            <p className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              Hoạt động này yêu cầu minh chứng — nên tải ảnh trước khi hoàn thành.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,.jpg,.jpeg,.png"
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
            disabled={isUploading || !sessionId}
            className="h-8 gap-1.5 rounded-md"
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-3.5" aria-hidden />
            )}
            {isUploading ? "Đang tải…" : "Thêm ảnh"}
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
            Chưa có ảnh minh chứng. Nhấn &quot;Thêm ảnh&quot; để tải lên.
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
