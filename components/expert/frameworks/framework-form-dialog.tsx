"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ListChecks, Plus, Ruler, SlidersHorizontal, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { programCategorySchema } from "@/lib/api/entities/program";
import type { ProgramFramework } from "@/lib/api";
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

/** Counts stay as text so form input and parsed output share one type. */
const countTextSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d{1,4}$/.test(value),
    "Chỉ nhập số nguyên không âm.",
  );

const frameworkFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên khung.")
    .max(255, "Tên khung không được quá 255 ký tự."),
  description: z.string().trim().max(4000, "Mô tả không được quá 4000 ký tự."),
  category: programCategorySchema,
  minModules: countTextSchema,
  minOfflineSessions: countTextSchema,
  minLiveSessions: countTextSchema,
  requireCapstoneResearchMilestone: z.boolean(),
});

export type FrameworkFormValues = z.infer<typeof frameworkFormSchema>;

export type CriterionDraft = {
  /** Stable React key — criteria can be reordered and re-added before saving. */
  key: string;
  /** Set for criteria that already exist on the server. */
  id: string | null;
  name: string;
  description: string;
  maxScore: string;
};

export type FrameworkFormSubmit = (
  values: FrameworkFormValues,
  criteria: CriterionDraft[],
) => Promise<void>;

type FrameworkFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework: ProgramFramework | null;
  isSubmitting: boolean;
  onSubmit: FrameworkFormSubmit;
};

const INPUT_CLASS =
  "h-11 rounded-xl border-input bg-card text-sm text-foreground focus-visible:ring-ring/50";

function createCriterionKey(): string {
  return `criterion-${Math.random().toString(36).slice(2, 10)}`;
}

function toDefaultValues(framework: ProgramFramework | null): FrameworkFormValues {
  return {
    name: framework?.name ?? "",
    description: framework?.description ?? "",
    category: framework?.category ?? "Science",
    minModules: framework?.minModules?.toString() ?? "",
    minOfflineSessions: framework?.minOfflineSessions?.toString() ?? "",
    minLiveSessions: framework?.minLiveSessions?.toString() ?? "",
    requireCapstoneResearchMilestone:
      framework?.requireCapstoneResearchMilestone ?? false,
  };
}

function toCriterionDrafts(framework: ProgramFramework | null): CriterionDraft[] {
  if (!framework) return [];
  return [...framework.criteria]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((criterion) => ({
      key: criterion.id,
      id: criterion.id,
      name: criterion.name,
      description: criterion.description,
      maxScore: criterion.maxScore.toString(),
    }));
}

