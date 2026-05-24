"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { verifyOtp } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { verifyOtpSchema } from "@/lib/validations/auth";

import { AuthField } from "./auth-field";
import { AuthFooterLink, AuthFormHeader, AuthSubmitButton } from "./auth-shell";

type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: emailFromQuery,
      otp: "",
    },
  });

  useEffect(() => {
    if (emailFromQuery) {
      setValue("email", emailFromQuery);
    }
  }, [emailFromQuery, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await verifyOtp(values);
      showAppSuccess({
        title: "Xác thực thành công",
        description: result.message,
      });
      setTimeout(() => router.push("/login"), 1200);
    } catch (error) {
      showAppErrorFromUnknown(error, "auth.verify-otp");
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col">
      <AuthFormHeader
        title="Xác thực email"
        description="Nhập mã OTP 6 chữ số đã gửi đến hộp thư của bạn"
      />

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5">
        <AuthField
          id="email"
          label="Email"
          type="email"
          readOnly={!!emailFromQuery}
          className={emailFromQuery ? "opacity-80" : undefined}
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthField
          id="otp"
          label="Mã OTP"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={6}
          error={errors.otp?.message}
          {...register("otp")}
        />

        <AuthSubmitButton isLoading={isSubmitting}>Xác thực</AuthSubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-[#6B6B6B]">
        Không nhận được mã?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#2D2D2D] underline-offset-4 hover:underline"
        >
          Đăng ký lại
        </Link>
      </p>

      <AuthFooterLink
        prompt="Đã xác thực?"
        linkLabel="Đăng nhập"
        href="/login"
      />
    </div>
  );
}
