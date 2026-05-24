"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { forgotPassword } from "@/lib/api";
import { showAppError, showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  forgotPasswordSchema,
  resetPasswordLinkParamsSchema,
} from "@/lib/validations/auth";

import { AuthFooterLink, AuthFormHeader, AuthSubmitButton } from "./auth-shell";
import { PasswordField } from "./password-field";

const resetPasswordFormSchema = z
  .object({
    newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

type ResetPasswordFormProps = {
  email: string;
  token: string;
};

export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = forgotPasswordSchema.parse({
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      const result = await forgotPassword(payload);
      showAppSuccess({
        title: "Đặt lại mật khẩu thành công",
        description: result.message,
      });
      setTimeout(() => router.push("/login"), 1200);
    } catch (error) {
      showAppErrorFromUnknown(error, "auth.reset-password");
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col">
      <AuthFormHeader
        title="Đặt lại mật khẩu"
        description={`Tạo mật khẩu mới cho ${email}`}
      />

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5">
        <PasswordField
          id="newPassword"
          label="Mật khẩu mới"
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        <PasswordField
          id="confirmPassword"
          label="Xác nhận mật khẩu"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <AuthSubmitButton isLoading={isSubmitting}>
          Cập nhật mật khẩu
        </AuthSubmitButton>
      </form>

      <AuthFooterLink
        prompt="Quay lại"
        linkLabel="Đăng nhập"
        href="/login"
      />
    </div>
  );
}

type ResetPasswordPageClientProps = {
  email: string | null;
  token: string | null;
};

export function ResetPasswordPageClient({
  email,
  token,
}: ResetPasswordPageClientProps) {
  const parsed = useMemo(() => {
    try {
      return resetPasswordLinkParamsSchema.parse({ email, token });
    } catch {
      return null;
    }
  }, [email, token]);

  useEffect(() => {
    if (!parsed) {
      showAppError({
        title: "Liên kết không hợp lệ",
        reason: "Thiếu email hoặc token trong URL.",
        action: "Mở lại liên kết từ email hoặc yêu cầu liên kết mới.",
      });
    }
  }, [parsed]);

  if (!parsed) {
    return (
      <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center">
        <AuthFooterLink
          prompt="Yêu cầu liên kết mới tại"
          linkLabel="Quên mật khẩu"
          href="/forgot-password"
        />
      </div>
    );
  }

  return <ResetPasswordForm email={parsed.email} token={parsed.token} />;
}
