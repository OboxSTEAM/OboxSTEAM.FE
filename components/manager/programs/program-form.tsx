"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  ImageOff,
  Loader2,
  Upload,
  Trash2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { uploadProgramThumbnail, type ProgramWithModules } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { programUpsertSchema, uploadProgramThumbnailSchema } from "@/lib/validations/programs";
import { cn } from "@/lib/utils";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";

// ── Types ─────────────────────────────────────────────────────────────────
export type ProgramFormValues = z.infer<typeof programUpsertSchema>;

export type ProgramFormSubmitOptions = {
  /** Local file for `POST /api/programs` create-time thumbnail (ignored on edit). */
  thumbnailFile?: File | null;
};

export type ProgramFormProps = {
  /** When set, enables multipart thumbnail update via `POST /api/programs/{id}/thumbnail`. */
  programId?: string;
  initialValues?: Partial<ProgramFormValues>;
  onSubmit: (
    values: ProgramFormValues,
    options?: ProgramFormSubmitOptions,
  ) => Promise<void>;
  onThumbnailUploaded?: (program: ProgramWithModules) => void;
  isLoading?: boolean;
  /** Cohort lock / read-only — disables fields and thumbnail upload. */
  disabled?: boolean;
  /** Extra buttons rendered in the sticky action bar */
  actionSlot?: React.ReactNode;
  /**
   * Host element for the status control (e.g. panel header).
   * When set in edit mode, status renders here instead of the section title.
   */
  statusPortalHost?: HTMLElement | null;
};

// ── Constants ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "Science",     label: "Khoa học",   color: "#E94B3C" },
  { value: "Technology",  label: "Công nghệ",  color: "#7CB342" },
  { value: "Engineering", label: "Kỹ thuật",   color: "#4FC3F7" },
  { value: "Mathematic",  label: "Toán học",   color: "#7E57C2" },
  { value: "Art",         label: "Nghệ thuật", color: "#FDD835" },
] as const;

const LEVELS = [
  { value: "Beginner",     label: "Cơ bản" },
  { value: "Intermediate", label: "Trung cấp" },
  { value: "Advanced",     label: "Nâng cao" },
  { value: "AllLevels",    label: "Mọi cấp độ" },
] as const;

const STATUSES = [
  { value: "Active",   label: "Đang mở",         dot: "#7CB342" },
  { value: "Draft",    label: "Bản nháp",        dot: "#9e9e9e" },
  { value: "Inactive", label: "Ngừng hoạt động", dot: "#E94B3C" },
] as const;

// ── Field styles ──────────────────────────────────────────────────────────
const LBL = "text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider";
const ERR_CLS = "text-[11px] text-primary mt-1 flex items-center gap-1 font-medium";
const INPUT_CLS = "h-9 rounded-lg border-input bg-card text-sm text-foreground focus-visible:ring-ring/50 placeholder:text-muted-foreground";
const TEXTAREA_CLS = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring resize-none placeholder:text-muted-foreground";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className={ERR_CLS}>
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </p>
  );
}

