/** S3 CDN for landing-page images (mirrors public/images/*). */
export const LANDING_IMAGE_BASE =
  "https://oboxsteam-bucket.s3.ap-southeast-1.amazonaws.com/Seed/landing-page" as const;

/** Path relative to public/images, e.g. `hero/classroom.jpg`. */
export function landingImage(path: string): string {
  return `${LANDING_IMAGE_BASE}/${path.replace(/^\/+/, "")}`;
}
