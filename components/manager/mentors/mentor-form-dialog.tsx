"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { useAuthErrorShake } from "@/components/auth/use-auth-error-shake";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogScrollBody,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollPopup,
  DialogTitle,
  dialogScrollFormClassName,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMentorAccountSchema,
  type CreateMentorAccountInput,
} from "@/lib/validations/mentors";
import { cn } from "@/lib/utils";

type MentorFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (values: CreateMentorAccountInput) => Promise<void>;
};

const INPUT_CLASS =
  "h-11 rounded-xl border-input bg-card text-sm text-foreground focus-visible:ring-ring/50";

function MentorFieldError({ message }: { message?: string }) {
  const shakeRef = useRef<HTMLParagraphElement>(null);
  useAuthErrorShake(shakeRef, message);
  if (!message) return null;
  return (
    <div className="t-input-wrap is-error">
      <p ref={shakeRef} className="t-input is-error text-xs text-destructive">
        <span className="t-error-msg">{message}</span>
      </p>
    </div>
  );
}

export function MentorFormDialog({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: MentorFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMentorAccountInput>({
    resolver: zodResolver(createMentorAccountSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phone: "",
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogScrollPopup className="max-w-lg">
        <form
          className={dialogScrollFormClassName}
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
            reset();
          })}
        >
          <DialogScrollHeader>
            <DialogTitle>Tạo tài khoản Mentor</DialogTitle>
            <DialogDescription>
              Nhập email và họ tên. Hệ thống tự sinh mật khẩu tạm và gửi vào hộp
              thư Mentor. Tạo thất bại nếu không gửi được email.
            </DialogDescription>
          </DialogScrollHeader>

          <DialogScrollBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mentor-fullName">Họ tên</Label>
              <Input
                id="mentor-fullName"
                className={INPUT_CLASS}
                placeholder="Nguyễn Văn A"
                {...register("fullName")}
              />
              {errors.fullName ? (
                <MentorFieldError message={errors.fullName.message} />
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mentor-email">Email đăng nhập</Label>
              <Input
                id="mentor-email"
                type="email"
                autoComplete="off"
                className={INPUT_CLASS}
                placeholder="mentor@obox.id"
                {...register("email")}
              />
              {errors.email ? (
                <MentorFieldError message={errors.email.message} />
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mentor-phone">Số điện thoại (tuỳ chọn)</Label>
              <Input
                id="mentor-phone"
                className={INPUT_CLASS}
                placeholder="09…"
                {...register("phone")}
              />
              {errors.phone ? (
                <MentorFieldError message={errors.phone.message} />
              ) : null}
            </div>
          </DialogScrollBody>

          <DialogScrollFooter className="gap-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isSubmitting}
                />
              }
            >
              Huỷ
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn("rounded-xl font-semibold")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang tạo…
                </>
              ) : (
                "Tạo Mentor"
              )}
            </Button>
          </DialogScrollFooter>
        </form>
      </DialogScrollPopup>
    </Dialog>
  );
}
