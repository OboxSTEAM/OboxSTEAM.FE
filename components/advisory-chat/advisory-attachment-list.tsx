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

type AttachmentGroupProps = {
  programId: string;
  attachments: DiscussionAttachment[];
  /** Shown per attachment when the viewer can edit the curriculum. */
  onSaveAsMaterial?: (attachment: DiscussionAttachment) => void;
  className?: string;
};

/** Splits a message's attachments into images (shown outside the bubble) and files. */
export function splitAttachments(attachments: DiscussionAttachment[]) {
  const images: DiscussionAttachment[] = [];
  const files: DiscussionAttachment[] = [];
  for (const attachment of attachments) {
    (attachment.kind === "Image" ? images : files).push(attachment);
  }
  return { images, files };
}

/**
 * Message images outside the text bubble: one image keeps its own aspect ratio
 * inside a capped box, several images form a grid of square tiles.
 */
export function AdvisoryAttachmentImages({
  programId,
  attachments: images,
  onSaveAsMaterial,
  className,
}: AttachmentGroupProps) {
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

  if (images.length === 0) return null;

  const isSingle = images.length === 1;

  return (
    <>
      <div
        className={cn(
          isSingle ? "flex" : "grid w-64 max-w-full gap-1",
          !isSingle && (images.length === 2 || images.length === 4 ? "grid-cols-2" : "grid-cols-3"),
          className,
        )}
      >
        {images.map((image) => {
          const url = urls[image.id];
          const itemIndex = lightboxItems.findIndex((item) => item.id === image.id);
          return (
            <div key={image.id} className="group/image relative min-w-0">
              {url ? (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(itemIndex)}
                  aria-label={`Xem ảnh ${image.fileName}`}
                  className={cn(
                    "relative block overflow-hidden bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:bg-white/6",
                    isSingle ? "rounded-2xl" : "aspect-square w-full rounded-lg",
                  )}
                >
                  {isSingle ? (
                    <NaturalSizeImage url={url} alt={image.fileName} />
                  ) : (
                    <Image
                      src={url}
                      alt={image.fileName}
                      fill
                      unoptimized
                      sizes="128px"
                      className="object-cover transition-opacity hover:opacity-90"
                    />
                  )}
                </button>
              ) : (
                <Skeleton
                  className={
                    isSingle ? "h-40 w-56 max-w-full rounded-2xl" : "aspect-square w-full rounded-lg"
                  }
                />
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
      <MediaLightbox
        items={lightboxItems}
        index={lightboxIndex}
        open={lightboxIndex !== null && lightboxIndex >= 0}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}

/** Downloadable (non-image) attachment cards, rendered inside the text bubble. */
export function AdvisoryAttachmentFiles({
  programId,
  attachments: files,
  onSaveAsMaterial,
  className,
}: AttachmentGroupProps) {
  if (files.length === 0) return null;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {files.map((file) => (
        <AttachmentFileCard
          key={file.id}
          programId={programId}
          attachment={file}
          onSaveAsMaterial={onSaveAsMaterial}
        />
      ))}
    </div>
  );
}

/** Renders at the image's own aspect ratio, capped so very large uploads stay chat-sized. */
function NaturalSizeImage({ url, alt }: { url: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <>
      {!isLoaded ? <Skeleton className="h-40 w-56 max-w-full rounded-2xl" /> : null}
      <Image
        src={url}
        alt={alt}
        width={0}
        height={0}
        unoptimized
        loading="eager"
        sizes="256px"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "block h-auto max-h-80 w-auto max-w-64 min-w-20 min-h-20 object-cover transition-opacity hover:opacity-90",
          !isLoaded && "absolute inset-0 opacity-0",
        )}
      />
    </>
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
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 dark:border-white/8 dark:bg-white/5">
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
