"use client";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { MediaPipelineStatus } from "@/components/mentors/media-pipeline-status";
import { MediaTagAvatarStack, MediaStudentAvatar, MediaTagConfidence } from "@/components/mentors/media-tag-avatar-stack";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogScrollBody,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useMediaProgressPolling } from "@/hooks/use-media-progress-polling";
import {
  addMediaTag,
  deleteMedia,
  deleteMediaTag,
  getMediaById,
  getMediaList,
  processMediaTags,
  updateMediaTagVerification,
  uploadClassMedia,
  type ClassStudentRoster,
  type MediaAsset,
  type MediaProgress,
  type MediaTag,
  type MediaVideoStatus,
} from "@/lib/api";
import {
  MEDIA_ACCEPT,
  MEDIA_VIDEO_STATUS_LABELS,
} from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Eye,
  ImagePlus,
  Loader2,
  ScanFace,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function isVideoFile(fileType: string | null | undefined, url?: string | null) {
  const type = (fileType ?? "").toLowerCase();
  if (type.includes("video") || type === "mp4" || type === "mov") return true;
  const href = (url ?? "").toLowerCase();
  return href.endsWith(".mp4") || href.endsWith(".mov");
}

function isImageFile(fileType: string | null | undefined, url?: string | null) {
  const type = (fileType ?? "").toLowerCase();
  if (
    type.includes("image") ||
    type === "jpg" ||
    type === "jpeg" ||
    type === "png"
  ) {
    return true;
  }
  const href = (url ?? "").toLowerCase();
  return (
    href.endsWith(".jpg") ||
    href.endsWith(".jpeg") ||
    href.endsWith(".png") ||
    href.endsWith(".webp")
  );
}

/** AI still running — mentor should wait, not tag manually yet. */
function isAiProcessing(media: MediaAsset): boolean {
  return (
    !media.isReady &&
    media.videoStatus !== "Failed" &&
    media.videoStatus !== "None"
  );
}

/** Manual tag is fallback after AI finished (or failed). */
function canManuallyTag(media: MediaAsset): boolean {
  return media.isReady || media.videoStatus === "Failed";
}

function needsAiRetry(media: MediaAsset): boolean {
  return (
    media.videoStatus === "Failed" || media.videoStatus === "PendingTagging"
  );
}

function applyProgressToMedia(
  media: MediaAsset,
  progress: MediaProgress | undefined,
): MediaAsset {
  if (!progress) return media;
  return {
    ...media,
    videoStatus: progress.videoStatus,
    // Prefer progress flags — do not keep stale list isReady while still Transcoding.
    isReady: progress.isReady,
    statusLabel: progress.statusLabel ?? media.statusLabel,
    fileUrl: progress.fileUrl ?? media.fileUrl,
  };
}

