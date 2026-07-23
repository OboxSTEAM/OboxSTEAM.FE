"use client";

import { useEffect, useState } from "react";
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
  LIGHT_SELECT_TRIGGER,
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
} from "@/components/programs/program-select-styles";
import {
  createAssignment,
  getQuestionBanks,
  updateAssignment,
  type AssignmentDetail,
  type QuestionBankListItem,
} from "@/lib/api";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from "@/lib/validations/assignments";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  fromApiDateTimeToLocalInput,
  toApiDateTimeFromLocalInput,
} from "@/lib/curriculum/datetime";

/* ─── Palette (mirrors curriculum-split-panel) ─────────────────────────────── */
const W = {
  surface: "#f4f1ea",
  border: "#d8d2c6",
  textStrong: "#2d2b27",
  muted: "#6b6b6b",
  faint: "#8c8678",
  accent: "#4fc3f7",
  primary: "#e94b3c",
} as const;

const IN =
  "h-10 rounded-lg border text-sm font-normal outline-none px-3 w-full transition-colors focus:ring-1 focus:ring-[#4FC3F7]/50 bg-white";

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
};

type FormValues = {
  code: string;
  courseId: string;
  title: string;
  description: string;
  assignmentType: "Retrospective" | "FileUpload" | "Quiz";
  maxPoints: number;
  passScore: number;
  maxAttempts: number;
  isRequiredForModulePass: boolean;
  dueDate: string;
  availableFrom: string;
  availableUntil: string;
  questionBankId: string;
  questionCount: number | null;
  timeLimitMinutes: number | null;
  allowShuffle: boolean;
  shuffleOptions: boolean;
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
};

const NO_COURSE = "none";

