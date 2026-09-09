"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Check, Save } from "lucide-react";

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
  CompactNumberField,
  CURRICULUM_TEXTAREA,
  DEFAULT_QUIZ_DIFFICULTY,
  NameWithAutoCode,
  QuizDifficultyControl,
} from "@/components/manager/programs/curriculum-form-controls";
import {
  createAssignment,
  getQuestionBanks,
  updateAssignment,
  type AssignmentDetail,
  type QuestionBankListItem,
} from "@/lib/api";
import {
  assignmentFormSchema,
  type AssignmentFormValues,
} from "@/lib/validations/assignments";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  fromApiDateTimeToLocalInput,
} from "@/lib/curriculum/datetime";

/* ─── Palette (mirrors curriculum-split-panel) ─────────────────────────────── */
const W = {
  surface: "var(--card)",
  border: "var(--border)",
  textStrong: "var(--foreground)",
  muted: "var(--muted-foreground)",
  faint: "var(--muted-foreground)",
  accent: "#4fc3f7",
  primary: "var(--primary)",
} as const;

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  Retrospective: "Nhật ký phản tư",
  FileUpload: "Nộp tệp",
  Quiz: "Trắc nghiệm",
};

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
function PHdr({ title, sub }: { title: string; sub?: string }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
      style={{ background: W.surface, borderColor: W.border }}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border"
        style={{ background: "white", borderColor: W.border }}
      >
        <ClipboardList className="size-4" style={{ color: "#f59e0b" }} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-snug truncate" style={{ color: W.textStrong }}>
          {title}
        </p>
        {sub && (
          <p className="text-xs mt-0.5 truncate" style={{ color: W.muted }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

type CourseOption = { id: string; name: string };

type AssignmentFormPanelProps = {
  moduleId: string;
  courseOptions: CourseOption[];
  assignmentToEdit: AssignmentDetail | null;
  onSuccess: (assignment: AssignmentDetail) => void;
  /** Cohort lock — show values, block mutations. */
  disabled?: boolean;
};

type FormValues = AssignmentFormValues;

const NO_COURSE = "none";

function emptyNumberField(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}

export function AssignmentFormPanel({
  moduleId,
  courseOptions,
  assignmentToEdit,
  onSuccess,
  disabled = false,
}: AssignmentFormPanelProps) {
  const isEdit = !!assignmentToEdit;
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const flash = () => {
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(assignmentFormSchema),
    values: assignmentToEdit
      ? {
          code: assignmentToEdit.code || "",
          courseId: assignmentToEdit.courseId || NO_COURSE,
          title: assignmentToEdit.title || "",
          description: assignmentToEdit.description || "",
          assignmentType: assignmentToEdit.assignmentType,
          maxPoints: assignmentToEdit.maxPoints,
          passScore: assignmentToEdit.passScore,
          maxAttempts: assignmentToEdit.maxAttempts,
          isRequiredForModulePass: assignmentToEdit.isRequiredForModulePass,
          dueDate: fromApiDateTimeToLocalInput(assignmentToEdit.dueDate),
          availableFrom: fromApiDateTimeToLocalInput(assignmentToEdit.availableFrom),
          availableUntil: fromApiDateTimeToLocalInput(assignmentToEdit.availableUntil),
          questionBankId: assignmentToEdit.questionBankId || "",
          questionCount: assignmentToEdit.questionCount,
          timeLimitMinutes: assignmentToEdit.timeLimitMinutes,
          allowShuffle: assignmentToEdit.allowShuffle,
          shuffleOptions: assignmentToEdit.shuffleOptions,
          easyPercent: assignmentToEdit.easyPercent,
          mediumPercent: assignmentToEdit.mediumPercent,
          hardPercent: assignmentToEdit.hardPercent,
        }
      : {
          code: "ASG",
          courseId: NO_COURSE,
          title: "",
          description: "",
          assignmentType: "FileUpload",
          maxPoints: 100,
          passScore: 50,
          maxAttempts: 1,
          isRequiredForModulePass: false,
          dueDate: "",
          availableFrom: "",
          availableUntil: "",
          questionBankId: "",
          questionCount: null,
          timeLimitMinutes: null,
          allowShuffle: false,
          shuffleOptions: false,
          ...DEFAULT_QUIZ_DIFFICULTY,
        },
  });

  const assignmentType = watch("assignmentType");
  const selectedCourseId = watch("courseId");
  const titleValue = watch("title");
  const codeValue = watch("code") ?? "";
  const isQuiz = assignmentType === "Quiz";
  const bankCourseId =
    selectedCourseId && selectedCourseId !== NO_COURSE ? selectedCourseId : "";

  const setCode = useCallback(
    (next: string) => setValue("code", next, { shouldValidate: true, shouldDirty: !isEdit }),
    [setValue, isEdit],
  );

  const [banks, setBanks] = useState<QuestionBankListItem[]>([]);

  useEffect(() => {
    if (!bankCourseId) {
      setBanks([]);
      return;
    }
    let active = true;
    getQuestionBanks({ courseId: bankCourseId, page: 1, pageSize: 100 })
      .then((res) => {
        if (active) setBanks(res?.data?.items ?? []);
      })
      .catch(() => {
        if (active) setBanks([]);
      });
    return () => {
      active = false;
    };
  }, [bankCourseId]);

  /** When switching into Quiz on create, seed balanced difficulty if still empty. */
  useEffect(() => {
    if (assignmentType !== "Quiz" || isEdit) return;
    const easy = watch("easyPercent");
    const medium = watch("mediumPercent");
    const hard = watch("hardPercent");
    if ((easy ?? 0) === 0 && (medium ?? 0) === 0 && (hard ?? 0) === 0) {
      setValue("easyPercent", DEFAULT_QUIZ_DIFFICULTY.easyPercent, { shouldValidate: true });
      setValue("mediumPercent", DEFAULT_QUIZ_DIFFICULTY.mediumPercent, { shouldValidate: true });
      setValue("hardPercent", DEFAULT_QUIZ_DIFFICULTY.hardPercent, { shouldValidate: true });
    }
    // Only re-run when type flips to Quiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentType, isEdit, setValue]);

  const onSubmit = async (data: FormValues) => {
    if (disabled) return;
    setBusy(true);
    try {
      const payload = {
        code: data.code || null,
        moduleId,
        courseId: data.courseId === NO_COURSE ? null : data.courseId,
        title: data.title,
        description: data.description || null,
        assignmentType: data.assignmentType,
        maxPoints: Number(data.maxPoints),
        passScore: Number(data.passScore),
        maxAttempts: Number(data.maxAttempts),
        isRequiredForModulePass: data.isRequiredForModulePass,
        // Lịch mở bài do mentor set theo lớp/chương trình — manager không ghi đè khi sửa.
        ...(isEdit
          ? {}
          : {
              dueDate: null,
              availableFrom: null,
              availableUntil: null,
            }),
        allowShuffle: isQuiz ? data.allowShuffle : false,
        shuffleOptions: isQuiz ? data.shuffleOptions : false,
        questionBankId: isQuiz ? data.questionBankId || null : null,
        questionCount: isQuiz && data.questionCount ? Number(data.questionCount) : null,
        timeLimitMinutes: isQuiz && data.timeLimitMinutes ? Number(data.timeLimitMinutes) : null,
        easyPercent: isQuiz ? Number(data.easyPercent) : 0,
        mediumPercent: isQuiz ? Number(data.mediumPercent) : 0,
        hardPercent: isQuiz ? Number(data.hardPercent) : 0,
      };

      let result: AssignmentDetail | null | undefined;
      if (isEdit && assignmentToEdit) {
        const res = await updateAssignment(assignmentToEdit.id, payload);
        result = res?.data;
        showAppSuccess({
          title: "Cập nhật thành công",
          description: `Bài tập "${data.title}" đã được cập nhật.`,
        });
      } else {
        const res = await createAssignment(payload);
        result = res?.data;
        showAppSuccess({
          title: "Tạo thành công",
          description: `Đã tạo bài tập "${data.title}".`,
        });
      }
      flash();
      if (result) onSuccess(result);
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.assignment.save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
      <PHdr
        title={isEdit ? `${disabled ? "Xem" : "Chỉnh sửa"}: ${assignmentToEdit!.title}` : "Tạo Bài tập mới"}
        sub="Bài tập thuộc học phần (module)"
      />
      <fieldset disabled={disabled} className="min-w-0 space-y-6 border-0 p-5">
        <div>
          <STitle>Thông tin cơ bản</STitle>
          <p className="mb-3 text-xs" style={{ color: W.muted }}>
            Lịch mở / hạn nộp do mentor thiết lập khi mở bài cho học viên — không cần nhập khi tạo khung bài tập.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <NameWithAutoCode
                nameLabel="Tiêu đề"
                codeLabel="Mã bài tập"
                codePrefix="ASG"
                name={titleValue}
                code={codeValue}
                lockCode={isEdit}
                disabled={disabled}
                namePlaceholder="Ví dụ: Báo cáo dự án cuối module"
                nameError={errors.title?.message as string | undefined}
                onNameChange={(value) =>
                  setValue("title", value, { shouldValidate: true, shouldDirty: true })
                }
                onCodeChange={setCode}
              />
            </div>
            <div className="col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                  Loại bài tập <span style={{ color: W.primary }}>*</span>
                </Label>
                <Controller
                  name="assignmentType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "h-9 rounded-lg")}>
                        <span className="truncate">
                          {ASSIGNMENT_TYPE_LABELS[field.value] ?? field.value}
                        </span>
                      </SelectTrigger>
                      <SelectContent className={THEME_SELECT_CONTENT}>
                        <SelectItem value="Retrospective" className={THEME_SELECT_ITEM}>Nhật ký phản tư</SelectItem>
                        <SelectItem value="FileUpload" className={THEME_SELECT_ITEM}>Nộp tệp</SelectItem>
                        <SelectItem value="Quiz" className={THEME_SELECT_ITEM}>Trắc nghiệm</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                  Gắn với khóa học{" "}
                  <span className="text-xs font-normal" style={{ color: W.muted }}>(tùy chọn)</span>
                </Label>
                <Controller
                  name="courseId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || NO_COURSE} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "h-9 rounded-lg")}>
                        <span className="truncate">
                          {field.value === NO_COURSE || !field.value
                            ? "Không gắn khóa học"
                            : courseOptions.find((c) => c.id === field.value)?.name ?? "Không gắn khóa học"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className={THEME_SELECT_CONTENT}>
                        <SelectItem value={NO_COURSE} className={THEME_SELECT_ITEM}>Không gắn khóa học</SelectItem>
                        {courseOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id} className={THEME_SELECT_ITEM}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FErr msg={errors.courseId?.message} />
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mô tả</Label>
              <textarea
                rows={3}
                placeholder="Hướng dẫn, yêu cầu nộp bài..."
                {...register("description")}
                className={CURRICULUM_TEXTAREA}
                style={{ borderColor: W.border }}
              />
            </div>
          </div>
        </div>

        <div>
          <STitle>Điểm & điều kiện</STitle>
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: W.border, background: W.surface }}
          >
            <div className="grid grid-cols-3 gap-3">
              <CompactNumberField
                fill
                label="Điểm tối đa"
                required
                error={errors.maxPoints?.message as string | undefined}
                {...register("maxPoints", { valueAsNumber: true })}
              />
              <CompactNumberField
                fill
                label="Điểm đạt"
                required
                step="0.1"
                error={errors.passScore?.message as string | undefined}
                {...register("passScore", { valueAsNumber: true })}
              />
              <CompactNumberField
                fill
                label="Số lần làm"
                required
                error={errors.maxAttempts?.message as string | undefined}
                {...register("maxAttempts", { valueAsNumber: true })}
              />
            </div>
            <div className="mt-4 flex items-center gap-2 border-t pt-3" style={{ borderColor: W.border }}>
              <Controller
                name="isRequiredForModulePass"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="req-pass"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="border-input bg-background data-checked:border-primary"
                  />
                )}
              />
              <Label htmlFor="req-pass" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>
                Bắt buộc để qua module
              </Label>
            </div>
          </div>
        </div>

        {isQuiz && (
          <div>
            <STitle>Cấu hình trắc nghiệm</STitle>
            <div
              className="space-y-5 rounded-xl border p-4"
              style={{ borderColor: W.border, background: W.surface }}
            >
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                  Ngân hàng câu hỏi
                </Label>
                {!bankCourseId ? (
                  <p className="text-xs" style={{ color: W.muted }}>
                    Chọn khóa học ở trên để tải danh sách ngân hàng đề.
                  </p>
                ) : (
                  <Controller
                    name="questionBankId"
                    control={control}
                    render={({ field }) => {
                      const known = banks.some((b) => b.id === field.value);
                      const selectValue = field.value || "none";
                      return (
                      <Select
                        value={selectValue}
                        onValueChange={(v) =>
                          field.onChange(!v || v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "h-9 w-full rounded-lg")}>
                          <span className="truncate">
                            {banks.find((b) => b.id === field.value)?.name ||
                              (field.value
                                ? `ID: ${field.value.slice(0, 8)}…`
                                : "Chọn ngân hàng đề")}
                          </span>
                        </SelectTrigger>
                        <SelectContent className={THEME_SELECT_CONTENT}>
                          <SelectItem value="none" className={THEME_SELECT_ITEM}>
                            Chọn ngân hàng đề
                          </SelectItem>
                          {field.value && !known ? (
                            <SelectItem
                              value={field.value}
                              className={THEME_SELECT_ITEM}
                            >
                              ID đã lưu: {field.value.slice(0, 8)}…
                            </SelectItem>
                          ) : null}
                          {banks.map((bank) => (
                            <SelectItem
                              key={bank.id}
                              value={bank.id}
                              className={THEME_SELECT_ITEM}
                            >
                              {bank.name || "Không tên"}
                              {bank.questionCount
                                ? ` (${bank.questionCount} câu)`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      );
                    }}
                  />
                )}
                <FErr msg={errors.questionBankId?.message} />
                {watch("questionBankId") &&
                  bankCourseId &&
                  !banks.some((b) => b.id === watch("questionBankId")) && (
                    <p className="text-[11px]" style={{ color: W.muted }}>
                      Đang dùng ID đã lưu trên bài tập (không có trong cache trình
                      duyệt). Vẫn gửi được khi cập nhật.
                    </p>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CompactNumberField
                  fill
                  label="Số câu hỏi"
                  error={errors.questionCount?.message}
                  {...register("questionCount", { setValueAs: emptyNumberField })}
                />
                <CompactNumberField
                  fill
                  label="Thời lượng (phút)"
                  error={errors.timeLimitMinutes?.message}
                  {...register("timeLimitMinutes", { setValueAs: emptyNumberField })}
                />
              </div>

              <div className="border-t pt-4" style={{ borderColor: W.border }}>
                <QuizDifficultyControl
                  disabled={disabled}
                  error={errors.easyPercent?.message as string | undefined}
                  value={{
                    easyPercent: watch("easyPercent") ?? 0,
                    mediumPercent: watch("mediumPercent") ?? 0,
                    hardPercent: watch("hardPercent") ?? 0,
                  }}
                  onChange={(next) => {
                    setValue("easyPercent", next.easyPercent, { shouldValidate: true, shouldDirty: true });
                    setValue("mediumPercent", next.mediumPercent, { shouldValidate: true, shouldDirty: true });
                    setValue("hardPercent", next.hardPercent, { shouldValidate: true, shouldDirty: true });
                  }}
                />
              </div>

              <div
                className="flex flex-wrap gap-5 border-t pt-3"
                style={{ borderColor: W.border }}
              >
                <div className="flex items-center gap-2">
                  <Controller
                    name="allowShuffle"
                    control={control}
                    render={({ field }) => (
                      <Checkbox id="shuffle-q" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="border-input bg-background data-checked:border-primary" />
                    )}
                  />
                  <Label htmlFor="shuffle-q" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>Trộn câu hỏi</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="shuffleOptions"
                    control={control}
                    render={({ field }) => (
                      <Checkbox id="shuffle-o" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="border-input bg-background data-checked:border-primary" />
                    )}
                  />
                  <Label htmlFor="shuffle-o" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>Trộn đáp án</Label>
                </div>
              </div>
            </div>
          </div>
        )}
      </fieldset>
      {!disabled ? (
      <div className="flex items-center justify-end gap-3 px-5 py-3 border-t shrink-0" style={{ borderColor: W.border, background: W.surface }}>
        {Object.keys(errors).length > 0 && (
          <p className="mr-auto text-xs font-semibold" style={{ color: W.primary }}>
            Vui lòng kiểm tra các trường bị lỗi trước khi lưu.
          </p>
        )}
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
              <Check className="size-4 animate-in zoom-in-50 duration-200" />
              Đã lưu
            </>
          ) : (
            <>
              <Save className="size-4" />
              {busy ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Bài tập"}
            </>
          )}
        </Button>
      </div>
      ) : null}
    </form>
  );
}
