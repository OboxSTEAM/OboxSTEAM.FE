"use client";

import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Ruler } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PROGRAM_CATEGORY_META,
  PROGRAM_CATEGORY_ORDER,
} from "@/lib/programs/constants";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";
import {
  frameworkCreateFormSchema,
  type FrameworkCreateFormValues,
} from "@/lib/validations/program-frameworks";

type FrameworkFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (values: FrameworkCreateFormValues) => Promise<void>;
};

const INPUT_CLASS =
  "h-11 rounded-xl border-input bg-card text-sm text-foreground focus-visible:ring-ring/50";

const DEFAULT_VALUES: FrameworkCreateFormValues = {
  name: "",
  description: "",
  academicGuidance: "",
  category: "Science",
};

/** Creates a framework shell; rules are configured in the editor it opens next. */
export function FrameworkFormDialog({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: FrameworkFormDialogProps) {
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FrameworkCreateFormValues>({
    resolver: zodResolver(frameworkCreateFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollPopup className="max-w-2xl">
        <form
          onSubmit={handleSubmit((values) => onSubmit(values))}
          className={dialogScrollFormClassName}
        >
          <DialogScrollHeader>
            <DialogTitle>Tạo khung chương trình</DialogTitle>
            <DialogDescription>
              Nhập thông tin chung của khung. Sau khi tạo, bạn sẽ đặt các quy tắc
              kiểm tra curriculum tự động trong trang biên tập.
            </DialogDescription>
          </DialogScrollHeader>
          <DialogClose />

          <DialogScrollBody className="space-y-6">
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <Ruler className="size-4 text-primary" />
                Thông tin khung
              </h3>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
                <div className="space-y-2">
                  <Label htmlFor="framework-name">
                    Tên khung<span className="ml-1 text-primary">*</span>
                  </Label>
                  <Input
                    id="framework-name"
                    placeholder="Ví dụ: Khung STEAM Robotics 2026"
                    {...register("name")}
                    className={INPUT_CLASS}
                  />
                  <FieldError message={errors.name?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="framework-category">Lĩnh vực STEAM</Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="framework-category"
                          className={cn(THEME_SELECT_TRIGGER, "h-11 w-full rounded-xl")}
                        >
                          <span className="truncate">
                            {PROGRAM_CATEGORY_META[field.value].label}
                          </span>
                        </SelectTrigger>
                        <SelectContent className={THEME_SELECT_CONTENT}>
                          {PROGRAM_CATEGORY_ORDER.map((category) => (
                            <SelectItem
                              key={category}
                              value={category}
                              className={THEME_SELECT_ITEM}
                            >
                              {PROGRAM_CATEGORY_META[category].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.category?.message} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="framework-description">Mô tả</Label>
                <Textarea
                  id="framework-description"
                  rows={3}
                  placeholder="Khung này áp dụng cho loại chương trình nào và kỳ vọng gì ở curriculum?"
                  {...register("description")}
                  className="rounded-xl border-input bg-card"
                />
                <FieldError message={errors.description?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="framework-academic-guidance">
                  Hướng dẫn học thuật
                </Label>
                <Textarea
                  id="framework-academic-guidance"
                  rows={4}
                  placeholder="Nêu nguyên tắc sư phạm, độ sâu kiến thức và những điều người thiết kế curriculum cần lưu ý."
                  {...register("academicGuidance")}
                  className="rounded-xl border-input bg-card"
                />
                <FieldError message={errors.academicGuidance?.message} />
              </div>
            </section>
          </DialogScrollBody>

          <DialogScrollFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-11 rounded-xl border-border px-5"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary/90 active:scale-[0.98]"
            >
              {isSubmitting ? "Đang tạo..." : "Tạo khung"}
            </Button>
          </DialogScrollFooter>
        </form>
      </DialogScrollPopup>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  const shakeRef = useRef<HTMLParagraphElement>(null);
  useAuthErrorShake(shakeRef, message);
  if (!message) return null;
  return (
    <div className="t-input-wrap is-error">
      <p ref={shakeRef} className="t-input is-error text-xs font-medium text-primary">
        <span className="t-error-msg">{message}</span>
      </p>
    </div>
  );
}
