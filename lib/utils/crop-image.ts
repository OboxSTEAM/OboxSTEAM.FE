import type { Area } from "react-easy-crop";

const AVATAR_OUTPUT_SIZE = 512;
const COVER_OUTPUT_WIDTH = 1600;
const COVER_OUTPUT_HEIGHT = 640;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Không đọc được ảnh.")));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = src;
  });
}

/** Renders a cropped region to a JPEG blob at the given output size. */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  output: { width: number; height: number },
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Không thể xử lý ảnh.");
  }

  canvas.width = output.width;
  canvas.height = output.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    output.width,
    output.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Không tạo được ảnh đã cắt."));
      },
      "image/jpeg",
      0.92,
    );
  });
}

/** Square crop for avatar upload. */
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
