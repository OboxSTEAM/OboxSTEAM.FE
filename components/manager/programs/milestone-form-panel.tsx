"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flag, Save, Plus, Trash, Link2 } from "lucide-react";

import { SuccessCheckIcon } from "@/components/transitions/success-check-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  THEME_SELECT_TRIGGER,
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
} from "@/components/programs/program-select-styles";
import {
  createResearchMilestone,
  updateResearchMilestone,
  linkMilestoneActivity,
  unlinkMilestoneActivity,
  type ResearchMilestone,
  type ResearchMilestoneActivity,
} from "@/lib/api";
import {
  createResearchMilestoneSchema,
  updateResearchMilestoneSchema,
} from "@/lib/validations/research-milestones";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

const W = {
  surface: "var(--card)",
  border: "var(--border)",
  textStrong: "var(--foreground)",
  muted: "var(--muted-foreground)",
  faint: "var(--muted-foreground)",
  accent: "#4fc3f7",
  primary: "var(--primary)",
} as const;

const IN =
  "h-10 rounded-lg border text-sm font-normal outline-none px-3 w-full transition-colors focus:ring-1 focus:ring-ring/50 bg-card";

function STitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: W.faint }}>
      {children}
    </p>
  );
}
function FErr({ msg }: { msg?: string }) {
  return msg ? (
    <p className="text-xs font-semibold mt-1" style={{ color: W.primary }}>
      {msg}
    </p>
  ) : null;
}

type ActivityOption = { id: string; name: string };

type MilestoneFormPanelProps = {
  moduleId: string;
  activityOptions: ActivityOption[];
  milestoneToEdit: ResearchMilestone | null;
  onSuccess: (milestone: ResearchMilestone) => void;
  /** Activity ids currently linked — the side rail draws from this, not a second tree copy. */
  onLinksChange?: (activityIds: string[]) => void;
  /** Cohort lock — show values, block mutations. */
  disabled?: boolean;
};

type FormValues = {
  code: string;
  title: string;
  description: string;
  milestoneOrder: number;
  isCapstone: boolean;
  assignmentCode: string;
  assignmentTitle: string;
  assignmentDescription: string;
  assignmentType: "Retrospective" | "FileUpload" | "Quiz";
  maxPoints: number;
  passScore: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
};

function emptyMinutes(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}