export function AssignmentFormPanel({
  moduleId,
  courseOptions,
  assignmentToEdit,
  onSuccess,
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
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? updateAssignmentSchema : createAssignmentSchema) as any,
    values: assignmentToEdit
      ? {
          code: assignmentToEdit.code || "",
          courseId: assignmentToEdit.courseId || NO_COURSE,
          title: assignmentToEdit.title,
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
          code: "",
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
          easyPercent: 0,
          mediumPercent: 0,
          hardPercent: 0,
        },
  });

  const assignmentType = watch("assignmentType");
  const selectedCourseId = watch("courseId");
  const isQuiz = assignmentType === "Quiz";
  const bankCourseId =
    selectedCourseId && selectedCourseId !== NO_COURSE ? selectedCourseId : "";

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

  const onSubmit = async (data: FormValues) => {
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
        dueDate: toApiDateTimeFromLocalInput(data.dueDate),
        availableFrom: toApiDateTimeFromLocalInput(data.availableFrom),
        availableUntil: toApiDateTimeFromLocalInput(data.availableUntil),
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <PHdr
        title={isEdit ? `Chỉnh sửa: ${assignmentToEdit!.title}` : "Tạo Bài tập mới"}
        sub="Bài tập thuộc học phần (module)"
      />
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <STitle>Thông tin cơ bản</STitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Tiêu đề <span style={{ color: W.primary }}>*</span>
              </Label>
              <input
                type="text"
                placeholder="Ví dụ: Báo cáo dự án cuối module"
                {...register("title")}
                className={IN}
                style={{ borderColor: errors.title ? W.primary : W.border }}
              />
              <FErr msg={errors.title?.message as string | undefined} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Mã bài tập
              </Label>
              <input
                type="text"
                placeholder="ASG-001"
                {...register("code")}
                className={cn(IN, "font-mono")}
                style={{ borderColor: W.border }}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Loại bài tập <span style={{ color: W.primary }}>*</span>
              </Label>
              <Controller
                name="assignmentType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg")} style={{ borderColor: W.border }}>
                      <span className="truncate">
                        {ASSIGNMENT_TYPE_LABELS[field.value] ?? field.value}
                      </span>
                    </SelectTrigger>
                    <SelectContent className={LIGHT_SELECT_CONTENT}>
                      <SelectItem value="Retrospective" className={LIGHT_SELECT_ITEM}>Nhật ký phản tư</SelectItem>
                      <SelectItem value="FileUpload" className={LIGHT_SELECT_ITEM}>Nộp tệp</SelectItem>
                      <SelectItem value="Quiz" className={LIGHT_SELECT_ITEM}>Trắc nghiệm</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="col-span-2 flex flex-col space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Gắn với khóa học <span className="text-xs font-normal" style={{ color: W.muted }}>(tùy chọn)</span>
              </Label>
              <Controller
                name="courseId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || NO_COURSE} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg")} style={{ borderColor: W.border }}>
                      <span className="truncate">
                        {field.value === NO_COURSE || !field.value
                          ? "Không gắn khóa học"
                          : courseOptions.find((c) => c.id === field.value)?.name ?? "Không gắn khóa học"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className={LIGHT_SELECT_CONTENT}>
                      <SelectItem value={NO_COURSE} className={LIGHT_SELECT_ITEM}>Không gắn khóa học</SelectItem>
                      {courseOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id} className={LIGHT_SELECT_ITEM}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mô tả</Label>
              <textarea
                rows={3}
                placeholder="Hướng dẫn, yêu cầu nộp bài..."
                {...register("description")}
                className="w-full text-sm p-3 rounded-lg border outline-none resize-none bg-white focus:ring-1 focus:ring-[#4FC3F7]/50"
                style={{ borderColor: W.border }}
              />
            </div>
          </div>
        </div>

        <div>
          <STitle>Điểm & điều kiện</STitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Điểm tối đa <span style={{ color: W.primary }}>*</span>
              </Label>
              <input type="number" {...register("maxPoints", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
              <FErr msg={errors.maxPoints?.message as string | undefined} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Điểm đạt <span style={{ color: W.primary }}>*</span>
              </Label>
              <input type="number" step="0.1" {...register("passScore", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
              <FErr msg={errors.passScore?.message as string | undefined} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Số lần làm tối đa <span style={{ color: W.primary }}>*</span>
              </Label>
              <input type="number" {...register("maxAttempts", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
              <FErr msg={errors.maxAttempts?.message as string | undefined} />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Controller
                name="isRequiredForModulePass"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="req-pass"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="border-[#8c8678] bg-white data-checked:border-primary"
                  />
                )}
              />
              <Label htmlFor="req-pass" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>
                Bắt buộc để qua module
              </Label>
            </div>
          </div>
        </div>

        <div>
          <STitle>Thời gian</STitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Hạn nộp</Label>
              <input type="datetime-local" {...register("dueDate")} className={IN} style={{ borderColor: W.border }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mở từ</Label>
              <input type="datetime-local" {...register("availableFrom")} className={IN} style={{ borderColor: W.border }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Đóng lúc</Label>
              <input type="datetime-local" {...register("availableUntil")} className={IN} style={{ borderColor: W.border }} />
            </div>
          </div>
        </div>

        {isQuiz && (
          <div>
            <STitle>Cấu hình trắc nghiệm</STitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
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
                        <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "w-full")}>
                          <span className="truncate">
                            {banks.find((b) => b.id === field.value)?.name ||
                              (field.value
                                ? `ID: ${field.value.slice(0, 8)}…`
                                : "Chọn ngân hàng đề")}
                          </span>
                        </SelectTrigger>
                        <SelectContent className={LIGHT_SELECT_CONTENT}>
                          <SelectItem value="none" className={LIGHT_SELECT_ITEM}>
                            Chọn ngân hàng đề
                          </SelectItem>
                          {field.value && !known ? (
                            <SelectItem
                              value={field.value}
                              className={LIGHT_SELECT_ITEM}
                            >
                              ID đã lưu: {field.value.slice(0, 8)}…
                            </SelectItem>
                          ) : null}
                          {banks.map((bank) => (
                            <SelectItem
                              key={bank.id}
                              value={bank.id}
                              className={LIGHT_SELECT_ITEM}
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
                {watch("questionBankId") &&
                  bankCourseId &&
                  !banks.some((b) => b.id === watch("questionBankId")) && (
                    <p className="text-[11px]" style={{ color: W.muted }}>
                      Đang dùng ID đã lưu trên bài tập (không có trong cache trình
                      duyệt). Vẫn gửi được khi cập nhật.
                    </p>
                  )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Số câu hỏi</Label>
                <input type="number" {...register("questionCount", { valueAsNumber: true })} className={IN} style={{ borderColor: W.border }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Thời gian (phút)</Label>
                <input type="number" {...register("timeLimitMinutes", { valueAsNumber: true })} className={IN} style={{ borderColor: W.border }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>% Dễ</Label>
                <input type="number" {...register("easyPercent", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: errors.easyPercent ? W.primary : W.border }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>% Trung bình</Label>
                <input type="number" {...register("mediumPercent", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>% Khó</Label>
                <input type="number" {...register("hardPercent", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
              </div>
              <FErr msg={errors.easyPercent?.message as string | undefined} />
              <div className="col-span-2 flex flex-wrap gap-5 pt-1">
                <div className="flex items-center gap-2">
                  <Controller
                    name="allowShuffle"
                    control={control}
                    render={({ field }) => (
                      <Checkbox id="shuffle-q" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="border-[#8c8678] bg-white data-checked:border-primary" />
                    )}
                  />
                  <Label htmlFor="shuffle-q" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>Trộn câu hỏi</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="shuffleOptions"
                    control={control}
                    render={({ field }) => (
                      <Checkbox id="shuffle-o" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="border-[#8c8678] bg-white data-checked:border-primary" />
                    )}
                  />
                  <Label htmlFor="shuffle-o" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>Trộn đáp án</Label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: W.border, background: W.surface }}>
        <Button
          type="submit"
          disabled={busy || ok}
          className={cn(
            "h-9 gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-sm transition-all duration-300",
            ok ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#E94B3C] hover:bg-[#d43f33]",
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
    </form>
  );
}
