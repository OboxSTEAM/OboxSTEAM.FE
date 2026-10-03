"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";
import {
  createSkill,
  type CreatedSkill,
  type SkillCategory,
} from "@/lib/api";
import { showAppErrorFromUnknown, translateApiMessage } from "@/lib/errors";
import { SKILL_CATEGORY_LABELS } from "@/lib/mentors/skill-labels";
import {
  createSkillFormSchema,
  type CreateSkillFormInput,
} from "@/lib/validations/skills";
import { cn } from "@/lib/utils";

const FIELD_LABEL =
  "mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase";

const CATEGORIES = Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[];

type CreateSkillField = "code" | "name" | "category" | "subcategory";

const FIELD_BY_MESSAGE: Array<{ pattern: RegExp; field: CreateSkillField }> = [
  { pattern: /Skill code is required/i, field: "code" },
  { pattern: /Skill code cannot exceed/i, field: "code" },
  { pattern: /Skill with code '.+' already exists/i, field: "code" },
  { pattern: /Skill name is required/i, field: "name" },
  { pattern: /Skill name cannot exceed/i, field: "name" },
  { pattern: /Skill category is required/i, field: "category" },
  { pattern: /Skill subcategory cannot exceed/i, field: "subcategory" },
];

type CreateSkillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: SkillCategory;
  /** Called after the catalog row exists. Linking to a program is the caller's job. */
  onCreated: (skill: CreatedSkill) => void | Promise<void>;
};

export function CreateSkillDialog({
  open,
  onOpenChange,
  defaultCategory = "Science",
  onCreated,
}: CreateSkillDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wasOpenRef = useRef(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateSkillFormInput>({
    resolver: zodResolver(createSkillFormSchema),
    defaultValues: {
      code: "",
      name: "",
      category: defaultCategory,
      subcategory: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      reset({
        code: "",
        name: "",
        category: defaultCategory,
        subcategory: "",
        description: "",
      });
    }
    wasOpenRef.current = open;
  }, [defaultCategory, open, reset]);

  async function onSubmit(values: CreateSkillFormInput) {
    setIsSubmitting(true);
    try {
      const created = await createSkill(values);
      onOpenChange(false);
      await onCreated(created);
    } catch (error) {
      const fieldError = matchSkillCreateFieldError(error);
      if (fieldError) {
        setError(fieldError.field, { message: fieldError.message });
        if (fieldError.field === "code" && /đã bị xóa|already exists/i.test(fieldError.message)) {
          showAppErrorFromUnknown(error, "skills.create");
        }
        return;
      }
      showAppErrorFromUnknown(error, "skills.create");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollPopup className="max-w-lg">
        <form
          onSubmit={(event) => {
            event.stopPropagation();
            void handleSubmit(onSubmit)(event);
          }}
          className={dialogScrollFormClassName}
        >
          <DialogScrollHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-primary" aria-hidden />
              Tạo skill
            </DialogTitle>
            <DialogDescription>
              Thêm một dòng vào danh mục. Mã do bạn nhập — mã đã dùng, kể cả skill đã xóa, không tạo lại được.
            </DialogDescription>
          </DialogScrollHeader>
          <DialogClose />

          <DialogScrollBody className="space-y-4">
            <div>
              <label className={FIELD_LABEL} htmlFor="skill-code">
                Mã <span className="text-primary">*</span>
              </label>
              <Input
                id="skill-code"
                autoComplete="off"
                spellCheck={false}
                placeholder="SKL-ENG-SAFETY"
                disabled={isSubmitting}
                aria-invalid={!!errors.code}
                className="h-10 rounded-xl font-mono text-sm"
                {...register("code")}
              />
              <FieldError message={errors.code?.message} />
            </div>

            <div>
              <label className={FIELD_LABEL} htmlFor="skill-name">
                Tên <span className="text-primary">*</span>
              </label>
              <Input
                id="skill-name"
                placeholder="Circuit safety"
                disabled={isSubmitting}
                aria-invalid={!!errors.name}
                className="h-10 rounded-xl"
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div>
              <label className={FIELD_LABEL} htmlFor="skill-category">
                Nhóm <span className="text-primary">*</span>
              </label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="skill-category"
                      className={cn(LIGHT_SELECT_TRIGGER, "h-10 w-full rounded-xl")}
                      aria-invalid={!!errors.category}
                    >
                      <span className="truncate">
                        {SKILL_CATEGORY_LABELS[field.value]}
                      </span>
                    </SelectTrigger>
                    <SelectContent className={LIGHT_SELECT_CONTENT}>
                      {CATEGORIES.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className={LIGHT_SELECT_ITEM}
                        >
                          {SKILL_CATEGORY_LABELS[category]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.category?.message} />
            </div>

            <div>
              <label className={FIELD_LABEL} htmlFor="skill-subcategory">
                Nhánh con
              </label>
              <Input
                id="skill-subcategory"
                placeholder="Lab"
                disabled={isSubmitting}
                aria-invalid={!!errors.subcategory}
                className="h-10 rounded-xl"
                {...register("subcategory")}
              />
              <FieldError message={errors.subcategory?.message} />
            </div>

            <div>
              <label className={FIELD_LABEL} htmlFor="skill-description">
                Mô tả
              </label>
              <Textarea
                id="skill-description"
                placeholder="Use tools safely."
                disabled={isSubmitting}
                rows={3}
                className="rounded-xl"
                {...register("description")}
              />
            </div>
          </DialogScrollBody>

          <DialogScrollFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo skill"}
            </Button>
          </DialogScrollFooter>
        </form>
      </DialogScrollPopup>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-primary">{message}</p>;
}

function matchSkillCreateFieldError(
  error: unknown,
): { field: CreateSkillField; message: string } | null {
  const raw = readApiMessage(error);
  if (!raw) return null;
  const match = FIELD_BY_MESSAGE.find((item) => item.pattern.test(raw));
  if (!match) return null;
  return {
    field: match.field,
    message: translateApiMessage(raw) ?? raw,
  };
}

function readApiMessage(error: unknown): string {
  if (error instanceof ApiResponseError) return error.message;
  if (!(error instanceof ApiRequestError)) return "";
  const body = error.body as {
    message?: string;
    error?: { message?: string };
    value?: { message?: string };
  } | null;
  return body?.error?.message ?? body?.value?.message ?? body?.message ?? "";
}
