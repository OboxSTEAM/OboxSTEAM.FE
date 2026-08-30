import Image from "next/image";

import {
  LANDING_IMAGE_BLUR_DATA_URL,
  LANDING_IMAGE_QUALITY,
} from "@/lib/landing/assets";

type LandingDeskTextureProps = {
  src: string;
  /** Only the above-the-fold hero desk should be priority (LCP). */
  priority?: boolean;
};

/** Full-bleed wood texture with LQIP so the desk never flashes empty. */
export function LandingDeskTexture({
  src,
  priority = false,
}: LandingDeskTextureProps) {
  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      quality={LANDING_IMAGE_QUALITY}
      placeholder="blur"
      blurDataURL={LANDING_IMAGE_BLUR_DATA_URL}
      sizes="100vw"
      className="object-cover object-center"
      aria-hidden="true"
    />
  );
}
