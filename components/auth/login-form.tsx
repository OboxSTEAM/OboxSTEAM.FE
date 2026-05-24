"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { login } from "@/lib/api";
import {
  clearRememberedEmail,
  getRememberedEmail,
  persistAuthTokens,
  persistRememberedEmail,
} from "@/lib/auth/session";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { loginSchema } from "@/lib/validations/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { AuthField } from "./auth-field";
import { AuthFooterLink, AuthFormHeader, AuthSubmitButton } from "./auth-shell";
import { PasswordField } from "./password-field";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const saved = getRememberedEmail();
    if (saved) {
      setValue("email", saved);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await login({
        email: values.email,
        password: values.password,
      });

      persistAuthTokens(result.data);

      if (rememberMe) {
        persistRememberedEmail(values.email);
      } else {
        clearRememberedEmail();
      }

      showAppSuccess({
        title: "Đăng nhập thành công",
        description: result.message,
      });
      router.push("/");
    } catch (error) {
      showAppErrorFromUnknown(error, "auth.login");
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col">
      <AuthFormHeader
        title="Chào mừng trở lại"
        description="Nhập email và mật khẩu để truy cập tài khoản OboxSTEAM"
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

        <PasswordField
          id="password"
          label="Mật khẩu"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label htmlFor="remember" className="text-sm font-normal text-[#6B6B6B]">
              Ghi nhớ đăng nhập
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-[#6B6B6B] underline-offset-4 hover:text-[#2D2D2D] hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <AuthSubmitButton isLoading={isSubmitting}>Đăng nhập</AuthSubmitButton>
      </form>

      <AuthFooterLink
        prompt="Chưa có tài khoản?"
        linkLabel="Đăng ký"
        href="/register"
      />
    </div>
  );
}
