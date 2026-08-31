"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Images, MapPin, Pencil } from "lucide-react";

import { ClassDateRange } from "@/components/classes/class-date-range";
import { ClassSessionStatusBadge } from "@/components/manager/classes/class-status-badge";
import {
  MediaLightbox,
  type MediaLightboxItem,
} from "@/components/media/media-lightbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { useClientFetch } from "@/hooks/use-client-fetch";
import type { ClassSession } from "@/lib/api/entities/class-session";
import { listSessionEvidence } from "@/lib/api/class-sessions";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

type SessionEvidenceGalleryDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession | null;
  onEditSession?: (session: ClassSession) => void;
  className?: string;
};

function EvidenceThumb({
  url,
  onOpen,
}: {
  url: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Xem ảnh lớn hơn"
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl text-left",
        "border border-border bg-muted/20",
        "cursor-zoom-in transition-[transform,box-shadow] duration-200",
        "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      <Image
        src={url}
        alt="Minh chứng buổi học"
        fill
        sizes="160px"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        unoptimized
      />
    </button>
  );
}

export function SessionEvidenceGalleryDrawer({
  open,
  onOpenChange,
  session,
  onEditSession,
  className,
}: SessionEvidenceGalleryDrawerProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sessionId = session?.id ?? "";

  const {
    data: evidenceEnvelope,
    isLoading,
    retry,
  } = useClientFetch({
    enabled: open && Boolean(sessionId),
    fetcher: async () => listSessionEvidence(sessionId),
    deps: [open, sessionId],
    onError: (error) =>
      showAppErrorFromUnknown(error, "classSessions.evidence.list"),
  });

  const items = evidenceEnvelope?.data ?? [];

  const lightboxItems = useMemo<MediaLightboxItem[]>(() => {
    const next: MediaLightboxItem[] = [];
    for (const item of items) {
      const url = item.fileUrl?.trim();
      if (!url) continue;
      next.push({
        id: item.id,
        url,
        kind: "image",
        alt: "Minh chứng buổi học",
      });
    }
    return next;
  }, [items]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setLightboxIndex(null);
    onOpenChange(nextOpen);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetPopup
          side="right"
          className={cn(
            "w-full max-w-none sm:w-[min(100vw,28rem)] lg:w-[min(100vw,32rem)]",
            className,
          )}
        >
          <SheetHeader className="shrink-0 gap-2 pr-12 sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <SheetTitle className="flex items-center gap-2">
                  <Images className="size-4 shrink-0 text-primary" />
                  Minh chứng buổi học
                </SheetTitle>
                <p className="truncate text-sm font-semibold text-foreground">
                  {session?.title?.trim() || "Chưa đặt tiêu đề"}
                </p>
                {session ? (
                  <p className="text-xs text-muted-foreground">
                    {CLASS_SESSION_KIND_LABELS[session.sessionKind]}
                  </p>
                ) : null}
              </div>
              {session && onEditSession ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 rounded-lg text-xs"
                  onClick={() => {
                    handleOpenChange(false);
                    onEditSession(session);
                  }}
                >
                  <Pencil className="size-3" />
                  Sửa buổi
                </Button>
              ) : null}
            </div>
            <SheetClose />
          </SheetHeader>

          <SheetBody className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 sm:px-5">
            {session ? (
              <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ClassSessionStatusBadge status={session.status} />
                  <ClassDateRange
                    startDate={session.startTime}
                    endDate={session.endTime}
                    layout="inline"
                  />
                </div>
                {session.location?.trim() ? (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{session.location}</span>
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Ảnh do mentor tải lên tại hiện trường — chỉ xem, không chỉnh sửa.
                </p>
              </div>
            ) : null}

            {isLoading && items.length === 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                <Images
                  className="mx-auto size-8 text-muted-foreground/60"
                  aria-hidden
                />
                <p className="mt-3 text-sm font-medium text-foreground">
                  Chưa có ảnh minh chứng
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mentor có thể tải ảnh trong panel điểm danh khi buổi Offline diễn ra.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 h-8 rounded-lg text-xs"
                  onClick={() => retry()}
                >
                  Tải lại
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium text-muted-foreground">
                  {items.length} ảnh
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {lightboxItems.map((item, index) => (
                    <EvidenceThumb
                      key={item.id}
                      url={item.url}
                      onOpen={() => setLightboxIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </SheetBody>
        </SheetPopup>
      </Sheet>

      <MediaLightbox
        items={lightboxItems}
        index={lightboxIndex}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}
