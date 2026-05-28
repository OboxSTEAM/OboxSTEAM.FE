import type { Area } from "react-easy-crop";

const AVATAR_OUTPUT_SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Không đọc được ảnh.")));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = src;
  });
}

/** Renders the cropped region to a square JPEG blob for avatar upload. */
export async function getCroppedAvatarBlob(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Không thể xử lý ảnh.");
  }

  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    AVATAR_OUTPUT_SIZE,
    AVATAR_OUTPUT_SIZE,
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

export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName.replace(/\.\w+$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
