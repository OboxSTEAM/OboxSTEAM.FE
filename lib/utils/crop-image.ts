import type { Area } from "react-easy-crop";

const AVATAR_OUTPUT_SIZE = 1024;
const COVER_OUTPUT_WIDTH = 1600;
const COVER_OUTPUT_HEIGHT = 640;
const JPEG_QUALITY = 0.95;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Không đọc được ảnh.")));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = src;
  });
}

function clampCropToImage(image: HTMLImageElement, pixelCrop: Area): Area {
  const x = Math.max(0, Math.round(pixelCrop.x));
  const y = Math.max(0, Math.round(pixelCrop.y));
  const width = Math.max(1, Math.min(image.naturalWidth - x, Math.round(pixelCrop.width)));
  const height = Math.max(1, Math.min(image.naturalHeight - y, Math.round(pixelCrop.height)));
  return { x, y, width, height };
}

/** Downscale to max size; never upscale a smaller crop (that would blur the face). */
function capOutputToSource(
  cropWidth: number,
  cropHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxWidth / cropWidth, maxHeight / cropHeight);
  return {
    width: Math.max(1, Math.round(cropWidth * scale)),
    height: Math.max(1, Math.round(cropHeight * scale)),
  };
}

/** Renders a cropped region to a high-quality JPEG, capped at `output` (no upscale). */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  output: { width: number; height: number },
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const crop = clampCropToImage(image, pixelCrop);
  const size = capOutputToSource(crop.width, crop.height, output.width, output.height);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  if (!ctx) {
    throw new Error("Không thể xử lý ảnh.");
  }

  canvas.width = size.width;
  canvas.height = size.height;

  const isDownscaling = size.width < crop.width || size.height < crop.height;
  ctx.imageSmoothingEnabled = isDownscaling;
  if (isDownscaling) {
    ctx.imageSmoothingQuality = "high";
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size.width,
    size.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Không tạo được ảnh đã cắt."));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/** Square crop for avatar upload — keep native pixels up to 1024×1024. */
export async function getCroppedAvatarBlob(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> {
  return getCroppedImageBlob(imageSrc, pixelCrop, {
    width: AVATAR_OUTPUT_SIZE,
    height: AVATAR_OUTPUT_SIZE,
  });
}

/** Wide crop for portfolio cover / hero. */
export async function getCroppedCoverBlob(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> {
  return getCroppedImageBlob(imageSrc, pixelCrop, {
    width: COVER_OUTPUT_WIDTH,
    height: COVER_OUTPUT_HEIGHT,
  });
}

export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName.replace(/\.\w+$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export const PORTFOLIO_COVER_ASPECT = COVER_OUTPUT_WIDTH / COVER_OUTPUT_HEIGHT;
export const PORTFOLIO_AVATAR_ASPECT = 1;
