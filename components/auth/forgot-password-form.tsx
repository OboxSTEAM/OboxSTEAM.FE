"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { sendResetLink } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { sendResetLinkSchema } from "@/lib/validations/auth";

import { AuthField } from "./auth-field";
import { AuthFooterLink, AuthFormHeader, AuthSubmitButton } from "./auth-shell";

type ForgotPasswordFormValues = z.infer<typeof sendResetLinkSchema>;

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(sendResetLinkSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await sendResetLink(values);
      showAppSuccess({
        title: "Đã gửi liên kết",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "auth.forgot-password");
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col">
      <AuthFormHeader
        title="Quên mật khẩu"
        description="Nhập email đã đăng ký — chúng tôi sẽ gửi liên kết đặt lại mật khẩu"
      />

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5">
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthSubmitButton isLoading={isSubmitting}>
          Gửi liên kết
        </AuthSubmitButton>
      </form>

      <AuthFooterLink
        prompt="Nhớ mật khẩu?"
        linkLabel="Đăng nhập"
        href="/login"
      />
    </div>
  );
}
