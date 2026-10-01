"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BookmarkPlus, Download, FileText } from "lucide-react";

import { MediaLightbox, type MediaLightboxItem } from "@/components/media/media-lightbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { openAttachmentInNewTab, useAttachmentUrls } from "@/hooks/use-attachment-url";
import { formatAttachmentSize } from "@/lib/advisory/attachment-format";
import type { DiscussionAttachment } from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

type AdvisoryAttachmentListProps = {
  programId: string;
  attachments: DiscussionAttachment[];
  /** Shown per attachment when the viewer can edit the curriculum. */
  onSaveAsMaterial?: (attachment: DiscussionAttachment) => void;
};

/** Message attachments: image thumbnails (lightbox) and downloadable file cards. */
export function AdvisoryAttachmentList({
  programId,
  attachments,
  onSaveAsMaterial,
}: AdvisoryAttachmentListProps) {
  const images = useMemo(
    () => attachments.filter((attachment) => attachment.kind === "Image"),
    [attachments],
  );
  const files = useMemo(
    () => attachments.filter((attachment) => attachment.kind !== "Image"),
    [attachments],
  );
  const imageIds = useMemo(() => images.map((image) => image.id), [images]);
  const urls = useAttachmentUrls(programId, imageIds);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxItems = useMemo<MediaLightboxItem[]>(
    () =>
      images.flatMap((image) => {
        const url = urls[image.id];
        return url ? [{ id: image.id, url, kind: "image" as const, alt: image.fileName }] : [];
      }),
    [images, urls],
  );

  if (attachments.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {images.length > 0 ? (
        <div className={cn("grid gap-1.5", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {images.map((image) => {
            const url = urls[image.id];
            const itemIndex = lightboxItems.findIndex((item) => item.id === image.id);
            return (
              <div key={image.id} className="group/image relative">
                {url ? (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(itemIndex)}
                    aria-label={`Xem ảnh ${image.fileName}`}
                    className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Image
                      src={url}
                      alt={image.fileName}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 180px, 45vw"
                      className="object-cover"
                    />
                  </button>
                ) : (
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                )}
                {onSaveAsMaterial ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    onClick={() => onSaveAsMaterial(image)}
                    aria-label={`Lưu ${image.fileName} thành tài liệu hoạt động`}
                    title="Lưu thành tài liệu hoạt động"
                    className="absolute top-1.5 right-1.5 shadow-sm lg:opacity-0 lg:group-hover/image:opacity-100 lg:focus-visible:opacity-100"
                  >
                    <BookmarkPlus className="size-4" />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {files.map((file) => (
        <AttachmentFileCard
          key={file.id}
          programId={programId}
          attachment={file}
          onSaveAsMaterial={onSaveAsMaterial}
        />
      ))}

      <MediaLightbox
        items={lightboxItems}
        index={lightboxIndex}
        open={lightboxIndex !== null && lightboxIndex >= 0}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}

function AttachmentFileCard({
  programId,
  attachment,
  onSaveAsMaterial,
}: {
  programId: string;
  attachment: DiscussionAttachment;
  onSaveAsMaterial?: (attachment: DiscussionAttachment) => void;
}) {
  const size = formatAttachmentSize(attachment.sizeBytes);

  function handleOpen() {
    openAttachmentInNewTab(programId, attachment.id).catch((error: unknown) =>
      showAppErrorFromUnknown(error, "advisory.attachment.open"),
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2">
      <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground" title={attachment.fileName}>
          {attachment.fileName}
        </p>
        {size ? <p className="text-xs text-muted-foreground">{size}</p> : null}
      </div>
      {onSaveAsMaterial ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={() => onSaveAsMaterial(attachment)}
          aria-label={`Lưu ${attachment.fileName} thành tài liệu hoạt động`}
          title="Lưu thành tài liệu hoạt động"
        >
          <BookmarkPlus className="size-4" />
        </Button>
      ) : null}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={handleOpen}
        aria-label={`Mở ${attachment.fileName}`}
        title="Mở / tải xuống"
      >
        <Download className="size-4" />
      </Button>
    </div>
  );
}