export function MilestoneFormPanel({
  moduleId,
  activityOptions,
  milestoneToEdit,
  onSuccess,
  onLinksChange,
  disabled = false,
}: MilestoneFormPanelProps) {
  const isEdit = !!milestoneToEdit;
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const flash = () => {
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };

  const [linkedActivities, setLinkedActivities] = useState<ResearchMilestoneActivity[]>(
    milestoneToEdit?.activities ?? [],
  );

  const asg = milestoneToEdit?.assignment;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? updateResearchMilestoneSchema : createResearchMilestoneSchema) as any,
    values: milestoneToEdit
      ? {
          code: milestoneToEdit.code || "",
          title: milestoneToEdit.title || "",
          description: milestoneToEdit.description || "",
          milestoneOrder: milestoneToEdit.milestoneOrder,
          isCapstone: milestoneToEdit.isCapstone,
          assignmentCode: asg?.code || "",
          assignmentTitle: asg?.title || "",
          assignmentDescription: asg?.description || "",
          assignmentType: (asg?.assignmentType as FormValues["assignmentType"]) || "FileUpload",
          maxPoints: asg?.maxPoints ?? 100,
          passScore: asg?.passScore ?? 50,
          maxAttempts: asg?.maxAttempts ?? 1,
          timeLimitMinutes: asg?.timeLimitMinutes ?? null,
        }
      : {
          code: "",
          title: "",
          description: "",
          milestoneOrder: 1,
          isCapstone: false,
          assignmentCode: "",
          assignmentTitle: "",
          assignmentDescription: "",
          assignmentType: "FileUpload",
          maxPoints: 100,
          passScore: 50,
          maxAttempts: 1,
          timeLimitMinutes: null,
        },
  });

  const isQuiz = watch("assignmentType") === "Quiz";

  const onSubmit = async (data: FormValues) => {
    if (disabled) return;
    setBusy(true);
    try {
      let result: ResearchMilestone | null | undefined;
      if (isEdit && milestoneToEdit) {
        const res = await updateResearchMilestone(milestoneToEdit.id, {
          title: data.title,
          description: data.description || null,
          milestoneOrder: Number(data.milestoneOrder),
          isCapstone: data.isCapstone,
          assignmentTitle: data.assignmentTitle,
          assignmentDescription: data.assignmentDescription || null,
          maxPoints: Number(data.maxPoints),
          passScore: Number(data.passScore),
          timeLimitMinutes: isQuiz ? data.timeLimitMinutes : null,
        });
        result = res?.data ?? null;
        showAppSuccess({ title: "Cập nhật thành công", description: `Milestone "${data.title}" đã lưu.` });
      } else {
        const res = await createResearchMilestone(moduleId, {
          code: data.code,
          title: data.title,
          description: data.description || null,
          milestoneOrder: Number(data.milestoneOrder),
          isCapstone: data.isCapstone,
          assignmentCode: data.assignmentCode,
          assignmentTitle: data.assignmentTitle,
          assignmentDescription: data.assignmentDescription || null,
          assignmentType: data.assignmentType,
          maxPoints: Number(data.maxPoints),
          passScore: Number(data.passScore),
          maxAttempts: Number(data.maxAttempts),
          timeLimitMinutes: isQuiz ? data.timeLimitMinutes : null,
        });
        result = res?.data ?? null;
        showAppSuccess({ title: "Tạo thành công", description: `Đã tạo milestone "${data.title}".` });
      }
      flash();
      if (result) onSuccess(result);
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.milestone.save");
    } finally {
      setBusy(false);
    }
  };

  const unlinkedOptions = activityOptions.filter(
    (o) => !linkedActivities.some((la) => la.activityId === o.id),
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full min-h-0 flex-col">
      <div
        className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
        style={{ background: W.surface, borderColor: W.border }}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border"
          style={{ background: "white", borderColor: W.border }}
        >
          <Flag className="size-4" style={{ color: "#8b5cf6" }} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug truncate" style={{ color: W.textStrong }}>
            {isEdit
              ? `${disabled ? "Xem" : "Chỉnh sửa"}: ${milestoneToEdit!.title ?? "Milestone"}`
              : "Tạo Milestone nghiên cứu"}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: W.muted }}>
            Một lần lưu tạo mốc và sản phẩm nộp đi kèm
          </p>
        </div>
      </div>

      <fieldset disabled={disabled} className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto border-0 p-5">
        <section className="rounded-xl border p-4" style={{ borderColor: W.border, background: W.surface }}>
          <STitle>1 · Mốc nghiên cứu</STitle>
          <p className="mb-3 text-xs leading-5" style={{ color: W.muted }}>
            Đây là giai đoạn trên module nghiên cứu: tên, thứ tự, và cờ tốt nghiệp.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Tiêu đề <span style={{ color: W.primary }}>*</span>
              </Label>
              <input type="text" placeholder="Ví dụ: Báo cáo giữa kỳ" {...register("title")} className={IN} style={{ borderColor: errors.title ? W.primary : W.border }} />
              <FErr msg={errors.title?.message as string | undefined} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Mã milestone <span style={{ color: W.primary }}>*</span>
              </Label>
              <input
                type="text"
                placeholder="MS-01"
                {...register("code")}
                disabled={isEdit}
                className={cn(IN, "font-mono", isEdit && "opacity-60")}
                style={{ borderColor: errors.code ? W.primary : W.border }}
              />
              <FErr msg={errors.code?.message as string | undefined} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Thứ tự <span style={{ color: W.primary }}>*</span>
              </Label>
              <input type="number" {...register("milestoneOrder", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mô tả</Label>
              <textarea rows={2} {...register("description")} className="w-full text-sm p-3 rounded-lg border outline-none resize-none bg-card focus:ring-1 focus:ring-ring/50" style={{ borderColor: W.border }} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Controller
                name="isCapstone"
                control={control}
                render={({ field }) => (
                  <Checkbox id="capstone" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="border-input bg-background data-checked:border-primary" />
                )}
              />
              <Label htmlFor="capstone" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>
                Là sản phẩm tốt nghiệp (capstone)
              </Label>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3 px-1">
          <span className="h-px flex-1" style={{ background: W.border }} />
          <p className="shrink-0 text-center text-xs font-medium" style={{ color: W.muted }}>
            Lưu xong, hệ thống tạo sản phẩm nộp bên dưới cho mốc này
          </p>
          <span className="h-px flex-1" style={{ background: W.border }} />
        </div>

        <section className="rounded-xl border p-4" style={{ borderColor: W.border }}>
          <STitle>2 · Sản phẩm nộp đi kèm</STitle>
          <p className="mb-3 text-xs leading-5" style={{ color: W.muted }}>
            Không phải bài tập của khóa học. Mỗi mốc có đúng một sản phẩm nộp, tạo cùng lúc với mốc.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Tiêu đề sản phẩm <span style={{ color: W.primary }}>*</span>
              </Label>
              <input type="text" placeholder="Ví dụ: Nộp báo cáo PDF" {...register("assignmentTitle")} className={IN} style={{ borderColor: errors.assignmentTitle ? W.primary : W.border }} />
              <FErr msg={errors.assignmentTitle?.message as string | undefined} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Mã sản phẩm <span style={{ color: W.primary }}>*</span>
              </Label>
              <input
                type="text"
                placeholder="ASG-MS-01"
                {...register("assignmentCode")}
                disabled={isEdit}
                className={cn(IN, "font-mono", isEdit && "opacity-60")}
                style={{ borderColor: errors.assignmentCode ? W.primary : W.border }}
              />
              <FErr msg={errors.assignmentCode?.message as string | undefined} />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Loại nộp <span style={{ color: W.primary }}>*</span>
              </Label>
              <Controller
                name="assignmentType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                    <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "h-10 rounded-lg", isEdit && "opacity-60")}>
                      <span className="truncate">
                        {field.value === "Quiz" ? "Trắc nghiệm" : field.value === "Retrospective" ? "Nhật ký phản tư" : "Nộp tệp"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className={THEME_SELECT_CONTENT}>
                      <SelectItem value="FileUpload" className={THEME_SELECT_ITEM}>Nộp tệp</SelectItem>
                      <SelectItem value="Retrospective" className={THEME_SELECT_ITEM}>Nhật ký phản tư</SelectItem>
                      <SelectItem value="Quiz" className={THEME_SELECT_ITEM}>Trắc nghiệm</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mô tả sản phẩm</Label>
              <textarea rows={2} {...register("assignmentDescription")} className="w-full text-sm p-3 rounded-lg border outline-none resize-none bg-card focus:ring-1 focus:ring-ring/50" style={{ borderColor: W.border }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Điểm tối đa</Label>
              <input type="number" {...register("maxPoints", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Điểm đạt</Label>
              <input type="number" step="0.1" {...register("passScore", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
            </div>
            <div className="col-span-2 rounded-lg border border-dashed px-3 py-2.5 text-xs" style={{ borderColor: W.border, color: W.muted }}>
              Lịch mở / hạn nộp do mentor thiết lập khi mở bài cho học viên.
            </div>
            {!isEdit && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Số lần nộp tối đa</Label>
                <input type="number" {...register("maxAttempts", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
              </div>
            )}
            {isQuiz && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                  Thời lượng làm bài (phút)
                </Label>
                <input
                  type="number"
                  min={1}
                  placeholder="Không giới hạn"
                  {...register("timeLimitMinutes", { setValueAs: emptyMinutes })}
                  className={cn(IN, "font-mono")}
                  style={{ borderColor: errors.timeLimitMinutes ? W.primary : W.border }}
                />
                <p className="text-xs" style={{ color: W.muted }}>
                  Để trống nếu bài trắc nghiệm không tính giờ. Không áp dụng cho nộp tệp và nhật ký.
                </p>
                <FErr msg={errors.timeLimitMinutes?.message as string | undefined} />
              </div>
            )}
          </div>
        </section>

        {isEdit && milestoneToEdit && (
          <MilestoneActivityLinker
            milestoneId={milestoneToEdit.id}
            linked={linkedActivities}
            options={unlinkedOptions}
            onChange={(next) => {
              setLinkedActivities(next);
              onLinksChange?.(next.map((item) => item.activityId));
            }}
            disabled={disabled}
          />
        )}
      </fieldset>

      {!disabled ? (
      <div className="flex justify-end gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: W.border, background: W.surface }}>
        <Button
          type="submit"
          disabled={busy || ok}
          className={cn(
            "h-9 gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-sm transition-all duration-300",
            ok ? "bg-emerald-600 hover:bg-emerald-600" : "bg-primary hover:bg-primary/90",
          )}
        >
          {ok ? (
            <>
              <SuccessCheckIcon className="text-white" size={16} />
              Đã lưu
            </>
          ) : (
            <>
              <Save className="size-4" />
              {busy ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Milestone"}
            </>
          )}
        </Button>
      </div>
      ) : null}
    </form>
  );
}

function MilestoneActivityLinker({
  milestoneId,
  linked,
  options,
  onChange,
  disabled = false,
}: {
  milestoneId: string;
  linked: ResearchMilestoneActivity[];
  options: ActivityOption[];
  onChange: (next: ResearchMilestoneActivity[]) => void;
  disabled?: boolean;
}) {
  const [picked, setPicked] = useState("");
  const [required, setRequired] = useState(true);
  const [busy, setBusy] = useState(false);

  async function handleLink() {
    if (!picked) return;
    setBusy(true);
    try {
      const created = await linkMilestoneActivity(milestoneId, {
        activityId: picked,
        isRequiredForSubmission: required,
        displayOrder: linked.length,
      });
      if (created?.data) onChange([...linked, created.data]);
      setPicked("");
      showAppSuccess({ title: "Đã liên kết", description: "Hoạt động đã gắn vào milestone." });
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.milestone.link");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink(activityId: string) {
    setBusy(true);
    try {
      await unlinkMilestoneActivity(milestoneId, activityId);
      onChange(linked.filter((la) => la.activityId !== activityId));
      showAppSuccess({ title: "Đã gỡ", description: "Hoạt động đã gỡ khỏi milestone." });
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.milestone.link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t pt-5" style={{ borderColor: W.border }}>
      <STitle>Hoạt động liên kết</STitle>

      {linked.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {linked.map((la) => (
            <li
              key={la.id}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
              style={{ borderColor: W.border }}
            >
              <Link2 className="size-3.5 shrink-0" style={{ color: W.accent }} />
              <span className="min-w-0 flex-1 truncate text-sm" style={{ color: W.textStrong }}>
                {la.activityTitle || la.activityCode || la.activityId}
              </span>
              {la.isRequiredForSubmission && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(233,75,60,0.12)", color: W.primary }}>
                  Bắt buộc
                </span>
              )}
              {!disabled ? (
              <button
                type="button"
                onClick={() => handleUnlink(la.activityId)}
                disabled={busy}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-destructive/10"
                style={{ borderColor: W.border, color: W.primary }}
                title="Gỡ liên kết"
              >
                <Trash className="size-3.5" />
              </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs" style={{ color: W.muted }}>
          Chưa có hoạt động nào được liên kết.
        </p>
      )}

      {!disabled && options.length > 0 ? (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Select value={picked || "none"} onValueChange={(v) => setPicked(!v || v === "none" ? "" : v)}>
              <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "h-9 rounded-lg")}>
                <span className="truncate">
                  {picked ? options.find((o) => o.id === picked)?.name ?? "Chọn hoạt động" : "Chọn hoạt động"}
                </span>
              </SelectTrigger>
              <SelectContent className={THEME_SELECT_CONTENT}>
                <SelectItem value="none" className={THEME_SELECT_ITEM}>
                  Chọn hoạt động
                </SelectItem>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id} className={THEME_SELECT_ITEM}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-1.5 pb-2 text-xs font-medium" style={{ color: W.muted }}>
            <Checkbox checked={required} onCheckedChange={(v) => setRequired(v === true)} className="border-input bg-background data-checked:border-primary" />
            Bắt buộc
          </label>
          <Button
            type="button"
            onClick={handleLink}
            disabled={busy || !picked}
            className="h-9 gap-1.5 rounded-lg bg-[#4FC3F7] px-3 text-sm font-semibold text-white hover:bg-[#3bb4ea]"
          >
            <Plus className="size-4" />
            Gắn
          </Button>
        </div>
      ) : !disabled ? (
        <p className="text-xs" style={{ color: W.faint }}>
          Không còn hoạt động nào trong module để liên kết.
        </p>
      ) : null}
    </div>
  );
}
