"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

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
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
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
                <p className="text-xs text-destructive">{errors.email.message}</p>
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
                <p className="text-xs text-destructive">{errors.phone.message}</p>
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
