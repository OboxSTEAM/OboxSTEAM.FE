"use client";

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash,
  BookOpen,
  FolderOpen,
  Activity as ActivityIcon,
  ClipboardList,
  Flag,
  LayoutGrid,
  Check,
  Save,
  FolderPlus,
  ChevronRight,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ProgramForm } from "@/components/manager/programs/program-form";
import { ActivityMaterialSection } from "@/components/manager/programs/activity-material-section";
import { AssignmentFormPanel } from "@/components/manager/programs/assignment-form-panel";
import { MilestoneFormPanel } from "@/components/manager/programs/milestone-form-panel";
import { QuestionBankSection } from "@/components/manager/programs/question-bank-section";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  createModule,
  updateModule,
  deleteModule,
  createCourse,
  updateCourse,
  deleteCourse,
  createActivity,
  updateActivity,
  deleteActivity,
  deleteAssignment,
  getAssignmentById,
  getMaterialByActivityId,
  deleteResearchMilestone,
  getResearchMilestoneById,
  getResearchMilestonesByModule,
  updateProgram,
  type ProgramWithModules,
  type Module,
  type Course,
  type Activity as ActivityType,
  type ActivityMaterial,
  type AssignmentDetail,
  type ResearchMilestone,
} from "@/lib/api";
import {
  createModuleSchema,
  updateModuleSchema,
  createCourseSchema,
  updateCourseSchema,
  createActivitySchema,
  updateActivitySchema,
} from "@/lib/validations/curriculum";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  LIGHT_SELECT_TRIGGER,
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
} from "@/components/programs/program-select-styles";
import { MODULE_TYPE_LABELS } from "@/lib/programs/constants";
import {
  formatActivityScheduleRange,
  formatApiDateTimeDisplay,
  fromApiDateTimeToLocalInput,
  toApiDateTimeFromLocalInput,
} from "@/lib/curriculum/datetime";

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const W = {
  bg:         "#ede9e0",
  surface:    "#f4f1ea",
  surface2:   "#e7e2d8",
  surface3:   "#ded8cc",
  border:     "#d8d2c6",
  textStrong: "#2d2b27",
  text:       "#3a3833",
  muted:      "#6b6b6b",
  faint:      "#8c8678",
  accent:     "#4fc3f7",
  success:    "#7cb342",
  primary:    "#e94b3c",
} as const;

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  SelfPaced: "Tự học",
  LiveOnline: "Online trực tiếp",
  Offline: "Offline tại lớp",
}

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  Retrospective: "Nhật ký phản tư",
  FileUpload: "Nộp tệp",
  Quiz: "Trắc nghiệm",
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const ACTIVITY_PREFIX: Record<string, string> = {
  SelfPaced: "Tự học", LiveOnline: "Online", Offline: "Offline", OfflineClass: "Offline",
};

/* ─── Selected node ─────────────────────────────────────────────────────────── */
type SelectedNode =
  | { kind: "program" }
  | { kind: "module-new" }
  | { kind: "module"; id: string }
  | { kind: "course-new"; moduleId: string }
  | { kind: "course"; id: string; moduleId: string }
  | { kind: "activity-new"; courseId: string }
  | { kind: "activity"; id: string; courseId: string }
  | { kind: "assignment-new"; moduleId: string }
  | { kind: "assignment"; id: string; moduleId: string }
  | { kind: "milestone-new"; moduleId: string }
  | { kind: "milestone"; id: string; moduleId: string }
  | null;

/* ─── Micro helpers ─────────────────────────────────────────────────────────── */
function STitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: W.faint }}>{children}</p>;
}
function FErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs font-semibold mt-1" style={{ color: W.primary }}>{msg}</p> : null;
}
const IN = "h-10 rounded-lg border text-sm font-normal outline-none px-3 w-full transition-colors focus:ring-1 focus:ring-[#4FC3F7]/50 bg-white";

