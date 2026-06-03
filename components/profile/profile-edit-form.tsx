"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthField } from "@/components/auth/auth-field";
import { AuthSubmitButton } from "@/components/auth/auth-shell";
import type { UserProfile } from "@/lib/api/entities/user";
import { updateProfile } from "@/lib/api/account";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { updateProfileSchema } from "@/lib/validations/account";

type ProfileEditValues = z.infer<typeof updateProfileSchema>;

type ProfileEditFormProps = {
  profile: UserProfile;
  onUpdated: (profile: UserProfile) => void;
};

export function ProfileEditForm({ profile, onUpdated }: ProfileEditFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileEditValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
    },
  });

  useEffect(() => {
    reset({ fullName: profile.fullName ?? "", phone: profile.phone ?? "" });
  }, [profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await updateProfile(values);
      onUpdated(result.data);
      showAppSuccess({
        title: "Đã lưu hồ sơ",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "account.update-profile");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthField
        id="fullName"
        label="Họ và tên"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <AuthField
        id="phone"
        label="Số điện thoại"
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <AuthSubmitButton isLoading={isSubmitting} className="rounded-xl">
        Lưu thay đổi
      </AuthSubmitButton>
      {isDirty ? (
        <p className="text-center text-xs text-[#6B6B6B]">
          Bạn có thay đổi chưa lưu.
        </p>
      ) : null}
    </form>
  );
}
