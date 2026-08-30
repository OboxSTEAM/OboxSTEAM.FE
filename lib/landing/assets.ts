/** S3 CDN for landing-page images (mirrors public/images/*). */
export const LANDING_IMAGE_BASE =
  "https://oboxsteam-bucket.s3.ap-southeast-1.amazonaws.com/Seed/landing-page" as const;

/** Encoder quality for landing `next/image` (desk + prints). */
export const LANDING_IMAGE_QUALITY = 70;

/** Tiny warm-dark LQIP so frames/desk paint immediately while S3/WebP loads. */
export const LANDING_IMAGE_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAJElEQVR4nGOQEhGQFhWQERNAYzBgFZURE2DAKiolIsAwkEYBAEM6EAFUXYA5AAAAAElFTkSuQmCC";

/** Path relative to public/images, e.g. `hero/classroom.jpg`. */
export function landingImage(path: string): string {
  return `${LANDING_IMAGE_BASE}/${path.replace(/^\/+/, "")}`;
}