function SaveBtn({ submitting, success, label = "Lưu thay đổi", ok = "Đã lưu" }: {
  submitting: boolean; success: boolean; label?: string; ok?: string;
}) {
  return (
    <Button type="submit" disabled={submitting || success}
      className={cn("h-9 gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-sm transition-all duration-300",
        success ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#E94B3C] hover:bg-[#d43f33]")}>
      {success
        ? <><Check className="size-4 animate-in zoom-in-50 duration-200" />{ok}</>
        : <><Save className="size-4" />{submitting ? "Đang lưu..." : label}</>}
    </Button>
  );
}

function PHdr({ icon: Icon, color, title, sub }: { icon: React.ElementType; color: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ background: W.surface, borderColor: W.border }}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border" style={{ background: "white", borderColor: W.border }}>
        <Icon className="size-4" style={{ color }} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-snug truncate" style={{ color: W.textStrong }}>{title}</p>
        {sub && <p className="text-xs mt-0.5 truncate" style={{ color: W.muted }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Empty ──────────────────────────────────────────────────────────────────── */
function EmptyPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-20 px-6 text-center">
      <LayoutGrid className="size-10" style={{ color: W.surface3 }} />
      <p className="text-sm font-semibold" style={{ color: W.textStrong }}>Chọn một mục để chỉnh sửa</p>
      <p className="text-xs max-w-[200px]" style={{ color: W.muted }}>Bấm vào tên chương trình, module, khóa học hoặc hoạt động bên trái.</p>
    </div>
  );
}

/* ─── Assignment edit loader (fetch by id when not in session) ───────────────── */
function AssignmentDetailLoader({
  assignmentId,
  moduleId,
  courseOptions,
  initial,
  onSuccess,
}: {
  assignmentId: string;
  moduleId: string;
  courseOptions: { id: string; name: string }[];
  initial: AssignmentDetail | null;
  onSuccess: (a: AssignmentDetail) => void;
}) {
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (initial) {
      setAssignment(initial);
      setLoading(false);
      setFailed(false);
      return;
    }
    let active = true;
    setLoading(true);
    setFailed(false);
    getAssignmentById(assignmentId)
      .then((res) => {
        if (!active) return;
        setAssignment(res?.data ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [assignmentId, initial]);

  if (loading) {
    return (
      <div className="p-5">
        <div className="h-48 w-full animate-pulse rounded-xl" style={{ background: W.surface2 }} />
      </div>
    );
  }
  if (failed || !assignment) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-semibold" style={{ color: W.textStrong }}>
          Không tải được bài tập
        </p>
        <p className="text-xs max-w-[220px]" style={{ color: W.muted }}>
          Bài tập có thể đã bị xóa hoặc phiên làm việc đã hết. Hãy chọn lại từ danh sách.
        </p>
      </div>
    );
  }
  return (
    <AssignmentFormPanel
      moduleId={moduleId}
      courseOptions={courseOptions}
      assignmentToEdit={assignment}
      onSuccess={onSuccess}
    />
  );
}

/* ─── Milestone edit loader (fetch by id when not in loaded list) ─────────────── */
function MilestoneDetailLoader({
  milestoneId,
  moduleId,
  activityOptions,
  initial,
  onSuccess,
}: {
  milestoneId: string;
  moduleId: string;
  activityOptions: { id: string; name: string }[];
  initial: ResearchMilestone | null;
  onSuccess: (m: ResearchMilestone) => void;
}) {
  const [milestone, setMilestone] = useState<ResearchMilestone | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (initial) {
      setMilestone(initial);
      setLoading(false);
      setFailed(false);
      return;
    }
    let active = true;
    setLoading(true);
    setFailed(false);
    getResearchMilestoneById(milestoneId)
      .then((res) => {
        if (!active) return;
        setMilestone(res?.data ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [milestoneId, initial]);

  if (loading) {
    return (
      <div className="p-5">
        <div className="h-48 w-full animate-pulse rounded-xl" style={{ background: W.surface2 }} />
      </div>
    );
  }
  if (failed || !milestone) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-semibold" style={{ color: W.textStrong }}>
          Không tải được milestone
        </p>
        <p className="text-xs max-w-[220px]" style={{ color: W.muted }}>
          Milestone có thể đã bị xóa. Hãy chọn lại từ danh sách.
        </p>
      </div>
    );
  }
  return (
    <MilestoneFormPanel
      moduleId={moduleId}
      activityOptions={activityOptions}
      milestoneToEdit={milestone}
      onSuccess={onSuccess}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MODULE FORM PANEL
══════════════════════════════════════════════════════════════════════════════ */
type MFV = {
  code: string; programId: string; name: string;
  moduleType: "Theory" | "Experiential" | "Research";
  moduleOrder: number; prerequisiteModuleId: string | null;
  isMandatory: boolean; price: number; retakeFee: number; learningOutcomesText: string;
};

function useSuccessFlash() {
  const [ok, setOk] = useState(false);
  const flash = () => { setOk(true); setTimeout(() => setOk(false), 2000); };
  return { ok, flash };
}

function ModuleFormPanel({ programId, moduleToEdit, modulesInProgram, onSuccess }: {
  programId: string; moduleToEdit: Module | null; modulesInProgram: Module[]; onSuccess: () => void;
}) {
  const isEdit = !!moduleToEdit;
  const [busy, setBusy] = useState(false);
  const { ok, flash } = useSuccessFlash();

  const { register, handleSubmit, control, reset, getValues, formState: { errors } } = useForm<MFV>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? updateModuleSchema : createModuleSchema) as any,
    values: moduleToEdit ? {
      code: moduleToEdit.code || "",
      programId: moduleToEdit.programId,
      name: moduleToEdit.name,
      moduleType: moduleToEdit.moduleType,
      moduleOrder: moduleToEdit.moduleOrder,
      prerequisiteModuleId: moduleToEdit.prerequisiteModuleId || null,
      isMandatory: moduleToEdit.isMandatory,
      price: moduleToEdit.price,
      retakeFee: moduleToEdit.retakeFee,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      learningOutcomesText: (moduleToEdit as any).learningOutcomes?.join("\n") || "",
    } : {
      code: "", programId, name: "", moduleType: "Theory" as const,
      moduleOrder: (modulesInProgram.length || 0) + 1,
      prerequisiteModuleId: null, isMandatory: true, price: 0, retakeFee: 0, learningOutcomesText: "",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setBusy(true);
    try {
      // `learningOutcomesText` is a UI-only field absent from the module Zod
      // schema, so the resolver strips it from `data`. Read it straight from the
      // form state so edits actually reach the API payload.
      const outcomesText = getValues("learningOutcomesText") ?? "";
      const outcomes = outcomesText
        ? outcomesText.split("\n").map((s) => s.trim()).filter(Boolean) : [];
      const payload = {
        code: data.code || null, programId: data.programId, name: data.name, moduleType: data.moduleType,
        moduleOrder: Number(data.moduleOrder), prerequisiteModuleId: data.prerequisiteModuleId || null,
        isMandatory: data.isMandatory, price: Number(data.price), retakeFee: Number(data.retakeFee), learningOutcomes: outcomes,
      };
      if (isEdit && moduleToEdit) {
        await updateModule(moduleToEdit.id, payload);
        showAppSuccess({ title: "Cập nhật thành công", description: `Module ${data.name} đã được cập nhật.` });
      } else {
        await createModule(payload);
        showAppSuccess({ title: "Tạo thành công", description: `Đã tạo module ${data.name}.` });
      }
      flash(); onSuccess();
    } catch (err) { showAppErrorFromUnknown(err, "curriculum.module.save"); }
    finally { setBusy(false); }
  };

  const others = modulesInProgram.filter((m) => !isEdit || m.id !== moduleToEdit?.id);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <PHdr icon={FolderOpen} color={W.success}
        title={isEdit ? `Chỉnh sửa: ${moduleToEdit!.name}` : "Tạo Module mới"}
        sub="Học phần trong chương trình học" />
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <STitle>Thông tin cơ bản</STitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Tên Module <span style={{ color: W.primary }}>*</span></Label>
              <input type="text" placeholder="Ví dụ: Robotics Cơ Bản" {...register("name")} className={IN} style={{ borderColor: errors.name ? W.primary : W.border }} />
              <FErr msg={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mã Module</Label>
              <input type="text" placeholder="MOD-001" {...register("code")} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Thứ tự <span style={{ color: W.primary }}>*</span></Label>
              <input type="number" {...register("moduleOrder", { valueAsNumber: true })} className={IN} style={{ borderColor: W.border }} />
              <FErr msg={errors.moduleOrder?.message} />
            </div>
          </div>
        </div>
        <div>
          <STitle>Cấu hình học tập</STitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Loại Module <span style={{ color: W.primary }}>*</span></Label>
              <Controller name="moduleType" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg")} style={{ borderColor: W.border }}>
                    <span className="truncate">
                      {MODULE_TYPE_LABELS[field.value] ?? field.value}
                    </span>
                  </SelectTrigger>
                  <SelectContent className={LIGHT_SELECT_CONTENT}>
                    <SelectItem value="Theory" className={LIGHT_SELECT_ITEM}>Lý thuyết</SelectItem>
                    <SelectItem value="Experiential" className={LIGHT_SELECT_ITEM}>Trải nghiệm</SelectItem>
                    <SelectItem value="Research" className={LIGHT_SELECT_ITEM}>Nghiên cứu</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Module tiên quyết</Label>
              <Controller name="prerequisiteModuleId" control={control} render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? null : v)}>
                  <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg")} style={{ borderColor: W.border }}>
                    <span className="truncate">
                      {!field.value || field.value === "none"
                        ? "Không có"
                        : (others.find((m) => m.id === field.value)?.name ?? "Không có")}
                    </span>
                  </SelectTrigger>
                  <SelectContent className={LIGHT_SELECT_CONTENT}>
                    <SelectItem value="none" className={LIGHT_SELECT_ITEM}>Không có</SelectItem>
                    {others.map((m) => (
                      <SelectItem key={m.id} value={m.id} className={LIGHT_SELECT_ITEM}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Controller name="isMandatory" control={control} render={({ field }) => (
                <Checkbox
                  id="mand"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  className="border-[#8c8678] bg-white data-checked:border-primary"
                />
              )} />
              <Label htmlFor="mand" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>Học phần bắt buộc</Label>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Kiến thức đạt được <span className="text-xs font-normal" style={{ color: W.muted }}>(mỗi dòng một mục)</span></Label>
              <textarea rows={3} placeholder={"Ví dụ:\nHiểu các linh kiện\nLập trình Robot"} {...register("learningOutcomesText")} className="w-full text-sm p-3 rounded-lg border outline-none resize-none bg-white focus:ring-1 focus:ring-[#4FC3F7]/50" style={{ borderColor: W.border }} />
            </div>
          </div>
        </div>
        <div>
          <STitle>Học phí</STitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Học phí (VND) <span style={{ color: W.primary }}>*</span></Label>
              <input type="number" placeholder="0" {...register("price", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
              <FErr msg={errors.price?.message} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Học lại (VND) <span style={{ color: W.primary }}>*</span></Label>
              <input type="number" placeholder="0" {...register("retakeFee", { valueAsNumber: true })} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
              <FErr msg={errors.retakeFee?.message} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: W.border, background: W.surface }}>
        <SaveBtn submitting={busy} success={ok} label={isEdit ? "Lưu thay đổi" : "Tạo Module"} />
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   COURSE FORM PANEL
══════════════════════════════════════════════════════════════════════════════ */
function CourseFormPanel({ moduleId, courseToEdit, onSuccess }: {
  moduleId: string; courseToEdit: Course | null; onSuccess: () => void;
}) {
  const isEdit = !!courseToEdit;
  const [busy, setBusy] = useState(false);
  const { ok, flash } = useSuccessFlash();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? updateCourseSchema : createCourseSchema),
    values: courseToEdit
      ? { code: courseToEdit.code || "", moduleId: courseToEdit.moduleId, name: courseToEdit.name, description: courseToEdit.description || "" }
      : { code: "", moduleId, name: "", description: "" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setBusy(true);
    try {
      const payload = { code: data.code || null, moduleId: data.moduleId, name: data.name, description: data.description || "" };
      if (isEdit && courseToEdit) {
        await updateCourse(courseToEdit.id, payload);
        showAppSuccess({ title: "Cập nhật thành công", description: `Khóa học ${data.name} đã được cập nhật.` });
      } else {
        await createCourse(payload);
        showAppSuccess({ title: "Tạo thành công", description: `Đã tạo khóa học ${data.name}.` });
      }
      flash(); onSuccess();
    } catch (err) { showAppErrorFromUnknown(err, "curriculum.course.save"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <PHdr icon={BookOpen} color={W.accent} title={isEdit ? `Chỉnh sửa: ${courseToEdit!.name}` : "Tạo Khóa học mới"} sub="Khóa học trong học phần" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <STitle>Thông tin khóa học</STitle>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Tên Khóa học <span style={{ color: W.primary }}>*</span></Label>
          <input type="text" placeholder="Ví dụ: Nhập môn lập trình với Scratch" {...register("name")} className={IN} style={{ borderColor: errors.name ? W.primary : W.border }} />
          <FErr msg={errors.name?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mã Khóa học</Label>
          <input type="text" placeholder="CRS-001" {...register("code")} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mô tả</Label>
          <textarea rows={4} placeholder="Mô tả tóm tắt nội dung..." {...register("description")} className="w-full text-sm p-3 rounded-lg border outline-none resize-none bg-white focus:ring-1 focus:ring-[#4FC3F7]/50" style={{ borderColor: W.border }} />
        </div>

        {isEdit && courseToEdit ? (
          <QuestionBankSection courseId={courseToEdit.id} />
        ) : (
          <div className="border-t pt-5" style={{ borderColor: W.border }}>
            <STitle>Ngân hàng câu hỏi</STitle>
            <p className="rounded-xl border border-dashed p-4 text-xs" style={{ borderColor: W.border, color: W.muted }}>
              Lưu khóa học trước, sau đó bạn có thể tạo ngân hàng câu hỏi tại đây.
            </p>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: W.border, background: W.surface }}>
        <SaveBtn submitting={busy} success={ok} label={isEdit ? "Lưu thay đổi" : "Tạo Khóa học"} />
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ACTIVITY FORM PANEL
══════════════════════════════════════════════════════════════════════════════ */
function ActivityFormPanel({ courseId, activityToEdit, onSuccess }: {
  courseId: string; activityToEdit: ActivityType | null; onSuccess: () => void;
}) {
  const isEdit = !!activityToEdit;
  const [busy, setBusy] = useState(false);
  const { ok, flash } = useSuccessFlash();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? updateActivitySchema : createActivitySchema),
    values: activityToEdit ? {
      code: activityToEdit.code || "", courseId: activityToEdit.courseId, name: activityToEdit.name,
      activityType: activityToEdit.activityType, description: activityToEdit.description || "",
      activityOrder: activityToEdit.activityOrder, location: activityToEdit.location || "",
      startTime: fromApiDateTimeToLocalInput(activityToEdit.startTime),
      endTime: fromApiDateTimeToLocalInput(activityToEdit.endTime),
      maxCapacity: activityToEdit.maxCapacity,
      requireQrCheckin: activityToEdit.requireQrCheckin, requireMediaEvidence: activityToEdit.requireMediaEvidence,
    } : {
      code: "", courseId, name: "", activityType: "SelfPaced" as const, description: "", activityOrder: 1,
      location: "", startTime: "", endTime: "", maxCapacity: null as number | null,
      requireQrCheckin: false, requireMediaEvidence: false,
    },
  });

  const actType = watch("activityType");
  const activityId = activityToEdit?.id;
  const [existingMaterial, setExistingMaterial] = useState<ActivityMaterial | null>(
    activityToEdit?.material ?? null,
  );
  const [materialLoading, setMaterialLoading] = useState(isEdit);
  const [showMaterial, setShowMaterial] = useState(!!activityToEdit?.material);

  // The activity payload may omit its material; ask the server so the checkbox
  // reflects reality (ticked from load) and we never show a stale/other file.
  // Material only applies to SelfPaced activities.
  useEffect(() => {
    if (!isEdit || !activityId || activityToEdit?.activityType !== "SelfPaced") {
      setMaterialLoading(false);
      return;
    }
    let cancelled = false;
    setMaterialLoading(true);
    void (async () => {
      try {
        const result = await getMaterialByActivityId(activityId);
        if (cancelled) return;
        if (result?.data) {
          setExistingMaterial(result.data);
          setShowMaterial(true);
        }
      } catch {
        // No material yet, or not permitted — keep the upload form available.
      } finally {
        if (!cancelled) setMaterialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, activityId, activityToEdit?.activityType]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setBusy(true);
    try {
      const live = data.activityType !== "SelfPaced";
      const orderNum = Number(data.activityOrder);
      const payload = {
        code: data.code || null, courseId: data.courseId, name: data.name, activityType: data.activityType,
        description: data.description || "", activityOrder: orderNum,
        location: live ? data.location || null : null,
        startTime: live ? toApiDateTimeFromLocalInput(data.startTime) : null,
        endTime: live ? toApiDateTimeFromLocalInput(data.endTime) : null,
        maxCapacity: live && data.maxCapacity ? Number(data.maxCapacity) : null,
        requireQrCheckin: data.requireQrCheckin, requireMediaEvidence: data.requireMediaEvidence,
      };
      if (isEdit && activityToEdit) {
        // The backend re-validates ActivityOrder against the course max on update,
        // so omit it when unchanged to avoid a false "must be greater" rejection.
        const orderUnchanged = orderNum === activityToEdit.activityOrder;
        await updateActivity(activityToEdit.id, {
          ...payload,
          activityOrder: orderUnchanged ? undefined : orderNum,
        });
        showAppSuccess({ title: "Cập nhật thành công", description: `Hoạt động ${data.name} đã được cập nhật.` });
      } else {
        await createActivity(payload);
        showAppSuccess({ title: "Tạo thành công", description: `Đã tạo hoạt động ${data.name}.` });
      }
      flash(); onSuccess();
    } catch (err) { showAppErrorFromUnknown(err, "curriculum.activity.save"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <PHdr icon={ActivityIcon} color="#9c27b0" title={isEdit ? `Chỉnh sửa: ${activityToEdit!.name}` : "Tạo Hoạt động mới"} sub="Hoạt động học tập trong khóa học" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <STitle>Thông tin hoạt động</STitle>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1 space-y-1.5">
            <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Tên Hoạt động <span style={{ color: W.primary }}>*</span></Label>
            <input type="text" placeholder="Ví dụ: Xem Video hướng dẫn Assembly" {...register("name")} className={IN} style={{ borderColor: errors.name ? W.primary : W.border }} />
            <FErr msg={errors.name?.message} />
          </div>
          <div className="col-span-2 md:col-span-1 space-y-1.5">
            <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mã Hoạt động</Label>
            <input type="text" placeholder="ACT-001" {...register("code")} className={cn(IN, "font-mono")} style={{ borderColor: W.border }} />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Loại Hoạt động <span style={{ color: W.primary }}>*</span></Label>
            <Controller name="activityType" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => {
                field.onChange(v);
                // Self-paced activities have no schedule; clear stale values so they
                // are not resurfaced (and are sent as null on save).
                if (v === "SelfPaced") {
                  setValue("location", "");
                  setValue("startTime", "");
                  setValue("endTime", "");
                  setValue("maxCapacity", null);
                }
              }}>
                <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg")} style={{ borderColor: W.border }}>
                  <span className="truncate">
                    {(field.value && ACTIVITY_TYPE_LABELS[field.value]) || field.value || "Chọn loại"}
                  </span>
                </SelectTrigger>
                <SelectContent className={LIGHT_SELECT_CONTENT}>
                  <SelectItem value="SelfPaced" className={LIGHT_SELECT_ITEM}>Tự học</SelectItem>
                  <SelectItem value="LiveOnline" className={LIGHT_SELECT_ITEM}>Online trực tiếp</SelectItem>
                  <SelectItem value="Offline" className={LIGHT_SELECT_ITEM}>Offline tại lớp</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Thứ tự <span style={{ color: W.primary }}>*</span></Label>
            <input type="number" {...register("activityOrder", { valueAsNumber: true })} className={IN} style={{ borderColor: W.border }} />
          </div>

          {actType !== "SelfPaced" && (
            <>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Địa điểm / Đường dẫn <span style={{ color: W.primary }}>*</span></Label>
                <input type="text" placeholder={actType === "LiveOnline" ? "Zoom, Google Meet..." : "Phòng 201, Tòa nhà A..."} {...register("location")} className={IN} style={{ borderColor: W.border }} />
              </div>
              {isEdit && activityToEdit?.startTime ? (
                <div
                  className="col-span-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ background: W.surface2, color: W.text }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: W.faint }}>
                    Lịch hiện tại
                  </p>
                  <p className="mt-0.5 font-medium" style={{ color: W.textStrong }}>
                    {formatApiDateTimeDisplay(activityToEdit.startTime)}
                    {activityToEdit.endTime
                      ? ` → ${formatApiDateTimeDisplay(activityToEdit.endTime)}`
                      : ""}
                  </p>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Bắt đầu <span style={{ color: W.primary }}>*</span></Label>
                <input type="datetime-local" {...register("startTime")} className={IN} style={{ borderColor: W.border }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Kết thúc <span style={{ color: W.primary }}>*</span></Label>
                <input type="datetime-local" {...register("endTime")} className={IN} style={{ borderColor: W.border }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Sức chứa tối đa</Label>
                <input type="number" placeholder="Không giới hạn" {...register("maxCapacity")} className={IN} style={{ borderColor: W.border }} />
              </div>
            </>
          )}

          <div className="col-span-2 grid grid-cols-2 gap-4 pt-1">
            <div className="flex items-center gap-2">
              <Controller name="requireQrCheckin" control={control} render={({ field }) => (
                <Checkbox
                  id="qr"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  className="border-[#8c8678] bg-white data-checked:border-primary"
                />
              )} />
              <Label htmlFor="qr" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>Yêu cầu Check-in QR</Label>
            </div>
            <div className="flex items-center gap-2">
              <Controller name="requireMediaEvidence" control={control} render={({ field }) => (
                <Checkbox
                  id="med"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  className="border-[#8c8678] bg-white data-checked:border-primary"
                />
              )} />
              <Label htmlFor="med" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>Yêu cầu minh chứng</Label>
            </div>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mô tả hoạt động</Label>
            <textarea rows={3} placeholder="Nhập hướng dẫn chi tiết..." {...register("description")} className="w-full text-sm p-3 rounded-lg border outline-none resize-none bg-white focus:ring-1 focus:ring-[#4FC3F7]/50" style={{ borderColor: W.border }} />
          </div>
        </div>

        {actType === "SelfPaced" ? (
          <div className="border-t pt-5" style={{ borderColor: W.border }}>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={showMaterial}
                onCheckedChange={(v) => setShowMaterial(v === true)}
                disabled={materialLoading}
                className="border-[#8c8678] bg-white data-checked:border-primary"
              />
              <span className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Đính kèm tài liệu học tập
              </span>
              {materialLoading && (
                <span className="text-xs" style={{ color: W.faint }}>Đang kiểm tra…</span>
              )}
            </label>

            {showMaterial ? (
              <div className="mt-4">
                {isEdit && activityToEdit ? (
                  materialLoading ? (
                    <p className="text-xs" style={{ color: W.faint }}>Đang tải tài liệu…</p>
                  ) : (
                    <ActivityMaterialSection
                      activityId={activityToEdit.id}
                      initialMaterial={existingMaterial}
                      onChanged={onSuccess}
                    />
                  )
                ) : (
                  <p className="rounded-xl border border-dashed p-4 text-xs" style={{ borderColor: W.border, color: W.muted }}>
                    Lưu hoạt động trước, sau đó bạn có thể đính kèm tài liệu học tập tại đây.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : existingMaterial ? (
          <div className="border-t pt-5" style={{ borderColor: W.border }}>
            <div
              className="flex items-start gap-2.5 rounded-xl border p-3.5 text-xs"
              style={{ borderColor: "#f0c36d", background: "#fdf6e3", color: "#8a6d1f" }}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-relaxed">
                Hoạt động này có tài liệu{existingMaterial.title ? ` “${existingMaterial.title}”` : ""}. Hình thức không phải
                Tự học sẽ <strong>ẩn tài liệu</strong> khỏi học viên (không xóa). Đổi lại “Tự học” để dùng, hoặc xóa tài liệu thủ công.
              </p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: W.border, background: W.surface }}>
        <SaveBtn submitting={busy} success={ok} label={isEdit ? "Lưu thay đổi" : "Tạo Hoạt động"} />
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PROGRAM INFO PANEL
══════════════════════════════════════════════════════════════════════════════ */
function ProgramInfoPanel({ program, onSuccess }: { program: ProgramWithModules; onSuccess: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { ok, flash } = useSuccessFlash();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (values: any) => {
    setBusy(true);
    try {
      const res = await updateProgram(program.id, values);
      if (!res) throw new Error("Không có phản hồi từ hệ thống.");
      flash();
      showAppSuccess({ title: "Cập nhật thành công", description: "Chương trình đã được cập nhật." });
      router.refresh(); onSuccess();
    } catch (err) { showAppErrorFromUnknown(err, "programs.update"); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PHdr icon={LayoutGrid} color={W.primary} title={program.name} sub={`Mã: ${program.code} · Thông tin chung`} />
      <div className="flex-1 overflow-y-auto p-5">
        <ProgramForm
          initialValues={{
            code: program.code, name: program.name, seriesName: program.seriesName,
            description: program.description, category: program.category || "Science",
            level: program.level, estimatedDuration: program.estimatedDuration,
            skillsGained: program.skillsGained, thumbnailUrl: program.thumbnailUrl || "",
            status: program.status, price: program.price,
          }}
          onSubmit={handleUpdate}
          isLoading={busy}
        />
      </div>
      <div className="flex justify-end px-5 py-3 border-t shrink-0" style={{ borderColor: W.border, background: W.surface }}>
        <Button
          type="button"
          disabled={busy || ok}
          onClick={() => { const b = document.getElementById("__program-form-submit"); if (b) (b as HTMLButtonElement).click(); }}
          className={cn("h-9 gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-sm transition-all duration-300",
            ok ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#E94B3C] hover:bg-[#d43f33]")}
        >
          {ok ? <><Check className="size-4 animate-in zoom-in-50 duration-200" />Đã lưu</> : <><Save className="size-4" />{busy ? "Đang lưu..." : "Lưu thay đổi"}</>}
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STRUCTURE CARD
══════════════════════════════════════════════════════════════════════════════ */
type StructureNodeKind =
  | "program"
  | "module"
  | "course"
  | "activity"
  | "assignment"
  | "milestone";

const STRUCTURE_NODE_ICON: Record<
  StructureNodeKind,
  { Icon: LucideIcon; color: string; bg: string }
> = {
  program: { Icon: LayoutGrid, color: "#E94B3C", bg: "#ffffff" },
  module: { Icon: FolderOpen, color: "#7CB342", bg: "#ffffff" },
  course: { Icon: BookOpen, color: "#4FC3F7", bg: "#ffffff" },
  activity: { Icon: ActivityIcon, color: "#9c27b0", bg: "#ffffff" },
  assignment: { Icon: ClipboardList, color: "#f59e0b", bg: "#ffffff" },
  milestone: { Icon: Flag, color: "#8b5cf6", bg: "#ffffff" },
};

function StructureTreeRow({
  depth,
  isLast,
  selected,
  kind,
  label,
  meta,
  onSelect,
  onDelete,
  onAdd,
  addLabel,
  defaultOpen = false,
  forceOpen = false,
  children,
}: {
  depth: number;
  isLast: boolean;
  selected: boolean;
  kind: StructureNodeKind;
  label: string;
  meta?: string;
  onSelect: () => void;
  onDelete?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  /** Initial expand state (e.g. program root). */
  defaultOpen?: boolean;
  /** Keep open when selection / create-flow lives under this node. */
  forceOpen?: boolean;
  children?: ReactNode;
}) {
  const childItems = useMemo(
    () => (Array.isArray(children) ? children : [children]).filter(Boolean),
    [children],
  );
  const hasBranch = childItems.length > 0;
  const [open, setOpen] = useState(defaultOpen || forceOpen);
  const { Icon: NodeIcon, color: iconColor, bg: iconBg } = STRUCTURE_NODE_ICON[kind];

  useEffect(() => {
    if (forceOpen || selected) setOpen(true);
  }, [forceOpen, selected]);

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleAdd = () => {
    if (hasBranch) setOpen(true);
    onAdd?.();
  };

  return (
    <li className="relative">
      {/* Guides live in a gutter; content box starts after so it never covers the lines */}
      {depth > 0 && (
        <>
          <span
            className={cn(
              "pointer-events-none absolute left-0 z-0 w-px",
              isLast ? "top-0 h-[1.125rem]" : "inset-y-0",
            )}
            style={{ background: W.border }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute top-[1.125rem] left-0 z-0 h-px w-3"
            style={{ background: W.border }}
            aria-hidden
          />
        </>
      )}

      <div className={cn("relative z-10", depth > 0 && "ml-3")}>
        <div
          className="group/tr flex items-center gap-0.5 rounded-lg"
          style={{
            background: selected ? "rgba(79,195,247,0.13)" : "transparent",
            border: selected
              ? "1px solid rgba(79,195,247,0.28)"
              : "1px solid transparent",
          }}
        >
          {hasBranch ? (
            <button
              type="button"
              title={open ? "Thu gọn" : "Mở rộng"}
              aria-expanded={open}
              aria-label={open ? `Thu gọn ${label}` : `Mở rộng ${label}`}
              onClick={handleToggle}
              className="flex size-6 shrink-0 items-center justify-center rounded"
              style={{ color: W.faint }}
            >
              <ChevronRight
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  open && "rotate-90",
                )}
              />
            </button>
          ) : (
            <span className="size-6 shrink-0" aria-hidden />
          )}

          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-[7px] border shadow-[0_1px_2px_rgba(45,43,39,0.06)]"
            style={{
              background: iconBg,
              borderColor: selected ? "rgba(79,195,247,0.35)" : W.border,
              color: iconColor,
            }}
            aria-hidden
          >
            <NodeIcon className="size-3.5" strokeWidth={2.25} />
          </span>

          <button
            type="button"
            onClick={() => {
              if (hasBranch) setOpen(true);
              onSelect();
            }}
            className="flex min-w-0 flex-1 flex-col py-1.5 pl-1.5 pr-2 text-left"
          >
            <span
              className="truncate text-[12.5px] leading-snug"
              style={{
                color: selected ? "#0d6e9c" : W.text,
                fontWeight: selected ? 600 : 500,
              }}
            >
              {label}
            </span>
            {meta && (
              <span className="mt-0.5 truncate text-[10px]" style={{ color: W.faint }}>
                {meta}
              </span>
            )}
          </button>

          <div className="flex shrink-0 items-center gap-px pr-0.5 opacity-0 transition-opacity group-hover/tr:opacity-100">
            {onAdd && (
              <button
                type="button"
                title={addLabel || "Thêm"}
                onClick={handleAdd}
                className="flex size-6 items-center justify-center rounded"
                style={{ color: W.faint }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = W.success;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = W.faint;
                }}
              >
                <Plus className="size-3" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                title="Xóa"
                onClick={onDelete}
                className="flex size-6 items-center justify-center rounded"
                style={{ color: W.faint }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = W.primary;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = W.faint;
                }}
              >
                <Trash className="size-3" />
              </button>
            )}
          </div>
        </div>

        {hasBranch && open ? (
          <ul className="relative mt-0.5" role="list">
            {children}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

function ParentPathBreadcrumb({
  parts,
}: {
  parts: { label: string; onClick?: () => void }[];
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1 px-3 py-2 text-[11px]" aria-label="Đường dẫn cha">
      {parts.map((part, i) => (
        <span key={`${part.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3" style={{ color: W.faint }} />}
          {part.onClick ? (
            <button
              type="button"
              onClick={part.onClick}
              className="truncate font-medium hover:underline"
              style={{ color: W.muted, maxWidth: 120 }}
            >
              {part.label}
            </button>
          ) : (
            <span className="truncate font-semibold" style={{ color: W.textStrong, maxWidth: 140 }}>
              {part.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function selToQuery(sel: SelectedNode): string {
  if (!sel || sel.kind === "program") return "";
  const params = new URLSearchParams();
  if (sel.kind === "module-new") {
    params.set("node", "module-new");
  } else if (sel.kind === "module") {
    params.set("node", "module");
    params.set("id", sel.id);
  } else if (sel.kind === "course-new") {
    params.set("node", "course-new");
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "course") {
    params.set("node", "course");
    params.set("id", sel.id);
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "activity-new") {
    params.set("node", "activity-new");
    params.set("courseId", sel.courseId);
  } else if (sel.kind === "activity") {
    params.set("node", "activity");
    params.set("id", sel.id);
    params.set("courseId", sel.courseId);
  } else if (sel.kind === "assignment-new") {
    params.set("node", "assignment-new");
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "assignment") {
    params.set("node", "assignment");
    params.set("id", sel.id);
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "milestone-new") {
    params.set("node", "milestone-new");
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "milestone") {
    params.set("node", "milestone");
    params.set("id", sel.id);
    params.set("moduleId", sel.moduleId);
  }
  return params.toString();
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN: CurriculumSplitPanel
══════════════════════════════════════════════════════════════════════════════ */
type CurriculumSplitPanelProps = { program: ProgramWithModules; onRefresh: () => void };

function parseSelFromSearch(
  searchParams: URLSearchParams,
  modules: Module[],
): SelectedNode | null {
  const node = searchParams.get("node");
  if (!node) return null;

  if (node === "program") return { kind: "program" };
  if (node === "module-new") return { kind: "module-new" };
  if (node === "course-new") {
    const moduleId = searchParams.get("moduleId");
    if (moduleId && modules.some((m) => m.id === moduleId)) {
      return { kind: "course-new", moduleId };
    }
    return null;
  }
  if (node === "activity-new") {
    const courseId = searchParams.get("courseId");
    if (courseId && modules.some((m) => m.courses?.some((c) => c.id === courseId))) {
      return { kind: "activity-new", courseId };
    }
    return null;
  }
  if (node === "assignment-new") {
    const moduleId = searchParams.get("moduleId");
    if (moduleId && modules.some((m) => m.id === moduleId)) {
      return { kind: "assignment-new", moduleId };
    }
    return null;
  }
  if (node === "assignment") {
    const id = searchParams.get("id");
    const moduleId = searchParams.get("moduleId");
    if (id && moduleId && modules.some((m) => m.id === moduleId)) {
      return { kind: "assignment", id, moduleId };
    }
    return null;
  }
  if (node === "milestone-new") {
    const moduleId = searchParams.get("moduleId");
    if (moduleId && modules.some((m) => m.id === moduleId)) {
      return { kind: "milestone-new", moduleId };
    }
    return null;
  }
  if (node === "milestone") {
    const id = searchParams.get("id");
    const moduleId = searchParams.get("moduleId");
    if (id && moduleId && modules.some((m) => m.id === moduleId)) {
      return { kind: "milestone", id, moduleId };
    }
    return null;
  }

  const id = searchParams.get("id");
  if (node === "module") {
    if (id && modules.some((m) => m.id === id)) return { kind: "module", id };
    // Platform "Module" click without id → first module
    if (modules[0]) return { kind: "module", id: modules[0].id };
    return { kind: "module-new" };
  }
  if (node === "course") {
    if (!id) {
      const first = modules.flatMap((m) =>
        (m.courses || []).map((c) => ({ course: c, moduleId: m.id })),
      )[0];
      if (first) return { kind: "course", id: first.course.id, moduleId: first.moduleId };
      if (modules[0]) return { kind: "course-new", moduleId: modules[0].id };
      return null;
    }
    const moduleId = searchParams.get("moduleId");
    const mod =
      modules.find((m) => m.id === moduleId) ||
      modules.find((m) => m.courses?.some((c) => c.id === id));
    if (mod?.courses?.some((c) => c.id === id)) {
      return { kind: "course", id, moduleId: mod.id };
    }
    return null;
  }
  if (node === "activity") {
    if (!id) {
      const first = modules
        .flatMap((m) => m.courses || [])
        .flatMap((c) =>
          (c.activities || []).map((a) => ({ activity: a, courseId: c.id })),
        )[0];
      if (first) return { kind: "activity", id: first.activity.id, courseId: first.courseId };
      const firstCourse = modules.flatMap((m) => m.courses || [])[0];
      if (firstCourse) return { kind: "activity-new", courseId: firstCourse.id };
      return null;
    }
    const courseId = searchParams.get("courseId");
    const course =
      modules.flatMap((m) => m.courses || []).find((c) => c.id === courseId) ||
      modules.flatMap((m) => m.courses || []).find((c) => c.activities?.some((a) => a.id === id));
    if (course?.activities?.some((a) => a.id === id)) {
      return { kind: "activity", id, courseId: course.id };
    }
  }
  return null;
}

export function CurriculumSplitPanel({ program, onRefresh }: CurriculumSplitPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modules = useMemo(
    () => [...(program.modules || [])].sort((a, b) => a.moduleOrder - b.moduleOrder),
    [program.modules],
  );

  const [sel, setSel] = useState<SelectedNode>(() => {
    return parseSelFromSearch(searchParams, modules) ?? { kind: "program" };
  });
  const [delTarget, setDelTarget] = useState<{
    type: "module" | "course" | "activity" | "assignment" | "milestone";
    id: string;
    name: string;
    moduleId?: string;
  } | null>(null);

  /**
   * Assignments created/edited this session, keyed by moduleId. The backend has no
   * "list assignments by module" endpoint yet (see plan.md), so the tree can only
   * surface assignments the manager touched in this session.
   */
  const [sessionAssignments, setSessionAssignments] = useState<
    Record<string, AssignmentDetail[]>
  >({});

  const upsertSessionAssignment = useCallback((assignment: AssignmentDetail) => {
    setSessionAssignments((prev) => {
      const list = prev[assignment.moduleId] ?? [];
      const next = list.some((a) => a.id === assignment.id)
        ? list.map((a) => (a.id === assignment.id ? assignment : a))
        : [...list, assignment];
      return { ...prev, [assignment.moduleId]: next };
    });
  }, []);

  const removeSessionAssignment = useCallback((moduleId: string, id: string) => {
    setSessionAssignments((prev) => {
      const list = prev[moduleId] ?? [];
      return { ...prev, [moduleId]: list.filter((a) => a.id !== id) };
    });
  }, []);

  /** Milestones per Research module (has a list endpoint, unlike assignments). */
  const [milestonesByModule, setMilestonesByModule] = useState<
    Record<string, ResearchMilestone[]>
  >({});

  const researchIdsKey = modules
    .filter((m) => m.moduleType === "Research")
    .map((m) => m.id)
    .join(",");

  useEffect(() => {
    if (!researchIdsKey) return;
    const ids = researchIdsKey.split(",");
    let active = true;
    ids.forEach((mid) => {
      getResearchMilestonesByModule(mid)
        .then((res) => {
          if (active) {
            setMilestonesByModule((prev) => ({ ...prev, [mid]: res?.data ?? [] }));
          }
        })
        .catch(() => {
          /* module may have no milestones yet — ignore */
        });
    });
    return () => {
      active = false;
    };
  }, [researchIdsKey]);

  const upsertMilestone = useCallback((milestone: ResearchMilestone) => {
    setMilestonesByModule((prev) => {
      const list = prev[milestone.moduleId] ?? [];
      const next = list.some((m) => m.id === milestone.id)
        ? list.map((m) => (m.id === milestone.id ? milestone : m))
        : [...list, milestone];
      return { ...prev, [milestone.moduleId]: next };
    });
  }, []);

  const removeMilestone = useCallback((moduleId: string, id: string) => {
    setMilestonesByModule((prev) => {
      const list = prev[moduleId] ?? [];
      return { ...prev, [moduleId]: list.filter((m) => m.id !== id) };
    });
  }, []);

  const select = useCallback(
    (next: SelectedNode) => {
      setSel(next);
      const qs = selToQuery(next);
      const nextUrl = qs ? `${pathname}?${qs}` : pathname;
      const currentQs = searchParams.toString();
      const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname;
      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const next = parseSelFromSearch(searchParams, modules);
    if (!next) {
      if (!searchParams.get("node") && sel?.kind !== "program") {
        setSel({ kind: "program" });
      }
      return;
    }
    setSel((prev) => {
      const same =
        prev?.kind === next.kind &&
        JSON.stringify(prev) === JSON.stringify(next);
      return same ? prev : next;
    });
  // Only react to URL / module tree changes — not local sel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, modules]);

  const context = useMemo(() => {
    let module: Module | null = null;
    let course: Course | null = null;
    let activity: ActivityType | null = null;

    if (
      sel?.kind === "module" ||
      sel?.kind === "course-new" ||
      sel?.kind === "assignment-new" ||
      sel?.kind === "assignment" ||
      sel?.kind === "milestone-new" ||
      sel?.kind === "milestone"
    ) {
      const moduleId =
        sel.kind === "module" ? sel.id : sel.moduleId;
      module = modules.find((m) => m.id === moduleId) ?? null;
    } else if (sel?.kind === "course") {
      module = modules.find((m) => m.id === sel.moduleId) ?? null;
      course = module?.courses?.find((c) => c.id === sel.id) ?? null;
    } else if (sel?.kind === "activity" || sel?.kind === "activity-new") {
      const courseId = sel.courseId;
      module = modules.find((m) => m.courses?.some((c) => c.id === courseId)) ?? null;
      course = module?.courses?.find((c) => c.id === courseId) ?? null;
      if (sel.kind === "activity") {
        activity = course?.activities?.find((a) => a.id === sel.id) ?? null;
      }
    }

    return { module, course, activity };
  }, [sel, modules]);

  const pathParts = useMemo(() => {
    const parts: { label: string; onClick?: () => void }[] = [
      { label: program.name, onClick: () => select({ kind: "program" }) },
    ];
    if (context.module) {
      parts.push({
        label: context.module.name,
        onClick: () => select({ kind: "module", id: context.module!.id }),
      });
    }
    if (context.course) {
      parts.push({
        label: context.course.name,
        onClick: () =>
          select({
            kind: "course",
            id: context.course!.id,
            moduleId: context.module!.id,
          }),
      });
    }
    if (context.activity) {
      parts.push({ label: context.activity.name });
    } else if (sel?.kind === "module-new") {
      parts.push({ label: "Module mới" });
    } else if (sel?.kind === "course-new") {
      parts.push({ label: "Khóa học mới" });
    } else if (sel?.kind === "activity-new") {
      parts.push({ label: "Hoạt động mới" });
    } else if (sel?.kind === "assignment-new") {
      parts.push({ label: "Bài tập mới" });
    } else if (sel?.kind === "assignment") {
      parts.push({ label: "Bài tập" });
    } else if (sel?.kind === "milestone-new") {
      parts.push({ label: "Milestone mới" });
    } else if (sel?.kind === "milestone") {
      parts.push({ label: "Milestone" });
    }
    return parts;
  }, [program.name, context, sel, select]);

  const handleDel = async () => {
    if (!delTarget) return;
    try {
      if (delTarget.type === "module") {
        await deleteModule(delTarget.id);
        showAppSuccess({ title: "Đã xóa", description: `Module: ${delTarget.name}` });
      } else if (delTarget.type === "course") {
        await deleteCourse(delTarget.id);
        showAppSuccess({ title: "Đã xóa", description: `Khóa học: ${delTarget.name}` });
      } else if (delTarget.type === "activity") {
        await deleteActivity(delTarget.id);
        showAppSuccess({ title: "Đã xóa", description: `Hoạt động: ${delTarget.name}` });
      } else if (delTarget.type === "assignment") {
        await deleteAssignment(delTarget.id);
        if (delTarget.moduleId) removeSessionAssignment(delTarget.moduleId, delTarget.id);
        showAppSuccess({ title: "Đã xóa", description: `Bài tập: ${delTarget.name}` });
        if (delTarget.moduleId) {
          select({ kind: "module", id: delTarget.moduleId });
          setDelTarget(null);
          return;
        }
      } else {
        await deleteResearchMilestone(delTarget.id);
        if (delTarget.moduleId) removeMilestone(delTarget.moduleId, delTarget.id);
        showAppSuccess({ title: "Đã xóa", description: `Milestone: ${delTarget.name}` });
        if (delTarget.moduleId) {
          select({ kind: "module", id: delTarget.moduleId });
          setDelTarget(null);
          return;
        }
      }
      select({ kind: "program" });
      onRefresh();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.node.delete");
    } finally {
      setDelTarget(null);
    }
  };

  const detail = useCallback((): React.ReactNode => {
    if (!sel) return <EmptyPanel />;
    if (sel.kind === "program") return <ProgramInfoPanel program={program} onSuccess={onRefresh} />;
    if (sel.kind === "module-new") {
      return (
        <ModuleFormPanel
          programId={program.id}
          moduleToEdit={null}
          modulesInProgram={modules}
          onSuccess={() => {
            onRefresh();
            select({ kind: "program" });
          }}
        />
      );
    }
    if (sel.kind === "module") {
      const mod = modules.find((m) => m.id === sel.id) || null;
      return (
        <ModuleFormPanel
          programId={program.id}
          moduleToEdit={mod}
          modulesInProgram={modules}
          onSuccess={onRefresh}
        />
      );
    }
    if (sel.kind === "course-new") {
      return (
        <CourseFormPanel
          moduleId={sel.moduleId}
          courseToEdit={null}
          onSuccess={() => {
            onRefresh();
            select({ kind: "module", id: sel.moduleId });
          }}
        />
      );
    }
    if (sel.kind === "course") {
      const course =
        modules.find((m) => m.id === sel.moduleId)?.courses?.find((c) => c.id === sel.id) || null;
      return (
        <CourseFormPanel key={sel.id} moduleId={sel.moduleId} courseToEdit={course} onSuccess={onRefresh} />
      );
    }
    if (sel.kind === "activity-new") {
      return (
        <ActivityFormPanel
          key={`activity-new-${sel.courseId}`}
          courseId={sel.courseId}
          activityToEdit={null}
          onSuccess={() => {
            onRefresh();
            const mod = modules.find((m) => m.courses?.some((c) => c.id === sel.courseId));
            if (mod) select({ kind: "course", id: sel.courseId, moduleId: mod.id });
          }}
        />
      );
    }
    if (sel.kind === "activity") {
      const course = modules
        .flatMap((m) => m.courses || [])
        .find((c) => c.activities?.some((a) => a.id === sel.id));
      const act = course?.activities?.find((a) => a.id === sel.id) || null;
      return (
        <ActivityFormPanel key={sel.id} courseId={sel.courseId} activityToEdit={act} onSuccess={onRefresh} />
      );
    }
    if (sel.kind === "assignment-new") {
      const mod = modules.find((m) => m.id === sel.moduleId);
      const courseOptions = (mod?.courses ?? []).map((c) => ({ id: c.id, name: c.name }));
      return (
        <AssignmentFormPanel
          moduleId={sel.moduleId}
          courseOptions={courseOptions}
          assignmentToEdit={null}
          onSuccess={(a) => {
            upsertSessionAssignment(a);
            select({ kind: "assignment", id: a.id, moduleId: sel.moduleId });
          }}
        />
      );
    }
    if (sel.kind === "assignment") {
      const mod = modules.find((m) => m.id === sel.moduleId);
      const courseOptions = (mod?.courses ?? []).map((c) => ({ id: c.id, name: c.name }));
      const fromSession =
        (sessionAssignments[sel.moduleId] ?? []).find((a) => a.id === sel.id) ?? null;
      return (
        <AssignmentDetailLoader
          key={sel.id}
          assignmentId={sel.id}
          moduleId={sel.moduleId}
          courseOptions={courseOptions}
          initial={fromSession}
          onSuccess={upsertSessionAssignment}
        />
      );
    }
    if (sel.kind === "milestone-new") {
      const mod = modules.find((m) => m.id === sel.moduleId);
      const activityOptions = (mod?.courses ?? [])
        .flatMap((c) => c.activities ?? [])
        .map((a) => ({ id: a.id, name: a.name }));
      return (
        <MilestoneFormPanel
          moduleId={sel.moduleId}
          activityOptions={activityOptions}
          milestoneToEdit={null}
          onSuccess={(m) => {
            upsertMilestone(m);
            select({ kind: "milestone", id: m.id, moduleId: sel.moduleId });
          }}
        />
      );
    }
    if (sel.kind === "milestone") {
      const mod = modules.find((m) => m.id === sel.moduleId);
      const activityOptions = (mod?.courses ?? [])
        .flatMap((c) => c.activities ?? [])
        .map((a) => ({ id: a.id, name: a.name }));
      const fromList =
        (milestonesByModule[sel.moduleId] ?? []).find((m) => m.id === sel.id) ?? null;
      return (
        <MilestoneDetailLoader
          key={sel.id}
          milestoneId={sel.id}
          moduleId={sel.moduleId}
          activityOptions={activityOptions}
          initial={fromList}
          onSuccess={upsertMilestone}
        />
      );
    }
    return <EmptyPanel />;
  }, [
    sel,
    program,
    modules,
    onRefresh,
    select,
    sessionAssignments,
    upsertSessionAssignment,
    milestonesByModule,
    upsertMilestone,
  ]);

  const structureTree = (
    <ul className="relative" role="list">
      <StructureTreeRow
        depth={0}
        isLast
        kind="program"
        defaultOpen
        selected={sel?.kind === "program"}
        label={program.name}
        meta={program.code}
        onSelect={() => select({ kind: "program" })}
        onAdd={() => select({ kind: "module-new" })}
        addLabel="Thêm Module"
      >
        {modules.map((mod, mIdx) => {
          const courses = [...(mod.courses || [])];
          const isLastMod = mIdx === modules.length - 1 && sel?.kind !== "module-new";
          const moduleForceOpen =
            (sel?.kind === "module" && sel.id === mod.id) ||
            (sel?.kind === "course" && sel.moduleId === mod.id) ||
            (sel?.kind === "course-new" && sel.moduleId === mod.id) ||
            (sel?.kind === "assignment" && sel.moduleId === mod.id) ||
            (sel?.kind === "assignment-new" && sel.moduleId === mod.id) ||
            (sel?.kind === "milestone" && sel.moduleId === mod.id) ||
            (sel?.kind === "milestone-new" && sel.moduleId === mod.id) ||
            (sel?.kind === "activity" &&
              courses.some((c) => c.id === sel.courseId)) ||
            (sel?.kind === "activity-new" &&
              courses.some((c) => c.id === sel.courseId));
          return (
            <StructureTreeRow
              key={mod.id}
              depth={1}
              isLast={isLastMod}
              kind="module"
              forceOpen={moduleForceOpen}
              selected={sel?.kind === "module" && sel.id === mod.id}
              label={mod.name}
              meta={`${mod.code ? `${mod.code} · ` : ""}${MODULE_TYPE_LABELS[mod.moduleType] || mod.moduleType}`}
              onSelect={() => select({ kind: "module", id: mod.id })}
              onDelete={() => setDelTarget({ type: "module", id: mod.id, name: mod.name })}
              onAdd={() => select({ kind: "course-new", moduleId: mod.id })}
              addLabel="Thêm khóa học"
            >
              {courses.map((course, cIdx) => {
                const acts = [...(course.activities || [])].sort(
                  (a, b) => a.activityOrder - b.activityOrder,
                );
                const isLastCourse =
                  cIdx === courses.length - 1 &&
                  !(sel?.kind === "course-new" && sel.moduleId === mod.id);
                const courseForceOpen =
                  (sel?.kind === "course" && sel.id === course.id) ||
                  (sel?.kind === "activity" && sel.courseId === course.id) ||
                  (sel?.kind === "activity-new" && sel.courseId === course.id);
                return (
                  <StructureTreeRow
                    key={course.id}
                    depth={2}
                    isLast={isLastCourse}
                    kind="course"
                    forceOpen={courseForceOpen}
                    selected={sel?.kind === "course" && sel.id === course.id}
                    label={course.name}
                    meta={course.code ?? undefined}
                    onSelect={() =>
                      select({ kind: "course", id: course.id, moduleId: mod.id })
                    }
                    onDelete={() =>
                      setDelTarget({ type: "course", id: course.id, name: course.name })
                    }
                    onAdd={() => select({ kind: "activity-new", courseId: course.id })}
                    addLabel="Thêm hoạt động"
                  >
                    {acts.map((act, aIdx) => {
                      const typeLabel = ACTIVITY_PREFIX[act.activityType] ?? act.activityType;
                      const schedule =
                        act.activityType !== "SelfPaced"
                          ? formatActivityScheduleRange(act.startTime, act.endTime)
                          : "";
                      const metaBase = schedule ? `${typeLabel} · ${schedule}` : typeLabel;
                      const activityMeta = act.material
                        ? `${metaBase} · Có tài liệu`
                        : metaBase;
                      return (
                        <StructureTreeRow
                          key={act.id}
                          depth={3}
                          isLast={
                            aIdx === acts.length - 1 &&
                            !(sel?.kind === "activity-new" && sel.courseId === course.id)
                          }
                          kind="activity"
                          selected={sel?.kind === "activity" && sel.id === act.id}
                          label={act.name}
                          meta={activityMeta}
                          onSelect={() =>
                            select({ kind: "activity", id: act.id, courseId: course.id })
                          }
                          onDelete={() =>
                            setDelTarget({ type: "activity", id: act.id, name: act.name })
                          }
                        />
                      );
                    })}
                    <li className="relative">
                      <span
                        className="pointer-events-none absolute top-0 left-0 h-4 w-px"
                        style={{ background: W.border }}
                        aria-hidden
                      />
                      <span
                        className="pointer-events-none absolute top-4 left-0 h-px w-3"
                        style={{ background: W.border }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => select({ kind: "activity-new", courseId: course.id })}
                        className="ml-4 flex items-center gap-1.5 py-1.5 text-left text-[11px] font-medium"
                        style={{
                          color:
                            sel?.kind === "activity-new" && sel.courseId === course.id
                              ? "#9c27b0"
                              : W.faint,
                        }}
                      >
                        <ActivityIcon className="size-3" />
                        Thêm hoạt động
                      </button>
                    </li>
                  </StructureTreeRow>
                );
              })}
              {(sel?.kind === "course-new" && sel.moduleId === mod.id) || courses.length === 0 ? (
                <li className="relative">
                  <span
                    className="pointer-events-none absolute top-0 left-0 h-4 w-px"
                    style={{ background: W.border }}
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute top-4 left-0 h-px w-3"
                    style={{ background: W.border }}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => select({ kind: "course-new", moduleId: mod.id })}
                    className="ml-4 py-1.5 text-left text-[11px] font-medium"
                    style={{
                      color:
                        sel?.kind === "course-new" && sel.moduleId === mod.id
                          ? W.accent
                          : W.faint,
                    }}
                  >
                    + Thêm khóa học
                  </button>
                </li>
              ) : null}

              {(sessionAssignments[mod.id] ?? []).map((asg, aIdx, arr) => (
                <StructureTreeRow
                  key={asg.id}
                  depth={2}
                  isLast={
                    aIdx === arr.length - 1 &&
                    !(sel?.kind === "assignment-new" && sel.moduleId === mod.id)
                  }
                  kind="assignment"
                  selected={sel?.kind === "assignment" && sel.id === asg.id}
                  label={asg.title}
                  meta={ASSIGNMENT_TYPE_LABELS[asg.assignmentType] ?? asg.assignmentType}
                  onSelect={() => select({ kind: "assignment", id: asg.id, moduleId: mod.id })}
                  onDelete={() =>
                    setDelTarget({
                      type: "assignment",
                      id: asg.id,
                      name: asg.title,
                      moduleId: mod.id,
                    })
                  }
                />
              ))}
              <li className="relative">
                <span
                  className="pointer-events-none absolute top-0 left-0 h-4 w-px"
                  style={{ background: W.border }}
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute top-4 left-0 h-px w-3"
                  style={{ background: W.border }}
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => select({ kind: "assignment-new", moduleId: mod.id })}
                  className="ml-4 flex items-center gap-1.5 py-1.5 text-left text-[11px] font-medium"
                  style={{
                    color:
                      sel?.kind === "assignment-new" && sel.moduleId === mod.id
                        ? "#f59e0b"
                        : W.faint,
                  }}
                >
                  <ClipboardList className="size-3" />
                  Thêm bài tập
                </button>
              </li>

              {mod.moduleType === "Research" && (
                <>
                  {(milestonesByModule[mod.id] ?? []).map((ms, msIdx, arr) => (
                    <StructureTreeRow
                      key={ms.id}
                      depth={2}
                      isLast={
                        msIdx === arr.length - 1 &&
                        !(sel?.kind === "milestone-new" && sel.moduleId === mod.id)
                      }
                      kind="milestone"
                      selected={sel?.kind === "milestone" && sel.id === ms.id}
                      label={ms.title || ms.code || "Milestone"}
                      meta={ms.isCapstone ? "Capstone" : `Mốc ${ms.milestoneOrder}`}
                      onSelect={() => select({ kind: "milestone", id: ms.id, moduleId: mod.id })}
                      onDelete={() =>
                        setDelTarget({
                          type: "milestone",
                          id: ms.id,
                          name: ms.title || "Milestone",
                          moduleId: mod.id,
                        })
                      }
                    />
                  ))}
                  <li className="relative">
                    <span
                      className="pointer-events-none absolute top-0 left-0 h-4 w-px"
                      style={{ background: W.border }}
                      aria-hidden
                    />
                    <span
                      className="pointer-events-none absolute top-4 left-0 h-px w-3"
                      style={{ background: W.border }}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => select({ kind: "milestone-new", moduleId: mod.id })}
                      className="ml-4 flex items-center gap-1.5 py-1.5 text-left text-[11px] font-medium"
                      style={{
                        color:
                          sel?.kind === "milestone-new" && sel.moduleId === mod.id
                            ? "#8b5cf6"
                            : W.faint,
                      }}
                    >
                      <Flag className="size-3" />
                      Thêm milestone
                    </button>
                  </li>
                </>
              )}
            </StructureTreeRow>
          );
        })}
        <li className="relative">
          {modules.length > 0 && (
            <>
              <span
                className="pointer-events-none absolute top-0 left-0 h-4 w-px"
                style={{ background: W.border }}
                aria-hidden
              />
              <span
                className="pointer-events-none absolute top-4 left-0 h-px w-3"
                style={{ background: W.border }}
                aria-hidden
              />
            </>
          )}
          <button
            type="button"
            onClick={() => select({ kind: "module-new" })}
            className={cn("flex items-center gap-1.5 py-1.5 text-[11px] font-medium", modules.length > 0 && "ml-4")}
            style={{ color: sel?.kind === "module-new" ? W.success : W.faint }}
          >
            <FolderPlus className="size-3" />
            Thêm module
          </button>
        </li>
      </StructureTreeRow>
    </ul>
  );

  return (
    <div
      className="flex overflow-hidden rounded-xl border"
      style={{ background: W.bg, borderColor: W.border, minHeight: "620px" }}
    >
      {/* ── Structure tree ─────────────────────────────────────────── */}
      <div
        className="flex w-[300px] shrink-0 flex-col border-r overflow-hidden"
        style={{ borderColor: W.border, background: W.surface }}
      >
        <div
          className="flex items-center justify-between border-b px-3 py-2.5 shrink-0"
          style={{ borderColor: W.border }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: W.faint }}
          >
            Cấu trúc
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2">{structureTree}</div>
      </div>

      {/* ── Detail ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ background: W.bg }}>
        <div className="shrink-0 border-b" style={{ borderColor: W.border, background: W.surface }}>
          <ParentPathBreadcrumb parts={pathParts} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{detail()}</div>
      </div>

      <ConfirmDialog
        isOpen={!!delTarget}
        onOpenChange={(open) => {
          if (!open) setDelTarget(null);
        }}
        onConfirm={handleDel}
        title={`Xác nhận xóa ${delTarget?.type === "module" ? "Module" : delTarget?.type === "course" ? "Khóa học" : delTarget?.type === "activity" ? "Hoạt động" : delTarget?.type === "assignment" ? "Bài tập" : "Milestone"}`}
        description={`Bạn có chắc muốn xóa "${delTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa bỏ"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </div>
  );
}