type MediaListPage = {
  items: MediaAsset[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

const MEDIA_PAGE_SIZE = 20;

type FileTypeFilter = "all" | "image" | "video";
type VideoStatusFilter = "all" | MediaVideoStatus;

type MentorClassMediaPanelProps = {
  classId: string;
  roster: ClassStudentRoster[];
};

export function MentorClassMediaPanel({
  classId,
  roster,
}: MentorClassMediaPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<VideoStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [detailMedia, setDetailMedia] = useState<MediaAsset | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  /** Optimistic rows until paginated GET includes them. */
  const [pendingItems, setPendingItems] = useState<MediaAsset[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [busyTagStudentId, setBusyTagStudentId] = useState<string | null>(null);
  const [isProcessingTags, setIsProcessingTags] = useState(false);
  const [addTagStudentId, setAddTagStudentId] = useState("");

  const activeStudents = useMemo(
    () => roster.filter((student) => student.enrollmentStatus === "Active"),
    [roster],
  );

  const rosterByStudentId = useMemo(() => {
    const map = new Map<string, ClassStudentRoster>();
    for (const student of roster) {
      map.set(student.studentId, student);
    }
    return map;
  }, [roster]);

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: async (): Promise<MediaListPage> => {
      const result = await getMediaList({
        classId,
        fileType: fileTypeFilter === "all" ? undefined : fileTypeFilter,
        videoStatus: statusFilter === "all" ? undefined : statusFilter,
        page,
        pageSize: MEDIA_PAGE_SIZE,
        sortBy: "uploadedAt",
        isDescending: true,
      });
      const pageData = result?.data;
      return {
        items: pageData?.items ?? [],
        currentPage: pageData?.currentPage ?? page,
        totalPages: Math.max(pageData?.totalPages ?? 1, 1),
        totalCount: pageData?.totalCount ?? 0,
      };
    },
    deps: [classId, fileTypeFilter, statusFilter, page],
    onError: (error) => showAppErrorFromUnknown(error, "media.list"),
  });

  const listItems = data?.items ?? [];
  const currentPage = data?.currentPage ?? page;
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  const mediaItems = useMemo(() => {
    const listIds = new Set(listItems.map((item) => item.id));
    const extras = pendingItems.filter((item) => !listIds.has(item.id));
    return [...extras, ...listItems];
  }, [pendingItems, listItems]);

  useEffect(() => {
    if (pendingItems.length === 0 || listItems.length === 0) return;
    const listIds = new Set(listItems.map((item) => item.id));
    if (!pendingItems.some((item) => listIds.has(item.id))) return;
    setPendingItems((prev) => prev.filter((item) => !listIds.has(item.id)));
  }, [listItems, pendingItems]);

  useEffect(() => {
    setPendingItems([]);
    setPage(1);
  }, [classId]);

  function applyListFilter(update: () => void) {
    markLoading();
    setPage(1);
    update();
  }

  const selectedMediaIdRef = useRef(selectedMediaId);
  selectedMediaIdRef.current = selectedMediaId;
  const retryRef = useRef(retry);
  retryRef.current = retry;

  const trackPending = useCallback((media: MediaAsset) => {
    if (media.isReady) return;
    setPendingItems((prev) => {
      const without = prev.filter((item) => item.id !== media.id);
      return [media, ...without];
    });
  }, []);

  /** Show upload result immediately; list refresh will own the row shortly. */
  const surfaceUploaded = useCallback((media: MediaAsset) => {
    setPendingItems((prev) => {
      const without = prev.filter((item) => item.id !== media.id);
      return [media, ...without];
    });
  }, []);

  const progressTargets = useMemo(
    () =>
      mediaItems
        .filter(
          (item) =>
            !item.isReady &&
            (item.videoStatus === "Transcoding" ||
              item.videoStatus === "PendingTagging"),
        )
        .map((item) => ({
          id: item.id,
          videoStatus: item.videoStatus,
          isReady: item.isReady,
        })),
    [mediaItems],
  );

  const handleProgressTerminal = useCallback(
    async (mediaId: string, progress: MediaProgress) => {
      setPendingItems((prev) =>
        prev.map((item) =>
          item.id === mediaId ? applyProgressToMedia(item, progress) : item,
        ),
      );

      try {
        const result = await getMediaById(mediaId);
        const next = result?.data;
        if (next) {
          setPendingItems((prev) => {
            const without = prev.filter((item) => item.id !== mediaId);
            return next.isReady ? without : [next, ...without];
          });
          if (selectedMediaIdRef.current === mediaId) {
            setDetailMedia(next);
          }
        }
      } catch {
        // List retry still helps when detail fetch fails.
      }

      retryRef.current();
    },
    [],
  );

  const { progressById, timedOutIds } = useMediaProgressPolling({
    targets: progressTargets,
    onTerminal: (mediaId, progress) => {
      void handleProgressTerminal(mediaId, progress);
    },
  });

  const displayMediaItems = useMemo(
    () =>
      mediaItems.map((item) =>
        applyProgressToMedia(item, progressById[item.id]),
      ),
    [mediaItems, progressById],
  );

  const selectedMediaBase =
    detailMedia?.id === selectedMediaId
      ? detailMedia
      : (displayMediaItems.find((item) => item.id === selectedMediaId) ?? null);

  const selectedMedia = selectedMediaBase
    ? applyProgressToMedia(
        selectedMediaBase,
        progressById[selectedMediaBase.id],
      )
    : null;

  const untaggedStudents = useMemo(() => {
    if (!selectedMedia) return activeStudents;
    const tagged = new Set(selectedMedia.tags.map((tag) => tag.studentId));
    return activeStudents.filter((student) => !tagged.has(student.studentId));
  }, [activeStudents, selectedMedia]);

  async function openMediaDetail(mediaId: string) {
    setSelectedMediaId(mediaId);
    setAddTagStudentId("");
    const fromList = displayMediaItems.find((item) => item.id === mediaId);
    if (fromList) setDetailMedia(fromList);

    setIsDetailLoading(true);
    try {
      const result = await getMediaById(mediaId);
      if (result?.data) {
        setDetailMedia(result.data);
        if (!result.data.isReady) {
          trackPending(result.data);
        }
      }
    } catch (error) {
      showAppErrorFromUnknown(error, "media.detail");
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function refreshSelectedDetail(mediaId: string) {
    try {
      const result = await getMediaById(mediaId);
      if (result?.data) {
        setDetailMedia(result.data);
        if (!result.data.isReady) {
          trackPending(result.data);
        } else {
          setPendingItems((prev) => prev.filter((item) => item.id !== mediaId));
        }
      }
    } catch (error) {
      showAppErrorFromUnknown(error, "media.detail");
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const fileList = Array.from(files);

    setSelectedMediaId(null);
    setDetailMedia(null);
    setAddTagStudentId("");
    setIsUploading(true);
    setUploadProgress({ done: 0, total: fileList.length });

    let successCount = 0;
    let hasProcessing = false;

    try {
      for (let index = 0; index < fileList.length; index++) {
        const file = fileList[index];
        if (!file) continue;

        try {
          const result = await uploadClassMedia(file, {
            classId,
          });
          const uploaded = result?.data;
          if (uploaded) {
            successCount += 1;
            surfaceUploaded(uploaded);
            if (!uploaded.isReady) {
              hasProcessing = true;
            }
          }
        } catch (error) {
          showAppErrorFromUnknown(error, "media.upload");
        }

        setUploadProgress({ done: index + 1, total: fileList.length });
      }

      if (successCount > 0) {
        showAppSuccess({
          title:
            successCount === 1
              ? "Đã tải lên media"
              : `Đã tải lên ${successCount} media`,
          description: hasProcessing
            ? "Xem cột Tiến trình trên danh sách (transcode % → AI tagging)."
            : "Media đã lên danh sách — mở chi tiết để xác nhận thẻ AI.",
        });

        retry();
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMedia(deleteTarget.id);
      showAppSuccess({
        title: "Đã xóa media",
        description: "File đã được gỡ khỏi lớp.",
      });
      if (selectedMediaId === deleteTarget.id) {
        setSelectedMediaId(null);
        setDetailMedia(null);
      }
      setPendingItems((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "media.delete");
      throw error;
    }
  }

  async function handleProcessTags(media: MediaAsset) {
    setIsProcessingTags(true);
    try {
      const result = await processMediaTags(media.id);
      const next = result?.data ?? media;
      showAppSuccess({
        title: "Đã gửi yêu cầu gắn thẻ",
        description: next.isReady
          ? "Gắn thẻ đã hoàn tất."
          : "Hệ thống đang quét khuôn mặt — sẽ tự cập nhật khi xong.",
      });
      trackPending(next);
      if (selectedMediaId === media.id) {
        setDetailMedia(next);
      }
      if (next.isReady) {
        retry();
      }
    } catch (error) {
      showAppErrorFromUnknown(error, "media.processTags");
    } finally {
      setIsProcessingTags(false);
    }
  }

  async function handleVerifyTag(tag: MediaTag, isVerified: boolean) {
    if (!selectedMedia) return;
    setBusyTagStudentId(tag.studentId);
    try {
      const result = await updateMediaTagVerification(
        selectedMedia.id,
        tag.studentId,
        { isVerified },
      );
      const updatedTag = result?.data;
      if (updatedTag) {
        setDetailMedia((prev) =>
          prev && prev.id === selectedMedia.id
            ? {
                ...prev,
                tags: prev.tags.map((item) =>
                  item.studentId === updatedTag.studentId ? updatedTag : item,
                ),
              }
            : prev,
        );
      } else {
        await refreshSelectedDetail(selectedMedia.id);
      }
      showAppSuccess({
        title: isVerified ? "Đã xác nhận thẻ" : "Đã bỏ xác nhận",
        description: tag.studentName || "Học viên",
      });
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "media.tag.verify");
    } finally {
      setBusyTagStudentId(null);
    }
  }

  async function handleRemoveTag(tag: MediaTag) {
    if (!selectedMedia) return;
    setBusyTagStudentId(tag.studentId);
    try {
      await deleteMediaTag(selectedMedia.id, tag.studentId);
      setDetailMedia((prev) =>
        prev && prev.id === selectedMedia.id
          ? {
              ...prev,
              tags: prev.tags.filter((item) => item.studentId !== tag.studentId),
            }
          : prev,
      );
      showAppSuccess({
        title: "Đã gỡ thẻ",
        description: tag.studentName || "Học viên",
      });
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "media.tag.delete");
    } finally {
      setBusyTagStudentId(null);
    }
  }

  async function handleAddTag() {
    if (!selectedMedia || !addTagStudentId) return;
    setBusyTagStudentId(addTagStudentId);
    try {
      const result = await addMediaTag(selectedMedia.id, {
        studentId: addTagStudentId,
      });
      const newTag = result?.data;
      const student = activeStudents.find(
        (s) => s.studentId === addTagStudentId,
      );
      if (newTag) {
        setDetailMedia((prev) =>
          prev && prev.id === selectedMedia.id
            ? { ...prev, tags: [...prev.tags, newTag] }
            : prev,
        );
      } else {
        await refreshSelectedDetail(selectedMedia.id);
      }
      showAppSuccess({
        title: "Đã gắn thẻ học viên",
        description: student?.studentName || "Học viên",
      });
      setAddTagStudentId("");
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "media.tag.add");
    } finally {
      setBusyTagStudentId(null);
    }
  }

  const columns = useMemo<ColumnDef<MediaAsset>[]>(
    () => [
      {
        header: "Preview",
        className: "w-[4.5rem]",
        sticky: "left",
        render: (media) => {
          const video = isVideoFile(media.fileType, media.fileUrl);
          return (
            <button
              type="button"
              onClick={() => void openMediaDetail(media.id)}
              className="block size-12 overflow-hidden rounded-md border border-border bg-muted transition-opacity hover:opacity-90"
              aria-label="Xem chi tiết media"
            >
              {media.fileUrl && isImageFile(media.fileType, media.fileUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.fileUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : media.fileUrl && video ? (
                <video
                  src={media.fileUrl}
                  className="size-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                  —
                </span>
              )}
            </button>
          );
        },
      },
      {
        header: "Loại",
        render: (media) => (
          <Badge
            variant="outline"
            className="rounded-full text-[10px] font-semibold"
          >
            {isVideoFile(media.fileType, media.fileUrl) ? "Video" : "Ảnh"}
          </Badge>
        ),
      },
      {
        header: "Thời gian",
        render: (media) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatApiDateTimeDisplay(media.uploadedAt) || "—"}
          </span>
        ),
      },
      {
        header: "Tiến trình",
        className: "min-w-[10.5rem] whitespace-normal",
        render: (media) => (
          <MediaPipelineStatus
            compact
            mediaId={media.id}
            uploadedAt={media.uploadedAt}
            videoStatus={media.videoStatus}
            isReady={media.isReady}
            progress={progressById[media.id]}
            timedOut={Boolean(timedOutIds[media.id])}
          />
        ),
      },
      {
        header: "Thẻ",
        className: "min-w-[7.5rem]",
        render: (media) => (
          <MediaTagAvatarStack
            tags={media.tags}
            rosterByStudentId={rosterByStudentId}
          />
        ),
      },
      {
        header: "Thao tác",
        sticky: "right",
        className: "text-right",
        render: (media) => {
          const video = isVideoFile(media.fileType, media.fileUrl);
          const canRetryAi =
            video &&
            (media.videoStatus === "PendingTagging" ||
              media.videoStatus === "Failed");
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void openMediaDetail(media.id)}
                className="size-8 text-muted-foreground hover:text-foreground"
                aria-label="Xem chi tiết"
              >
                <Eye className="size-4" />
              </Button>
              {canRetryAi ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isProcessingTags}
                  onClick={() => void handleProcessTags(media)}
                  className="size-8 text-muted-foreground hover:text-foreground"
                  aria-label="Quét face tagging"
                >
                  <ScanFace className="size-4" />
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(media)}
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label="Xóa media"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [
      isProcessingTags,
      progressById,
      timedOutIds,
      rosterByStudentId,
    ],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border bg-muted/40 px-6 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ScanFace className="size-4 text-primary" />
              Media của lớp
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Thư viện media của cả lớp. 1) Upload ảnh/video → 2) AI nhận diện →
              3) Mentor xác nhận. Chỉ gắn thẻ thủ công khi AI lỗi hoặc bỏ sót.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Loại file
              </p>
              <Select
                value={fileTypeFilter}
                onValueChange={(value) => {
                  applyListFilter(() =>
                    setFileTypeFilter((value as FileTypeFilter) ?? "all"),
                  );
                }}
              >
                <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "min-w-[10rem]")}>
                  <span className="truncate">
                    {fileTypeFilter === "all"
                      ? "Tất cả"
                      : fileTypeFilter === "image"
                        ? "Ảnh"
                        : "Video"}
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  sideOffset={8}
                  className={THEME_SELECT_CONTENT}
                >
                  <SelectItem value="all" className={THEME_SELECT_ITEM}>
                    Tất cả
                  </SelectItem>
                  <SelectItem value="image" className={THEME_SELECT_ITEM}>
                    Ảnh
                  </SelectItem>
                  <SelectItem value="video" className={THEME_SELECT_ITEM}>
                    Video
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Trạng thái
              </p>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  applyListFilter(() =>
                    setStatusFilter((value as VideoStatusFilter) ?? "all"),
                  );
                }}
              >
                <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "min-w-[12rem]")}>
                  <span className="truncate">
                    {statusFilter === "all"
                      ? "Tất cả trạng thái"
                      : MEDIA_VIDEO_STATUS_LABELS[statusFilter]}
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  sideOffset={8}
                  className={THEME_SELECT_CONTENT}
                >
                  <SelectItem value="all" className={THEME_SELECT_ITEM}>
                    Tất cả trạng thái
                  </SelectItem>
                  {(
                    Object.keys(
                      MEDIA_VIDEO_STATUS_LABELS,
                    ) as MediaVideoStatus[]
                  ).map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className={THEME_SELECT_ITEM}
                    >
                      {MEDIA_VIDEO_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!isLoading && totalCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {totalCount} media
              {totalPages > 1
                ? ` · trang ${currentPage}/${totalPages}`
                : null}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={MEDIA_ACCEPT}
            multiple
            className="sr-only"
            onChange={(event) => void handleUpload(event.target.files)}
          />
          <Button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-10 rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {isUploading
              ? uploadProgress
                ? `Đang tải ${uploadProgress.done}/${uploadProgress.total}...`
                : "Đang tải..."
              : "Tải lên media"}
          </Button>
        </div>
      </div>

      <div className={cn("overflow-x-auto p-6", isLoading && "opacity-60")}>
        <ManagerDataTable
          columns={columns}
          data={displayMediaItems}
          isLoading={isLoading && mediaItems.length === 0}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(nextPage) => {
            markLoading();
            setPage(nextPage);
          }}
          emptyState={
            <ManagerEmptyState
              title="Chưa có media"
              description="Tải ảnh/video lên trước để AI quét nhận diện. Chỉ gắn thẻ thủ công nếu AI không nhận ra hoặc bị lỗi."
              icon={ScanFace}
              actionLabel="Tải lên media"
              onAction={() => fileInputRef.current?.click()}
            />
          }
        />
      </div>

      <Dialog
        open={selectedMediaId != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMediaId(null);
            setDetailMedia(null);
            setAddTagStudentId("");
          }
        }}
      >
        <DialogScrollPopup className="sm:max-w-3xl max-h-[min(92vh,48rem)]">
          <DialogScrollHeader>
            <DialogClose />
            <DialogTitle>Chi tiết media</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Ưu tiên kết quả AI: xác nhận thẻ nhận diện. Gắn thủ công chỉ khi AI
              lỗi hoặc bỏ sót học viên.
            </DialogDescription>
          </DialogScrollHeader>

          {isDetailLoading && !selectedMedia ? (
            <DialogScrollBody>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Skeleton className="h-64 w-full flex-1 rounded-xl" />
                <Skeleton className="h-44 w-full rounded-xl sm:w-[15.5rem]" />
              </div>
              <Skeleton className="mt-5 h-36 w-full rounded-xl" />
            </DialogScrollBody>
          ) : selectedMedia ? (
            <DialogScrollBody>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-muted">
                  {selectedMedia.fileUrl &&
                  isImageFile(selectedMedia.fileType, selectedMedia.fileUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedMedia.fileUrl}
                      alt="Media preview"
                      className="mx-auto max-h-64 object-contain sm:max-h-72"
                    />
                  ) : selectedMedia.fileUrl &&
                    isVideoFile(selectedMedia.fileType, selectedMedia.fileUrl) ? (
                    <video
                      src={selectedMedia.fileUrl}
                      controls
                      className="mx-auto max-h-64 w-full bg-black sm:max-h-72"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                      Không có file xem trước
                    </div>
                  )}
                  {isDetailLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : null}
                </div>

                <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[15.5rem]">
                  <MediaPipelineStatus
                    mediaId={selectedMedia.id}
                    uploadedAt={selectedMedia.uploadedAt}
                    videoStatus={selectedMedia.videoStatus}
                    isReady={selectedMedia.isReady}
                    progress={progressById[selectedMedia.id]}
                    timedOut={Boolean(timedOutIds[selectedMedia.id])}
                    className="max-w-none"
                  />

                  {isAiProcessing(selectedMedia) ? (
                    <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
                      <p className="text-xs font-medium text-foreground">
                        Đang xử lý pipeline
                      </p>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        Chờ AI xong rồi xác nhận thẻ. Không gắn thủ công lúc này.
                      </p>
                      {isVideoFile(
                        selectedMedia.fileType,
                        selectedMedia.fileUrl,
                      ) && needsAiRetry(selectedMedia) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isProcessingTags}
                          onClick={() => void handleProcessTags(selectedMedia)}
                          className="h-8 w-full rounded-lg"
                        >
                          {isProcessingTags ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ScanFace className="size-3.5" />
                          )}
                          Quét lại
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {selectedMedia.videoStatus === "Failed" ? (
                    <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                      <p className="text-xs font-medium text-foreground">
                        AI thất bại
                      </p>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        Quét lại hoặc gắn thẻ thủ công bên dưới.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isProcessingTags}
                        onClick={() => void handleProcessTags(selectedMedia)}
                        className="h-8 w-full rounded-lg"
                      >
                        {isProcessingTags ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <ScanFace className="size-3.5" />
                        )}
                        Quét lại AI
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-border">
                <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    Thẻ học viên
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {selectedMedia.tags.length} thẻ
                    {selectedMedia.tags.filter((t) => t.isVerified).length > 0
                      ? ` · ${selectedMedia.tags.filter((t) => t.isVerified).length} đã xác nhận`
                      : null}
                  </span>
                </div>

                <div className="p-3">
                  {selectedMedia.tags.length === 0 ? (
                    <p className="px-1 py-4 text-center text-sm text-muted-foreground">
                      {isAiProcessing(selectedMedia)
                        ? "Chưa có thẻ — đang chờ AI quét."
                        : selectedMedia.videoStatus === "Failed"
                          ? "AI chưa tạo được thẻ. Quét lại hoặc gắn thủ công."
                          : "AI không nhận diện được học viên nào. Gắn thủ công nếu cần."}
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {selectedMedia.tags.map((tag, tagIndex) => {
                        const student = rosterByStudentId.get(tag.studentId);
                        const name =
                          tag.studentName?.trim() ||
                          student?.studentName?.trim() ||
                          "Học viên";

                        return (
                          <li
                            key={`${tag.id}:${tag.studentId}:${tagIndex}`}
                            className="flex flex-col gap-2.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <MediaStudentAvatar
                                name={name}
                                avatarUrl={student?.avatarUrl}
                                isVerified={tag.isVerified}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {name}
                                </p>
                                {tag.hasOtherFaces ? (
                                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Nhiều khuôn mặt trong khung
                                  </p>
                                ) : null}
                              </div>
                              <MediaTagConfidence
                                score={tag.confidenceScore}
                                className="shrink-0"
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                              {tag.isVerified ? (
                                <Badge className="rounded-full bg-[#7CB342]/15 text-[#3d5c22] hover:bg-[#7CB342]/15 dark:text-[#b8e086]">
                                  <CheckCircle2 className="mr-1 size-3" />
                                  Đã xác nhận
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="rounded-full text-muted-foreground"
                                >
                                  Chưa xác nhận
                                </Badge>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={busyTagStudentId === tag.studentId}
                                onClick={() =>
                                  void handleVerifyTag(tag, !tag.isVerified)
                                }
                                className="h-7 rounded-lg px-2.5 text-xs"
                              >
                                {tag.isVerified ? "Bỏ xác nhận" : "Xác nhận"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={busyTagStudentId === tag.studentId}
                                onClick={() => void handleRemoveTag(tag)}
                                className="size-7 text-muted-foreground hover:text-destructive"
                                aria-label="Gỡ thẻ"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {canManuallyTag(selectedMedia) ? (
                  <div className="border-t border-border bg-muted/20 px-3 py-2.5">
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">
                        Thêm thủ công
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedMedia.videoStatus === "Failed" ||
                        selectedMedia.tags.length === 0
                          ? "Khi AI lỗi hoặc bỏ sót"
                          : "Chỉ học viên AI bỏ sót"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Select
                        value={addTagStudentId || null}
                        onValueChange={(value) =>
                          setAddTagStudentId(value ?? "")
                        }
                        disabled={untaggedStudents.length === 0}
                      >
                        <SelectTrigger
                          className={cn(THEME_SELECT_TRIGGER, "h-8 w-full flex-1")}
                        >
                          <span className="truncate text-xs">
                            {untaggedStudents.length === 0
                              ? "Tất cả học viên đã được gắn thẻ"
                              : addTagStudentId
                                ? untaggedStudents.find(
                                    (s) => s.studentId === addTagStudentId,
                                  )?.studentName || "Chọn học viên"
                                : "Chọn học viên để gắn thẻ"}
                          </span>
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          alignItemWithTrigger={false}
                          sideOffset={8}
                          className={cn(
                            THEME_SELECT_CONTENT,
                            "w-auto! min-w-[min(100vw-2rem,20rem)]",
                          )}
                        >
                          {untaggedStudents.map((student) => (
                            <SelectItem
                              key={student.studentId}
                              value={student.studentId}
                              className={THEME_SELECT_ITEM}
                            >
                              {student.studentName ||
                                student.studentCode ||
                                "Học viên"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          !addTagStudentId ||
                          busyTagStudentId === addTagStudentId
                        }
                        onClick={() => void handleAddTag()}
                        className="h-8 shrink-0 rounded-lg"
                      >
                        <UserPlus className="size-3.5" />
                        Gắn thẻ
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </DialogScrollBody>
          ) : null}

          <DialogScrollFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" className="rounded-lg" />
              }
            >
              Đóng
            </DialogClose>
          </DialogScrollFooter>
        </DialogScrollPopup>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xóa media?"
        description="Media và các thẻ liên quan sẽ bị gỡ. Thao tác không hoàn tác."
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