// ── Section Title ─────────────────────────────────────────────────────────
function FormSectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
        {children}
      </h3>
      {action}
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────────────────
export function ProgramForm({
  programId,
  initialValues,
  onSubmit,
  onThumbnailUploaded,
  isLoading = false,
  disabled = false,
  statusPortalHost = null,
}: ProgramFormProps) {
  const isEdit = Boolean(programId);
  const statusInPortal = isEdit && statusPortalHost != null;
  /** Create: pick file for create multipart. Edit: upload via thumbnail endpoint. */
  const canPickThumbnail = !disabled;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImageOpen, setIsImageOpen] = useState(!isEdit);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(!isEdit);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(
    null,
  );
  const [pendingThumbnailPreview, setPendingThumbnailPreview] = useState<
    string | null
  >(null);

  useEffect(() => {
    return () => {
      if (pendingThumbnailPreview) {
        URL.revokeObjectURL(pendingThumbnailPreview);
      }
    };
  }, [pendingThumbnailPreview]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programUpsertSchema),
    shouldUnregister: false,
    defaultValues: {
      code:              initialValues?.code              ?? "",
      name:              initialValues?.name              ?? "",
      seriesName:        initialValues?.seriesName        ?? "",
      description:       initialValues?.description       ?? "",
      category:          initialValues?.category          ?? "Science",
      level:             initialValues?.level             ?? "Beginner",
      estimatedDuration: initialValues?.estimatedDuration ?? "",
      skillsGained:      initialValues?.skillsGained      ?? "",
      thumbnailUrl:      initialValues?.thumbnailUrl      ?? "",
      status:            initialValues?.status            ?? "Draft",
      price:             initialValues?.price             ?? 0,
    },
  });

  const [thumbUrl = "", category] = useWatch({
    control,
    name: ["thumbnailUrl", "category"],
  });
  const catColor = CATEGORIES.find((item) => item.value === category)?.color ?? "#4FC3F7";
  const displayThumbUrl = pendingThumbnailPreview || thumbUrl;

  const onFormSubmit = handleSubmit(
    async (data) => {
      await onSubmit(data, {
        thumbnailFile: isEdit ? null : pendingThumbnailFile,
      });
    },
    (validationErrors) => {
      if (validationErrors.thumbnailUrl) setIsImageOpen(true);
      if (validationErrors.price || validationErrors.skillsGained) {
        setIsAdvancedOpen(true);
      }
    },
  );

  async function handleThumbnailFile(file: File) {
    const parsed = uploadProgramThumbnailSchema.safeParse({ file });
    if (!parsed.success) {
      showAppErrorFromUnknown(parsed.error, "programs.upload-thumbnail");
      return;
    }

    // Create flow: keep file locally; sent with POST /api/programs.
    if (!programId) {
      if (pendingThumbnailPreview) {
        URL.revokeObjectURL(pendingThumbnailPreview);
      }
      const previewUrl = URL.createObjectURL(parsed.data.file);
      setPendingThumbnailFile(parsed.data.file);
      setPendingThumbnailPreview(previewUrl);
      setValue("thumbnailUrl", previewUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const result = await uploadProgramThumbnail(programId, parsed.data.file);
      if (!result?.data) {
        throw new Error("Không nhận được chương trình sau khi tải ảnh.");
      }
      const nextUrl = result.data.thumbnailUrl ?? "";
      setValue("thumbnailUrl", nextUrl, { shouldDirty: true, shouldValidate: true });
      onThumbnailUploaded?.(result.data);
      showAppSuccess({
        title: "Đã cập nhật ảnh chương trình",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.upload-thumbnail");
    } finally {
      setIsUploadingThumbnail(false);
    }
  }

  function clearPendingThumbnail() {
    if (pendingThumbnailPreview) {
      URL.revokeObjectURL(pendingThumbnailPreview);
    }
    setPendingThumbnailFile(null);
    setPendingThumbnailPreview(null);
    setValue("thumbnailUrl", "", { shouldDirty: true, shouldValidate: true });
  }

  function openThumbnailPicker() {
    if (!canPickThumbnail || isUploadingThumbnail || isLoading) return;
    fileInputRef.current?.click();
  }

  const statusControl = isEdit ? (
    <Controller
      name="status"
      control={control}
      render={({ field }) => (
        <Select
          value={field.value}
          onValueChange={field.onChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger
            className={cn(
              LIGHT_SELECT_TRIGGER,
              "h-8 w-[10.5rem] rounded-lg border-input text-xs",
              errors.status && "border-primary",
            )}
            aria-label="Trạng thái chương trình"
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              {(() => {
                const stat = STATUSES.find((s) => s.value === field.value);
                if (stat) {
                  return (
                    <>
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: stat.dot }}
                      />
                      {stat.label}
                    </>
                  );
                }
                return field.value;
              })()}
            </span>
          </SelectTrigger>
          <SelectContent className={LIGHT_SELECT_CONTENT}>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value} className={LIGHT_SELECT_ITEM}>
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: s.dot }}
                  />
                  {s.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      <span className="size-1.5 rounded-full bg-[#9e9e9e]" />
      Bản nháp
    </span>
  );

  return (
    <form onSubmit={onFormSubmit} className="flex flex-col gap-6">
      {statusInPortal && statusPortalHost
        ? createPortal(statusControl, statusPortalHost)
        : null}
      <fieldset disabled={disabled || isLoading} className="flex flex-col gap-6 border-0 p-0 m-0 min-w-0 disabled:opacity-70">

      {/* ── Top: Image panel (Hero Banner) ─────────────────────────── */}
      <Collapsible open={isImageOpen} onOpenChange={setIsImageOpen}>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-4 text-left">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                Ảnh chương trình
              </p>
              {!isImageOpen ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {displayThumbUrl ? "Đã có ảnh đại diện" : "Chưa có ảnh đại diện"}
                </p>
              ) : null}
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isImageOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-5 items-start">
          {/* Thumbnail preview - Wide banner aspect ratio */}
          <div
            className="relative w-full md:w-2/3 overflow-hidden rounded-xl border border-border bg-muted"
            style={{ aspectRatio: "21/9" }}
          >
            {displayThumbUrl ? (
              <>
                <img
                  src={displayThumbUrl}
                  alt="thumbnail"
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                />
                {/* Overlay actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={!canPickThumbnail || isUploadingThumbnail || isLoading}
                    onClick={openThumbnailPicker}
                    className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow hover:bg-muted disabled:opacity-50"
                  >
                    {isUploadingThumbnail ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    Thay thế
                  </button>
                  <button
                    type="button"
                    disabled={isUploadingThumbnail || isLoading}
                    onClick={() => {
                      if (!isEdit) {
                        clearPendingThumbnail();
                        return;
                      }
                      setValue("thumbnailUrl", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                disabled={!canPickThumbnail || isUploadingThumbnail || isLoading}
                onClick={openThumbnailPicker}
                className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 disabled:cursor-not-allowed"
              >
                <div
                  className="flex size-12 items-center justify-center rounded-xl"
                  style={{ background: `${catColor}12` }}
                >
                  {isUploadingThumbnail ? (
                    <Loader2 className="size-6 animate-spin" style={{ color: catColor }} />
                  ) : (
                    <ImageOff className="size-6" style={{ color: catColor }} />
                  )}
                </div>
                <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                  Chọn ảnh JPG/PNG/WebP (tối đa 5 MB) để tải lên
                </p>
              </button>
            )}
          </div>

          {/* URL input and info */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className={LBL}>Ảnh thumbnail</label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!canPickThumbnail || isUploadingThumbnail || isLoading}
                  onClick={openThumbnailPicker}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-input bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                >
                  {isUploadingThumbnail ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  {displayThumbUrl ? "Tải ảnh mới" : "Tải ảnh lên"}
                </button>
                {isEdit ? (
                  <Input
                    id="thumbnailUrl"
                    readOnly
                    value={thumbUrl ?? ""}
                    placeholder="Ảnh sẽ hiện URL sau khi tải lên"
                    className={cn(INPUT_CLS, "text-xs font-mono w-full bg-muted")}
                  />
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {pendingThumbnailFile
                      ? `Đã chọn: ${pendingThumbnailFile.name}`
                      : "Ảnh sẽ được gửi kèm khi tạo chương trình."}
                  </p>
                )}
              </div>
              <FieldError message={errors.thumbnailUrl?.message} />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEdit
                ? "Ảnh mới được tải qua endpoint thumbnail và thay thế ảnh hiện tại. JPG/PNG/WebP · tối đa 5 MB."
                : "Ảnh đính kèm khi tạo chương trình (multipart). Sau khi tạo có thể đổi ảnh bằng nút tải lên trên trang chỉnh sửa."}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleThumbnailFile(file);
              }}
            />

            {/* STEAM category accent strip */}
            {category && (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 border border-border w-fit">
                <span className="size-2 rounded-full shrink-0" style={{ background: catColor }} />
                <span className="text-xs font-semibold text-foreground">
                  {CATEGORIES.find((item) => item.value === category)?.label ?? category}
                </span>
              </div>
            )}
          </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* ── Bottom: Combined form box with dividers ───────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] space-y-6">

        {/* Section 1: General info */}
        <div>
          <FormSectionTitle
            action={statusInPortal ? undefined : statusControl}
          >
            Thông tin chung
          </FormSectionTitle>
          {isEdit && !statusInPortal && <FieldError message={errors.status?.message} />}
          <div className="space-y-4">
            <div>
              <label className={LBL}>
                Tên chương trình học <span className="text-primary">*</span>
              </label>
              <Input
                id="name"
                placeholder="Ví dụ: STEAM Robotics Cơ bản"
                {...register("name")}
                aria-invalid={!!errors.name}
                className={cn(INPUT_CLS, errors.name && "border-primary focus-visible:ring-primary/30")}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LBL}>
                  Tên Series <span className="text-primary">*</span>
                </label>
                <Input
                  id="seriesName"
                  placeholder="Ví dụ: Obox Kids"
                  {...register("seriesName")}
                  aria-invalid={!!errors.seriesName}
                  className={cn(INPUT_CLS, errors.seriesName && "border-primary")}
                />
                <FieldError message={errors.seriesName?.message} />
              </div>

              <div>
                <label className={LBL}>
                  Mã chương trình <span className="text-primary">*</span>
                </label>
                <Input
                  id="code"
                  placeholder="PROG101"
                  {...register("code")}
                  aria-invalid={!!errors.code}
                  className={cn(INPUT_CLS, "font-mono", errors.code && "border-primary")}
                />
                <FieldError message={errors.code?.message} />
              </div>
            </div>

            <div>
              <label className={LBL}>
                Mô tả chương trình <span className="text-primary">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Mô tả mục tiêu, nội dung và đối tượng học viên của chương trình..."
                {...register("description")}
                aria-invalid={!!errors.description}
                className={cn(TEXTAREA_CLS, errors.description && "border-primary")}
              />
              <FieldError message={errors.description?.message} />
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Section 2: Classification & Config */}
        <div>
          <FormSectionTitle>Phân loại & Cấu hình</FormSectionTitle>
          <div className="space-y-5">
            {/* Category Chips row */}
            <div>
              <label className={LBL}>
                Thể loại STEAM <span className="text-primary">*</span>
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2.5 mt-1.5">
                    {CATEGORIES.map((cat) => {
                      const isActive = field.value === cat.value;
                      
                      const activeBg =
                        cat.value === "Science"
                          ? "border-primary/40 bg-primary/10 text-[#c62828]"
                          : cat.value === "Technology"
                          ? "border-[#7CB342]/40 bg-[#7CB342]/10 text-[#33691e]"
                          : cat.value === "Engineering"
                          ? "border-[#4FC3F7]/40 bg-[#4FC3F7]/10 text-[#0d6e9c] dark:text-[#7dd3fc]"
                          : cat.value === "Mathematic"
                          ? "border-[#7E57C2]/40 bg-[#7E57C2]/10 text-[#51308a] dark:text-[#c4b5fd]"
                          : "border-[#FDD835]/40 bg-[#FDD835]/10 text-[#f57f17]";
                          
                      const circleBg =
                        cat.value === "Science"
                          ? "bg-primary text-white"
                          : cat.value === "Technology"
                          ? "bg-[#7CB342] text-white"
                          : cat.value === "Engineering"
                          ? "bg-[#4FC3F7] text-white"
                          : cat.value === "Mathematic"
                          ? "bg-[#7E57C2] text-white"
                          : "bg-[#FDD835] text-white";

                      const letter =
                        cat.value === "Science"
                          ? "S"
                          : cat.value === "Technology"
                          ? "T"
                          : cat.value === "Engineering"
                          ? "E"
                          : cat.value === "Mathematic"
                          ? "M"
                          : "A";

                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => field.onChange(cat.value)}
                          className={cn(
                            "group inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-all duration-200 text-xs font-semibold cursor-pointer",
                            "hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:scale-[0.98]",
                            isActive
                              ? activeBg
                              : "border-border bg-background/50 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full font-heading text-[10px] font-bold transition-all",
                              isActive ? circleBg : "bg-card border border-border shadow-sm"
                            )}
                            style={!isActive ? { color: cat.color } : undefined}
                          >
                            {letter}
                          </span>
                          <span className="leading-tight">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              <FieldError message={errors.category?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LBL}>
                  Độ khó <span className="text-primary">*</span>
                </label>
                <Controller
                  name="level"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-9 rounded-lg border-input text-sm w-full")}>
                        <span className="truncate">
                          {LEVELS.find((l) => l.value === field.value)?.label ?? field.value}
                        </span>
                      </SelectTrigger>
                      <SelectContent className={LIGHT_SELECT_CONTENT}>
                        {LEVELS.map((l) => (
                          <SelectItem key={l.value} value={l.value} className={LIGHT_SELECT_ITEM}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.level?.message} />
              </div>

              <div>
                <label className={LBL}>Thời lượng dự kiến <span className="text-primary">*</span></label>
                <Input
                  id="estimatedDuration"
                  placeholder="Ví dụ: 12 tuần (24 giờ)"
                  {...register("estimatedDuration")}
                  aria-invalid={!!errors.estimatedDuration}
                  className={cn(INPUT_CLS, errors.estimatedDuration && "border-primary")}
                />
                <FieldError message={errors.estimatedDuration?.message} />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-4 text-left">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                Thiết lập bổ sung
              </p>
              <p className="mt-1 text-xs font-normal normal-case tracking-normal text-muted-foreground">
                Học phí và kỹ năng đạt được
              </p>
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isAdvancedOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-6 pt-5">
            <div>
              <FormSectionTitle>Học phí</FormSectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LBL}>
                    Học phí (VND) <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">₫</span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
                      {...register("price", { valueAsNumber: true })}
                      aria-invalid={!!errors.price}
                      className={cn(INPUT_CLS, "pl-7 font-mono", errors.price && "border-primary")}
                    />
                  </div>
                  <FieldError message={errors.price?.message} />
                </div>
                <div className="flex items-end pb-1.5">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Học phí nhập bằng VND. Không cần thêm ký hiệu đơn vị tiền tệ.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <FormSectionTitle>Kỹ năng đạt được</FormSectionTitle>
              <div>
                <label className={LBL}>
                  Kỹ năng đạt được <span className="text-primary">*</span>
                </label>
                <textarea
                  id="skillsGained"
                  rows={3}
                  placeholder="Liệt kê các kỹ năng học viên đạt được sau khoá học (mỗi kỹ năng một dòng hoặc phân cách bằng dấu phẩy)..."
                  {...register("skillsGained")}
                  aria-invalid={!!errors.skillsGained}
                  className={cn(TEXTAREA_CLS, errors.skillsGained && "border-primary")}
                />
                <FieldError message={errors.skillsGained?.message} />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

      </div>
      </fieldset>

      {/* Hidden submit – triggered by outer action bar */}
      <button type="submit" id="__program-form-submit" className="hidden" aria-hidden disabled={isLoading || disabled} />
    </form>
  );
}
