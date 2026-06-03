"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthField } from "@/components/auth/auth-field";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { completeParentProfile } from "@/lib/api";
import { clearParentProfilePending } from "@/lib/auth/parent-profile";
import { clearAuthSession } from "@/lib/auth/session";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { completeParentProfileSchema } from "@/lib/validations/parent";
import { useCurrentUser } from "@/hooks/use-current-user";

const completeParentProfileFormSchema = completeParentProfileSchema
  .extend({
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

type CompleteParentProfileFormValues = z.infer<typeof completeParentProfileFormSchema>;

type ParentProfileCompletionDialogProps = {
  open: boolean;
};

export function ParentProfileCompletionDialog({
  open,
}: ParentProfileCompletionDialogProps) {
  const router = useRouter();
  const { profile, refresh } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompleteParentProfileFormValues>({
    resolver: zodResolver(completeParentProfileFormSchema),
    defaultValues: {
      fullName: profile?.fullName ?? "",
      phone: profile?.phone ?? "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = completeParentProfileSchema.parse({
        fullName: values.fullName,
        phone: values.phone,
        password: values.password,
      });
      const result = await completeParentProfile(payload);
      clearParentProfilePending();
      await refresh();
      showAppSuccess({
        title: "Hoàn tất hồ sơ thành công",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "parent.complete-profile");
    }
  });

  const handleLogout = () => {
    clearParentProfilePending();
    clearAuthSession();
    router.push("/login");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* Blocking: profile must be completed before dismiss */
      }}
      disablePointerDismissal
      modal
    >
      <DialogPopup className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hoàn tất hồ sơ phụ huynh</DialogTitle>
          <DialogDescription>
            Tài khoản của bạn đang ở chế độ tạm thời. Vui lòng cập nhật họ tên, số
            điện thoại và đặt mật khẩu — nếu không, bạn sẽ không thể đăng nhập lại
            lần sau.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
          <AuthField
            id="parentFullName"
            label="Họ và tên"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          <AuthField
            id="parentPhone"
            label="Số điện thoại"
            type="tel"
            autoComplete="tel"
            placeholder="09xxxxxxxx"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <PasswordField
            id="parentPassword"
            label="Mật khẩu mới"
            autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự"
            error={errors.password?.message}
            {...register("password")}
          />

          <PasswordField
            id="parentConfirmPassword"
            label="Xác nhận mật khẩu"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-[#E94B3C] text-base font-semibold text-white hover:bg-[#d43e30]"
          >
            {isSubmitting ? "Đang lưu…" : "Hoàn tất hồ sơ"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#6B6B6B]">
          <button
            type="button"
            onClick={handleLogout}
            className="underline-offset-4 hover:text-[#2D2D2D] hover:underline"
          >
            Đăng xuất
          </button>
          {" · "}
          <Link
            href="/profile"
            className="underline-offset-4 hover:text-[#2D2D2D] hover:underline"
          >
            Xem hồ sơ
          </Link>
        </p>
      </DialogPopup>
    </Dialog>
  );
}
