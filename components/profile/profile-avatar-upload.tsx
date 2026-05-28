"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ImagePlus, Info, Loader2, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/api/entities/user";
import { uploadAvatar } from "@/lib/api/account";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { uploadAvatarSchema } from "@/lib/validations/account";
import { cn } from "@/lib/utils";

import { AvatarCropDialog } from "./avatar-crop-dialog";

type ProfileAvatarUploadProps = {
  profile: UserProfile;
  onUploaded: (profile: UserProfile) => void;
};

type UploadPhase = "idle" | "uploading" | "success";

type CropSource = {
  url: string;
  fileName: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function validateImageFile(file: File): boolean {
  const parsed = uploadAvatarSchema.safeParse({ file });
  if (!parsed.success) {
    showAppErrorFromUnknown(parsed.error, "account.upload-avatar");
    return false;
  }
  return true;
}

export function ProfileAvatarUpload({
  profile,
  onUploaded,
}: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const reduceMotion = useReducedMotion();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");

  const isUploading = phase === "uploading";
  const isSuccess = phase === "success";
  const isBusy = isUploading || isSuccess || Boolean(cropSource);

  const displayAvatar = previewUrl ?? profile.avatarUrl;
  const initials = getInitials(profile.fullName);

  useEffect(() => {
    return () => {
      if (cropSource?.url) URL.revokeObjectURL(cropSource.url);
    };
  }, [cropSource?.url]);

  const openCropForFile = useCallback((file: File) => {
    if (!validateImageFile(file)) return;

    const url = URL.createObjectURL(file);
    setCropSource({ url, fileName: file.name });
  }, []);

  const closeCrop = useCallback(() => {
    setCropSource((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  const uploadCroppedFile = useCallback(
    async (file: File) => {
      closeCrop();

      const parsed = uploadAvatarSchema.safeParse({ file });
      if (!parsed.success) {
        showAppErrorFromUnknown(parsed.error, "account.upload-avatar");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setPhase("uploading");

      try {
        const result = await uploadAvatar(file);
        onUploaded(result.data);
        setPreviewUrl(null);
        setPhase("success");
        showAppSuccess({
          title: "Cập nhật ảnh đại diện thành công",
          description: result.message,
        });
        window.setTimeout(() => setPhase("idle"), 1600);
      } catch (error) {
        setPreviewUrl(null);
        setPhase("idle");
        showAppErrorFromUnknown(error, "account.upload-avatar");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    },
    [closeCrop, onUploaded],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) openCropForFile(file);
  };

  const openFilePicker = () => {
    if (!isBusy) inputRef.current?.click();
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    if (!isBusy) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (isBusy) return;

    const file = event.dataTransfer.files?.[0];
    if (file) openCropForFile(file);
  };

  const motionTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <>
      {cropSource ? (
        <AvatarCropDialog
          imageSrc={cropSource.url}
          fileName={cropSource.fileName}
          onCancel={closeCrop}
          onConfirm={(file) => void uploadCroppedFile(file)}
        />
      ) : null}

      <div className="flex w-full flex-col gap-5">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onClick={openFilePicker}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          aria-label="Khu vực tải ảnh đại diện"
          aria-busy={isUploading}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-[#FAFAF5] p-6 outline-none transition-[border-color,background-color,box-shadow] sm:p-8",
            "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50 focus-visible:ring-offset-2",
            isDragging
              ? "border-[#E94B3C] bg-[#FFF5F4] shadow-[0_0_0_4px_rgba(233,75,60,0.12)]"
              : "border-[#E5E5E0] hover:border-[#d4d4cf] hover:bg-white",
            isBusy && "pointer-events-none",
          )}
        >
          <AnimatePresence>
            {isDragging ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={motionTransition}
                className="pointer-events-none absolute inset-0 z-10 bg-[#E94B3C]/[0.06]"
              />
            ) : null}
          </AnimatePresence>

          <div className="relative z-[1] flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <motion.div
                animate={
                  reduceMotion
                    ? {}
                    : isDragging
                      ? { scale: 1.04 }
                      : isUploading
                        ? { scale: 0.98 }
                        : { scale: 1 }
                }
                transition={motionTransition}
                className="relative"
              >
                <Avatar
                  className={cn(
                    "size-32 ring-4 ring-white shadow-lg sm:size-36",
                    isDragging && "ring-[#E94B3C]/30",
                  )}
                >
                  {displayAvatar ? (
                    <AvatarImage src={displayAvatar} alt={profile.fullName} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-[#E94B3C] to-[#d43e30] text-2xl font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <AnimatePresence>
                  {isUploading ? (
                    <motion.div
                      key="uploading"
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-[#2D2D2D]/55 backdrop-blur-[2px]"
                    >
                      {!reduceMotion ? (
                        <motion.span
                          className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/90 border-r-white/40"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          aria-hidden
                        />
                      ) : null}
                      <Loader2
                        className={cn(
                          "size-9 text-white",
                          !reduceMotion && "animate-spin",
                        )}
                        aria-hidden
                      />
                      <span className="sr-only">Đang tải ảnh lên</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence>
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                      transition={motionTransition}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-[#7CB342]/90"
                    >
                      <Check className="size-10 text-white" strokeWidth={2.5} />
                      <span className="sr-only">Tải lên thành công</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>

              {!isBusy ? (
                <span
                  className={cn(
                    "absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full border-2 border-white bg-[#2D2D2D] text-white shadow-md transition-transform",
                    "group-hover:scale-105",
                    isDragging && "scale-110 bg-[#E94B3C]",
                  )}
                >
                  <ImagePlus className="size-4" aria-hidden />
                </span>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <p className="font-heading text-base font-semibold text-[#2D2D2D]">
                {isDragging
                  ? "Thả ảnh để chọn"
                  : isUploading
                    ? "Đang tải lên ảnh đại diện…"
                    : "Kéo thả hoặc chọn ảnh"}
              </p>
              <p className="text-sm text-[#6B6B6B]">
                Bạn sẽ căn khung trước khi tải lên · JPG, PNG, WebP · tối đa 5 MB
              </p>
            </div>

            <motion.span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isDragging
                  ? "border-[#E94B3C]/40 bg-[#E94B3C]/10 text-[#E94B3C]"
                  : "border-[#E5E5E0] bg-white text-[#2D2D2D] group-hover:border-[#2D2D2D]/20",
              )}
              animate={reduceMotion ? {} : isDragging ? { y: -2 } : { y: 0 }}
              transition={motionTransition}
            >
              <Sparkles className="size-4 shrink-0 opacity-70" aria-hidden />
              Chọn từ thiết bị
            </motion.span>
          </div>

          <input
            ref={inputRef}
            id="avatar-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleInputChange}
            disabled={isBusy}
            aria-label="Chọn ảnh đại diện"
          />
        </div>

        <div
          role="note"
          className="flex gap-3 rounded-xl border border-[#E5E5E0] bg-gradient-to-br from-[#F5F5F0] to-white px-4 py-3.5 text-left"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E94B3C]/10">
            <Info className="size-4 text-[#E94B3C]" aria-hidden />
          </div>
          <div className="space-y-1 text-sm leading-relaxed text-[#6B6B6B]">
            <p className="font-medium text-[#2D2D2D]">Yêu cầu ảnh AI nhận diện khuôn mặt</p>
            <p>
              Dùng ảnh{" "}
              <strong className="font-semibold text-[#2D2D2D]">
                chân dung, mặt rõ và nhìn thẳng
              </strong>
              . Tránh ảnh mờ, che mặt, kính râm hoặc nhiều người — hệ thống có thể
              từ chối ảnh không đạt.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
