"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { ZoomIn } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  blobToFile,
  getCroppedImageBlob,
} from "@/lib/utils/crop-image";
import { cn } from "@/lib/utils";

export type ImageCropDialogProps = {
  imageSrc: string;
  fileName: string;
  aspect: number;
  title: string;
  description: string;
  cropShape?: "rect" | "round";
  outputWidth: number;
  outputHeight: number;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export function ImageCropDialog({
  imageSrc,
  fileName,
  aspect,
  title,
  description,
  cropShape = "rect",
  outputWidth,
  outputHeight,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, {
        width: outputWidth,
        height: outputHeight,
      });
      onConfirm(blobToFile(blob, fileName));
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.media");
    } finally {
      setIsProcessing(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#2D2D2D]/60 backdrop-blur-sm"
        aria-label="Đóng"
        onClick={onCancel}
      />

      <div className="relative z-[1] flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-[#E5E5E0]">
        <div className="border-b border-[#E5E5E0] px-5 py-4">
          <h2
            id="image-crop-title"
            className="font-heading text-lg font-semibold text-[#2D2D2D]"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#6B6B6B]">{description}</p>
        </div>

        <div className="relative h-[min(52vh,360px)] w-full bg-[#1a1a1a]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={cropShape === "rect"}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            classes={{
              containerClassName: "rounded-none",
              cropAreaClassName: cn(
                "!border-2 !border-white/90 !shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]",
              ),
            }}
          />
        </div>

        <div className="space-y-4 border-t border-[#E5E5E0] px-5 py-4">
          <label className="flex items-center gap-3 text-sm font-medium text-[#2D2D2D]">
            <ZoomIn className="size-4 shrink-0 text-[#6B6B6B]" aria-hidden />
            <span className="w-14 shrink-0">Thu phóng</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#E5E5E0] accent-[#4FC3F7]"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={zoom}
            />
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] rounded-xl"
              disabled={isProcessing}
              onClick={onCancel}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="min-h-[44px] rounded-xl bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]"
              disabled={isProcessing || !croppedAreaPixels}
              onClick={() => void handleConfirm()}
            >
              {isProcessing ? "Đang xử lý…" : "Dùng ảnh này"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