export function FrameworkFormDialog({
  open,
  onOpenChange,
  framework,
  isSubmitting,
  onSubmit,
}: FrameworkFormDialogProps) {
  const frameworkId = framework?.id ?? null;
  const [criteria, setCriteria] = useState<CriterionDraft[]>(() =>
    toCriterionDrafts(framework),
  );
  const [criteriaError, setCriteriaError] = useState<string | null>(null);

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FrameworkFormValues>({
    resolver: zodResolver(frameworkFormSchema),
    defaultValues: toDefaultValues(framework),
  });

  useEffect(() => {
    if (!open) return;
    reset(toDefaultValues(framework));
    // Reset only when the dialog opens or switches to another framework.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seed drafts on open
    setCriteria(toCriterionDrafts(framework));
    setCriteriaError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [frameworkId, open, reset]);

  function updateCriterion(key: string, patch: Partial<CriterionDraft>) {
    setCriteria((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function validateCriteria(): boolean {
    for (const criterion of criteria) {
      if (!criterion.name.trim()) {
        setCriteriaError("Mỗi tiêu chí cần có tên.");
        return false;
      }
      const maxScore = Number(criterion.maxScore);
      if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 100) {
        setCriteriaError("Điểm tối đa của mỗi tiêu chí phải là số nguyên 1–100.");
        return false;
      }
    }
    setCriteriaError(null);
    return true;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollPopup className="max-w-4xl">
        <form
          onSubmit={handleSubmit((values) => {
            if (!validateCriteria()) return;
            return onSubmit(values, criteria);
          })}
          className={dialogScrollFormClassName}
        >
          <DialogScrollHeader>
            <DialogTitle>
              {framework ? "Cập nhật khung chương trình" : "Tạo khung chương trình"}
            </DialogTitle>
            <DialogDescription>
              Blueprint quy định yêu cầu tối thiểu và bộ tiêu chí rubric dùng khi
              thẩm định chương trình.
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
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <SlidersHorizontal className="size-4 text-primary" />
                Yêu cầu tối thiểu
              </h3>
              <p className="-mt-2 text-xs leading-5 text-muted-foreground">
                Để trống nếu khung không ràng buộc chỉ số đó.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="framework-min-modules">Số học phần tối thiểu</Label>
                  <Input
                    id="framework-min-modules"
                    inputMode="numeric"
                    placeholder="—"
                    {...register("minModules")}
                    className={INPUT_CLASS}
                  />
                  <FieldError message={errors.minModules?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="framework-min-offline">Buổi offline tối thiểu</Label>
                  <Input
                    id="framework-min-offline"
                    inputMode="numeric"
                    placeholder="—"
                    {...register("minOfflineSessions")}
                    className={INPUT_CLASS}
                  />
                  <FieldError message={errors.minOfflineSessions?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="framework-min-live">Buổi live tối thiểu</Label>
                  <Input
                    id="framework-min-live"
                    inputMode="numeric"
                    placeholder="—"
                    {...register("minLiveSessions")}
                    className={INPUT_CLASS}
                  />
                  <FieldError message={errors.minLiveSessions?.message} />
                </div>
              </div>

              <Controller
                control={control}
                name="requireCapstoneResearchMilestone"
                render={({ field }) => (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/60 p-4">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      className="mt-0.5 border-input data-checked:border-primary data-checked:bg-primary"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Bắt buộc có capstone / mốc nghiên cứu
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Chương trình theo khung này phải có ít nhất một mốc nghiên cứu
                        tổng kết.
                      </span>
                    </span>
                  </label>
                )}
              />
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                  <ListChecks className="size-4 text-primary" />
                  Tiêu chí rubric
                </h3>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {criteria.length} tiêu chí
                </span>
              </div>

              {criteria.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Chưa có tiêu chí. Thêm tiêu chí để chuyên gia chấm điểm khi thẩm định.
                </p>
              ) : (
                <ul className="space-y-3">
                  {criteria.map((criterion, index) => (
                    <li
                      key={criterion.key}
                      className="grid gap-2 rounded-xl border border-border bg-background/60 p-3 sm:grid-cols-[minmax(0,1fr)_6.5rem_auto]"
                    >
                      <div className="space-y-2">
                        <Input
                          value={criterion.name}
                          onChange={(event) =>
                            updateCriterion(criterion.key, {
                              name: event.target.value,
                            })
                          }
                          placeholder={`Tiêu chí ${index + 1}`}
                          className="h-10 rounded-lg border-input bg-card text-sm"
                        />
                        <Input
                          value={criterion.description}
                          onChange={(event) =>
                            updateCriterion(criterion.key, {
                              description: event.target.value,
                            })
                          }
                          placeholder="Mô tả cách chấm (không bắt buộc)"
                          className="h-10 rounded-lg border-input bg-card text-xs"
                        />
                      </div>
                      <Input
                        value={criterion.maxScore}
                        inputMode="numeric"
                        onChange={(event) =>
                          updateCriterion(criterion.key, {
                            maxScore: event.target.value,
                          })
                        }
                        placeholder="Điểm tối đa"
                        aria-label={`Điểm tối đa của tiêu chí ${index + 1}`}
                        className="h-10 rounded-lg border-input bg-card text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setCriteria((prev) =>
                            prev.filter((item) => item.key !== criterion.key),
                          )
                        }
                        aria-label={`Xóa tiêu chí ${criterion.name || index + 1}`}
                        className="size-10 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {criteriaError ? (
                <p className="text-xs font-medium text-primary">{criteriaError}</p>
              ) : null}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCriteria((prev) => [
                    ...prev,
                    {
                      key: createCriterionKey(),
                      id: null,
                      name: "",
                      description: "",
                      maxScore: "10",
                    },
                  ])
                }
                className="h-10 w-full gap-2 rounded-xl border-dashed"
              >
                <Plus className="size-4" />
                Thêm tiêu chí
              </Button>
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
              {isSubmitting
                ? "Đang lưu..."
                : framework
                  ? "Lưu thay đổi"
                  : "Tạo khung"}
            </Button>
          </DialogScrollFooter>
        </form>
      </DialogScrollPopup>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-primary">{message}</p>;
}
