"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  ScanFace,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
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
import {
  addMediaTag,
  deleteMedia,
  deleteMediaTag,
  getMediaByClassSession,
  getMediaList,
  processMediaTags,
  updateMediaTagVerification,
  uploadClassMedia,
  type ClassSession,
  type ClassStudentRoster,
  type MediaAsset,
  type MediaTag,
} from "@/lib/api";
import {
  MEDIA_ACCEPT,
  MEDIA_VIDEO_STATUS_LABELS,
} from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

function isVideoFile(fileType: string | null | undefined, url?: string | null) {
  const type = (fileType ?? "").toLowerCase();
  if (type.includes("video") || type === "mp4" || type === "mov") return true;
  const href = (url ?? "").toLowerCase();
  return href.endsWith(".mp4") || href.endsWith(".mov");
}

function isImageFile(fileType: string | null | undefined, url?: string | null) {
  const type = (fileType ?? "").toLowerCase();
  if (type.includes("image") || type === "jpg" || type === "jpeg" || type === "png") {
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

function confidenceLabel(score: number): string {
  if (score >= 0.9) return "Rất cao";
  if (score >= 0.7) return "Cao";
  if (score >= 0.5) return "Trung bình";
  return "Thấp";
}

type MentorClassEvidencePanelProps = {
  classId: string;
  sessions: ClassSession[];
  roster: ClassStudentRoster[];
  isSessionsLoading?: boolean;
};

export function MentorClassEvidencePanel({
  classId,
  sessions,
  roster,
  isSessionsLoading = false,
}: MentorClassEvidencePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionFilter, setSessionFilter] = useState("all");
  const [uploadSessionId, setUploadSessionId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [previewOverride, setPreviewOverride] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [busyTagStudentId, setBusyTagStudentId] = useState<string | null>(null);
  const [isProcessingTags, setIsProcessingTags] = useState(false);
  const [addTagStudentId, setAddTagStudentId] = useState("");

  const activeStudents = useMemo(
    () => roster.filter((student) => student.enrollmentStatus === "Active"),
    [roster],
  );

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: async () => {
      if (sessionFilter !== "all") {
        return getMediaByClassSession(sessionFilter);
      }
      return getMediaList({ classId });
    },
    deps: [classId, sessionFilter],
    onError: (error) => showAppErrorFromUnknown(error, "media.list"),
  });

  const mediaItems = data?.data ?? [];
  const selectedFromList = mediaItems.find((item) => item.id === selectedMediaId);
  const selectedMedia =
    selectedFromList ??
    (previewOverride?.id === selectedMediaId ? previewOverride : null);

  useEffect(() => {
    if (
      previewOverride &&
      mediaItems.some((item) => item.id === previewOverride.id)
    ) {
      setPreviewOverride(null);
    }
  }, [mediaItems, previewOverride]);

  const sessionTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of sessions) {
      map.set(session.id, session.title || "Buổi học");
    }
    return map;
  }, [sessions]);

  const untaggedStudents = useMemo(() => {
    if (!selectedMedia) return activeStudents;
    const tagged = new Set(selectedMedia.tags.map((tag) => tag.studentId));
    return activeStudents.filter((student) => !tagged.has(student.studentId));
  }, [activeStudents, selectedMedia]);

  async function handleUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadClassMedia(file, {
        classId,
        classSessionId: uploadSessionId || undefined,
      });
      showAppSuccess({
        title: "Đã tải lên evidence",
        description: isVideoFile(file.type, file.name)
          ? "Video đang được xử lý. Có thể cần lọc đúng buổi học hoặc đợi vài phút rồi tải lại."
          : "Ảnh đã được gắn thẻ mặt tự động (nếu nhận diện được).",
      });
      if (result?.data?.id) {
        setPreviewOverride(result.data);
        setSelectedMediaId(result.data.id);
      }
      if (uploadSessionId && sessionFilter === "all") {
        markLoading();
        setSessionFilter(uploadSessionId);
      } else {
        retry();
      }
    } catch (error) {
      showAppErrorFromUnknown(error, "media.upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMedia(deleteTarget.id);
      showAppSuccess({
        title: "Đã xóa media",
        description: "Evidence đã được gỡ khỏi lớp.",
      });
      if (selectedMediaId === deleteTarget.id) setSelectedMediaId(null);
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
      await processMediaTags(media.id);
      showAppSuccess({
        title: "Đã gửi yêu cầu gắn thẻ",
        description: "Hệ thống đang quét khuôn mặt. Tải lại sau vài phút nếu chưa thấy thẻ.",
      });
      retry();
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
      await updateMediaTagVerification(selectedMedia.id, tag.studentId, {
        isVerified,
      });
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
      await addMediaTag(selectedMedia.id, { studentId: addTagStudentId });
      const student = activeStudents.find((s) => s.studentId === addTagStudentId);
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

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border bg-muted/40 px-6 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ScanFace className="size-4 text-primary" />
              Evidence & face tagging
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload ảnh/video buổi học, xác nhận thẻ mặt AI và gắn thủ công học viên.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Lọc theo buổi
              </p>
              <Select
                value={sessionFilter}
                onValueChange={(value) => {
                  markLoading();
                  setSessionFilter(value ?? "all");
                }}
                disabled={isSessionsLoading}
              >
                <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "min-w-[14rem]")}>
                  <span className="truncate">
                    {sessionFilter === "all"
                      ? "Tất cả media của lớp"
                      : sessionTitleById.get(sessionFilter) || "Buổi học"}
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  sideOffset={8}
                  className={THEME_SELECT_CONTENT}
                >
                  <SelectItem value="all" className={THEME_SELECT_ITEM}>
                    Tất cả media của lớp
                  </SelectItem>
                  {sessions.map((session) => (
                    <SelectItem
                      key={session.id}
                      value={session.id}
                      className={THEME_SELECT_ITEM}
                    >
                      {session.title || "Buổi học"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Gắn buổi khi upload
              </p>
              <Select
                value={uploadSessionId || "none"}
                onValueChange={(value) =>
                  setUploadSessionId(!value || value === "none" ? "" : value)
                }
                disabled={isSessionsLoading}
              >
                <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "min-w-[14rem]")}>
                  <span className="truncate">
                    {uploadSessionId
                      ? sessionTitleById.get(uploadSessionId) || "Buổi học"
                      : "Không gắn buổi"}
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  sideOffset={8}
                  className={THEME_SELECT_CONTENT}
                >
                  <SelectItem value="none" className={THEME_SELECT_ITEM}>
                    Không gắn buổi
                  </SelectItem>
                  {sessions.map((session) => (
                    <SelectItem
                      key={session.id}
                      value={session.id}
                      className={THEME_SELECT_ITEM}
                    >
                      {session.title || "Buổi học"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={MEDIA_ACCEPT}
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
            {isUploading ? "Đang tải..." : "Tải lên evidence"}
          </Button>
        </div>
      </div>

      <div className="p-6">
        {isLoading && mediaItems.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : mediaItems.length === 0 ? (
          <ManagerEmptyState
            title="Chưa có evidence"
            description="Tải ảnh hoặc video buổi học để AI gắn thẻ học viên vào portfolio."
            icon={ScanFace}
            actionLabel="Tải lên evidence"
            onAction={() => fileInputRef.current?.click()}
          />
        ) : (
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
              isLoading && "opacity-60",
            )}
          >
            {mediaItems.map((media) => {
              const verifiedCount = media.tags.filter((tag) => tag.isVerified).length;
              const video = isVideoFile(media.fileType, media.fileUrl);

              return (
                <article
                  key={media.id}
                  className="overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedMediaId(media.id)}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-[4/3] bg-muted">
                      {media.fileUrl && isImageFile(media.fileType, media.fileUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={media.fileUrl}
                          alt="Evidence"
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
                        <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                          Không có preview
                        </div>
                      )}
                      <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                        <Badge
                          variant="outline"
                          className="rounded-full border-border/80 bg-background/90 text-[10px] font-semibold"
                        >
                          {video ? "Video" : "Ảnh"}
                        </Badge>
                        {!media.isReady ? (
                          <Badge className="rounded-full bg-[#FDD835]/90 text-[10px] font-semibold text-[#8A7200] hover:bg-[#FDD835]/90">
                            {MEDIA_VIDEO_STATUS_LABELS[media.videoStatus]}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>

                  <div className="space-y-2 p-3">
                    <p className="truncate text-xs text-muted-foreground">
                      {media.classSessionId
                        ? sessionTitleById.get(media.classSessionId) || "Buổi học"
                        : "Không gắn buổi"}
                      {" · "}
                      {formatApiDateTimeDisplay(media.uploadedAt) || "—"}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {media.tags.length} thẻ
                        {verifiedCount > 0 ? ` · ${verifiedCount} đã xác nhận` : ""}
                      </p>
                      <div className="flex gap-1">
                        {video &&
                        (media.videoStatus === "PendingTagging" ||
                          media.videoStatus === "Failed" ||
                          (!media.isReady && media.videoStatus !== "Transcoding")) ? (
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
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={selectedMedia != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMediaId(null);
            setPreviewOverride(null);
            setAddTagStudentId("");
          }
        }}
      >
        <DialogScrollPopup className="sm:max-w-3xl max-h-[min(92vh,48rem)]">
          <DialogScrollHeader>
            <DialogClose />
            <DialogTitle>Chi tiết evidence</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Xem preview, xác nhận face tag AI hoặc gắn thủ công học viên trong lớp.
            </DialogDescription>
          </DialogScrollHeader>

          {selectedMedia ? (
            <DialogScrollBody>
              <div className="overflow-hidden rounded-xl border border-border bg-muted">
                {selectedMedia.fileUrl &&
                isImageFile(selectedMedia.fileType, selectedMedia.fileUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedMedia.fileUrl}
                    alt="Evidence preview"
                    className="mx-auto max-h-72 object-contain"
                  />
                ) : selectedMedia.fileUrl &&
                  isVideoFile(selectedMedia.fileType, selectedMedia.fileUrl) ? (
                  <video
                    src={selectedMedia.fileUrl}
                    controls
                    className="mx-auto max-h-72 w-full bg-black"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                    Không có file xem trước
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full">
                  {MEDIA_VIDEO_STATUS_LABELS[selectedMedia.videoStatus]}
                </Badge>
                {selectedMedia.statusLabel ? (
                  <Badge variant="outline" className="rounded-full">
                    {selectedMedia.statusLabel}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="rounded-full">
                  {selectedMedia.isReady ? "Sẵn sàng" : "Đang xử lý"}
                </Badge>
              </div>

              {isVideoFile(selectedMedia.fileType, selectedMedia.fileUrl) &&
              !selectedMedia.isReady ? (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessingTags}
                    onClick={() => void handleProcessTags(selectedMedia)}
                    className="rounded-lg"
                  >
                    {isProcessingTags ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ScanFace className="size-4" />
                    )}
                    Quét face tagging
                  </Button>
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Thẻ học viên ({selectedMedia.tags.length})
                  </h3>
                </div>

                {selectedMedia.tags.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    Chưa có thẻ mặt. Thêm thủ công hoặc chờ AI xử lý.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedMedia.tags.map((tag) => (
                      <li
                        key={tag.id}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {tag.studentName || "Học viên"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Độ tin cậy {Math.round(tag.confidenceScore * 100)}% (
                            {confidenceLabel(tag.confidenceScore)})
                            {tag.hasOtherFaces ? " · Có nhiều khuôn mặt" : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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
                            className="h-8 rounded-lg"
                          >
                            {tag.isVerified ? "Bỏ xác nhận" : "Xác nhận"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={busyTagStudentId === tag.studentId}
                            onClick={() => void handleRemoveTag(tag)}
                            className="size-8 text-muted-foreground hover:text-destructive"
                            aria-label="Gỡ thẻ"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center">
                  <Select
                    value={addTagStudentId || null}
                    onValueChange={(value) => setAddTagStudentId(value ?? "")}
                    disabled={untaggedStudents.length === 0}
                  >
                    <SelectTrigger
                      className={cn(THEME_SELECT_TRIGGER, "w-full flex-1")}
                    >
                      <span className="truncate">
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
                          {student.studentName || student.studentCode || "Học viên"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    disabled={!addTagStudentId || busyTagStudentId === addTagStudentId}
                    onClick={() => void handleAddTag()}
                    className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus className="size-4" />
                    Gắn thẻ
                  </Button>
                </div>
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
        title="Xóa evidence?"
        description="Media và các thẻ liên quan sẽ bị gỡ. Thao tác không hoàn tác."
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
