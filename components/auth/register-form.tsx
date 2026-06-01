"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { register as registerAccount } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { registerSchema } from "@/lib/validations/auth";

import { AuthField } from "./auth-field";
import { AuthFooterLink, AuthFormHeader, AuthSubmitButton } from "./auth-shell";
import { PasswordField } from "./password-field";
import { RegisterRolePicker } from "./register-role-picker";

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      phone: "",
      role: "Student",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await registerAccount(values);
      showAppSuccess({
        title: "Đăng ký thành công",
        description: `${result.message} Kiểm tra email để nhập mã OTP.`,
      });
      router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      showAppErrorFromUnknown(error, "auth.register");
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col">
      <AuthFormHeader
        title="Tạo tài khoản"
        description="Điền thông tin để bắt đầu hành trình STEAM cùng OboxSTEAM"
      />

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4">
        <AuthField
          id="fullName"
          label="Họ và tên"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthField
          id="phone"
          label="Số điện thoại"
          type="tel"
          autoComplete="tel"
          placeholder="0912345678"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <RegisterRolePicker
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.role?.message}
            />
          )}
        />

        <PasswordField
          id="password"
          label="Mật khẩu"
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          error={errors.password?.message}
          {...register("password")}
        />

        <AuthSubmitButton isLoading={isSubmitting} className="mt-2">
          Đăng ký
        </AuthSubmitButton>
      </form>

      <AuthFooterLink
        prompt="Đã có tài khoản?"
        linkLabel="Đăng nhập"
        href="/login"
      />
    </div>
  );
}
