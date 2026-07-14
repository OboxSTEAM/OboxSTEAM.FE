"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronRight,
  Plus,
  Trash,
  BookOpen,
  FolderOpen,
  Activity as ActivityIcon,
  LayoutGrid,
  Check,
  Save,
  Circle,
  FolderPlus,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ProgramForm } from "@/components/manager/programs/program-form";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { MaterialUploadDialog } from "./curriculum-dialogs";
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
  updateProgram,
  type ProgramWithModules,
  type Module,
  type Course,
  type Activity as ActivityType,
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

/* ─── DateTime helpers ──────────────────────────────────────────────────────── */
function toApi(val: string | null | undefined): string | null {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
}
function fromApi(val: string | null | undefined): string {
  if (!val) return "";
  const [date, time] = val.split(" ");
  if (!date || !time) return "";
  const [day, mon, yr] = date.split("/");
  const [hh, mm] = time.split(":");
  if (!yr || !mm) return "";
  return `${yr}-${mon}-${day}T${hh}:${mm}`;
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

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<MFV>({
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
      const outcomes = data.learningOutcomesText
        ? data.learningOutcomesText.split("\n").map((s: string) => s.trim()).filter(Boolean) : [];
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
    } catch (err) { showAppErrorFromUnknown(err, "programs.detail"); }
    finally { setBusy(false); }
  };

  const others = modulesInProgram.filter((m) => !isEdit || m.id !== moduleToEdit?.id);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <PHdr icon={BookOpen} color={W.success}
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
                  <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg")} style={{ borderColor: W.border }}><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg")} style={{ borderColor: W.border }}><SelectValue placeholder="Không có" /></SelectTrigger>
                  <SelectContent className={LIGHT_SELECT_CONTENT}>
                    <SelectItem value="none" className={LIGHT_SELECT_ITEM}>Không có</SelectItem>
                    {others.map((m) => <SelectItem key={m.id} value={m.id} className={LIGHT_SELECT_ITEM}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Controller name="isMandatory" control={control} render={({ field }) => (
                <Checkbox id="mand" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
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
    } catch (err) { showAppErrorFromUnknown(err, "programs.detail"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <PHdr icon={FolderOpen} color={W.accent} title={isEdit ? `Chỉnh sửa: ${courseToEdit!.name}` : "Tạo Khóa học mới"} sub="Khóa học trong học phần" />
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

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? updateActivitySchema : createActivitySchema),
    values: activityToEdit ? {
      code: activityToEdit.code || "", courseId: activityToEdit.courseId, name: activityToEdit.name,
      activityType: activityToEdit.activityType, description: activityToEdit.description || "",
      activityOrder: activityToEdit.activityOrder, location: activityToEdit.location || "",
      startTime: fromApi(activityToEdit.startTime), endTime: fromApi(activityToEdit.endTime),
      maxCapacity: activityToEdit.maxCapacity,
      requireQrCheckin: activityToEdit.requireQrCheckin, requireMediaEvidence: activityToEdit.requireMediaEvidence,
    } : {
      code: "", courseId, name: "", activityType: "SelfPaced" as const, description: "", activityOrder: 1,
      location: "", startTime: "", endTime: "", maxCapacity: null as number | null,
      requireQrCheckin: false, requireMediaEvidence: false,
    },
  });

  const actType = watch("activityType");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setBusy(true);
    try {
      const live = data.activityType !== "SelfPaced";
      const payload = {
        code: data.code || null, courseId: data.courseId, name: data.name, activityType: data.activityType,
        description: data.description || "", activityOrder: Number(data.activityOrder),
        location: live ? data.location || null : null, startTime: live ? toApi(data.startTime) : null,
        endTime: live ? toApi(data.endTime) : null, maxCapacity: live && data.maxCapacity ? Number(data.maxCapacity) : null,
        requireQrCheckin: data.requireQrCheckin, requireMediaEvidence: data.requireMediaEvidence,
      };
      if (isEdit && activityToEdit) {
        await updateActivity(activityToEdit.id, payload);
        showAppSuccess({ title: "Cập nhật thành công", description: `Hoạt động ${data.name} đã được cập nhật.` });
      } else {
        await createActivity(payload);
        showAppSuccess({ title: "Tạo thành công", description: `Đã tạo hoạt động ${data.name}.` });
      }
      flash(); onSuccess();
    } catch (err) { showAppErrorFromUnknown(err, "programs.detail"); }
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
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg")} style={{ borderColor: W.border }}><SelectValue /></SelectTrigger>
                <SelectContent className={LIGHT_SELECT_CONTENT}>
                  <SelectItem value="SelfPaced" className={LIGHT_SELECT_ITEM}>Tự học (Self-Paced)</SelectItem>
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
                <Checkbox id="qr" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              )} />
              <Label htmlFor="qr" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>Yêu cầu Check-in QR</Label>
            </div>
            <div className="flex items-center gap-2">
              <Controller name="requireMediaEvidence" control={control} render={({ field }) => (
                <Checkbox id="med" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              )} />
              <Label htmlFor="med" className="text-sm font-semibold cursor-pointer" style={{ color: W.textStrong }}>Yêu cầu minh chứng</Label>
            </div>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mô tả hoạt động</Label>
            <textarea rows={3} placeholder="Nhập hướng dẫn chi tiết..." {...register("description")} className="w-full text-sm p-3 rounded-lg border outline-none resize-none bg-white focus:ring-1 focus:ring-[#4FC3F7]/50" style={{ borderColor: W.border }} />
          </div>
        </div>
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
    } catch (err) { showAppErrorFromUnknown(err, "programs.detail"); }
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
   TREE ITEM
══════════════════════════════════════════════════════════════════════════════ */
function TreeItem({ isSelected, depth, hasChildren, isExpanded, onToggleExpand, onSelect, onDelete, icon: Icon, iconColor, label, badge, onAdd, addLabel }: {
  isSelected: boolean; depth: number; hasChildren?: boolean; isExpanded?: boolean;
  onToggleExpand?: () => void; onSelect: () => void; onDelete?: () => void;
  icon: React.ElementType; iconColor: string; label: string; badge?: string;
  onAdd?: () => void; addLabel?: string;
}) {
  return (
    <div
      className="group/ti flex items-center gap-0.5 rounded-lg"
      style={{
        paddingLeft: `${depth * 14 + 6}px`, paddingRight: "4px",
        background: isSelected ? "rgba(79,195,247,0.13)" : "transparent",
        border: isSelected ? "1px solid rgba(79,195,247,0.28)" : "1px solid transparent",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = W.surface2; }}
      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {hasChildren !== undefined ? (
        <button type="button" onClick={onToggleExpand} className="flex size-5 shrink-0 items-center justify-center rounded" style={{ color: W.faint }}>
          <ChevronRight className={cn("size-3 transition-transform duration-200", isExpanded && "rotate-90")} />
        </button>
      ) : <span className="size-5 shrink-0" />}

      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-1.5 py-2 text-left">
        <Icon className="size-3.5 shrink-0" style={{ color: iconColor }} />
        <span className="truncate text-[12.5px] leading-snug" style={{ color: isSelected ? "#0d6e9c" : W.text, fontWeight: isSelected ? 600 : 400 }}>
          {label}
        </span>
        {badge && (
          <span className="ml-auto shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold" style={{ background: "rgba(0,0,0,0.07)", color: W.muted }}>
            {badge}
          </span>
        )}
      </button>

      <div className="flex items-center gap-px opacity-0 group-hover/ti:opacity-100 transition-opacity shrink-0">
        {onAdd && (
          <button type="button" title={addLabel || "Thêm"} onClick={onAdd}
            className="flex size-6 items-center justify-center rounded transition-colors" style={{ color: W.faint }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = W.success; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = W.faint; }}>
            <Plus className="size-3" />
          </button>
        )}
        {onDelete && (
          <button type="button" title="Xóa" onClick={onDelete}
            className="flex size-6 items-center justify-center rounded transition-colors" style={{ color: W.faint }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = W.primary; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = W.faint; }}>
            <Trash className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN: CurriculumSplitPanel
══════════════════════════════════════════════════════════════════════════════ */
type CurriculumSplitPanelProps = { program: ProgramWithModules; onRefresh: () => void };

export function CurriculumSplitPanel({ program, onRefresh }: CurriculumSplitPanelProps) {
  const modules = [...(program.modules || [])].sort((a, b) => a.moduleOrder - b.moduleOrder);

  const [sel, setSel] = useState<SelectedNode>({ kind: "program" });
  const [openMods, setOpenMods] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(modules.map((m) => [m.id, true])));
  const [openCrs, setOpenCrs] = useState<Record<string, boolean>>({});
  const [delTarget, setDelTarget] = useState<{ type: "module" | "course" | "activity"; id: string; name: string } | null>(null);
  const [matDlg, setMatDlg] = useState<{ open: boolean; activityId: string; material: unknown }>({ open: false, activityId: "", material: null });

  const togMod = (id: string) => setOpenMods((p) => ({ ...p, [id]: !(p[id] ?? true) }));
  const togCrs = (id: string) => setOpenCrs((p) => ({ ...p, [id]: !(p[id] ?? false) }));

  const handleDel = async () => {
    if (!delTarget) return;
    try {
      if (delTarget.type === "module") { await deleteModule(delTarget.id); showAppSuccess({ title: "Đã xóa", description: `Module: ${delTarget.name}` }); }
      else if (delTarget.type === "course") { await deleteCourse(delTarget.id); showAppSuccess({ title: "Đã xóa", description: `Khóa học: ${delTarget.name}` }); }
      else { await deleteActivity(delTarget.id); showAppSuccess({ title: "Đã xóa", description: `Hoạt động: ${delTarget.name}` }); }
      setSel({ kind: "program" }); onRefresh();
    } catch (err) { showAppErrorFromUnknown(err, "programs.detail"); }
    finally { setDelTarget(null); }
  };

  const detail = useCallback((): React.ReactNode => {
    if (!sel) return <EmptyPanel />;
    if (sel.kind === "program") return <ProgramInfoPanel program={program} onSuccess={onRefresh} />;
    if (sel.kind === "module-new") return <ModuleFormPanel programId={program.id} moduleToEdit={null} modulesInProgram={modules} onSuccess={() => { onRefresh(); setSel({ kind: "program" }); }} />;
    if (sel.kind === "module") {
      const mod = modules.find((m) => m.id === sel.id) || null;
      return <ModuleFormPanel programId={program.id} moduleToEdit={mod} modulesInProgram={modules} onSuccess={onRefresh} />;
    }
    if (sel.kind === "course-new") return <CourseFormPanel moduleId={sel.moduleId} courseToEdit={null} onSuccess={() => { onRefresh(); setSel({ kind: "module", id: sel.moduleId }); }} />;
    if (sel.kind === "course") {
      const mod = modules.find((m) => m.courses?.some((c) => c.id === sel.id));
      const course = mod?.courses?.find((c) => c.id === sel.id) || null;
      return <CourseFormPanel moduleId={sel.moduleId} courseToEdit={course} onSuccess={onRefresh} />;
    }
    if (sel.kind === "activity-new") return <ActivityFormPanel courseId={sel.courseId} activityToEdit={null} onSuccess={onRefresh} />;
    if (sel.kind === "activity") {
      const course = modules.flatMap((m) => m.courses || []).find((c) => c.activities?.some((a) => a.id === sel.id));
      const act = course?.activities?.find((a) => a.id === sel.id) || null;
      return <ActivityFormPanel courseId={sel.courseId} activityToEdit={act} onSuccess={onRefresh} />;
    }
    return <EmptyPanel />;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, program, modules]);

  return (
    <div className="flex rounded-xl border overflow-hidden" style={{ background: W.bg, borderColor: W.border, minHeight: "620px" }}>

      {/* Left tree */}
      <div className="flex flex-col border-r overflow-hidden shrink-0" style={{ width: 272, borderColor: W.border, background: W.surface }}>
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: W.border }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: W.faint }}>Cấu trúc</span>
          <button type="button" title="Thêm Module"
            onClick={() => setSel({ kind: "module-new" })}
            className="flex size-6 items-center justify-center rounded transition-colors" style={{ color: W.faint }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = W.success; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = W.faint; }}>
            <FolderPlus className="size-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1.5 px-1 space-y-px">
          <TreeItem isSelected={sel?.kind === "program"} depth={0} icon={LayoutGrid} iconColor={W.primary}
            label={program.name} badge={`${modules.length}`} onSelect={() => setSel({ kind: "program" })} />

          {modules.map((mod) => {
            const courses = [...(mod.courses || [])];
            const mOpen = openMods[mod.id] ?? true;
            return (
              <div key={mod.id}>
                <TreeItem
                  isSelected={sel?.kind === "module" && sel.id === mod.id}
                  depth={1} hasChildren isExpanded={mOpen} onToggleExpand={() => togMod(mod.id)}
                  icon={BookOpen} iconColor={W.success}
                  label={mod.name} badge={MODULE_TYPE_LABELS[mod.moduleType] || mod.moduleType}
                  onSelect={() => setSel({ kind: "module", id: mod.id })}
                  onAdd={() => setSel({ kind: "course-new", moduleId: mod.id })} addLabel="Thêm Khóa học"
                  onDelete={() => setDelTarget({ type: "module", id: mod.id, name: mod.name })}
                />

                {mOpen && courses.map((course) => {
                  const acts = [...(course.activities || [])].sort((a, b) => a.activityOrder - b.activityOrder);
                  const cOpen = openCrs[course.id] ?? false;
                  return (
                    <div key={course.id}>
                      <TreeItem
                        isSelected={sel?.kind === "course" && sel.id === course.id}
                        depth={2} hasChildren isExpanded={cOpen} onToggleExpand={() => togCrs(course.id)}
                        icon={FolderOpen} iconColor={W.accent}
                        label={course.name} badge={`${acts.length}`}
                        onSelect={() => setSel({ kind: "course", id: course.id, moduleId: mod.id })}
                        onAdd={() => setSel({ kind: "activity-new", courseId: course.id })} addLabel="Thêm Hoạt động"
                        onDelete={() => setDelTarget({ type: "course", id: course.id, name: course.name })}
                      />
                      {cOpen && acts.map((act) => (
                        <TreeItem key={act.id}
                          isSelected={sel?.kind === "activity" && sel.id === act.id}
                          depth={3} icon={Circle} iconColor={W.faint}
                          label={`${ACTIVITY_PREFIX[act.activityType] ?? act.activityType}: ${act.name}`}
                          onSelect={() => setSel({ kind: "activity", id: act.id, courseId: course.id })}
                          onDelete={() => setDelTarget({ type: "activity", id: act.id, name: act.name })}
                        />
                      ))}
                      {cOpen && (
                        <button type="button" onClick={() => setSel({ kind: "activity-new", courseId: course.id })}
                          className="flex w-full items-center gap-1.5 rounded-lg py-1 text-[11px] transition-colors"
                          style={{ paddingLeft: `${3 * 14 + 6 + 20}px`, color: W.faint }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = W.accent; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = W.faint; }}>
                          <PlusCircle className="size-3" /> Thêm hoạt động
                        </button>
                      )}
                    </div>
                  );
                })}

                {mOpen && (
                  <button type="button" onClick={() => setSel({ kind: "course-new", moduleId: mod.id })}
                    className="flex w-full items-center gap-1.5 rounded-lg py-1 text-[11px] transition-colors"
                    style={{ paddingLeft: `${2 * 14 + 6 + 20}px`, color: W.faint }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = W.accent; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = W.faint; }}>
                    <Plus className="size-3" /> Thêm khóa học
                  </button>
                )}
              </div>
            );
          })}

          <button type="button" onClick={() => setSel({ kind: "module-new" })}
            className="flex w-full items-center gap-1.5 rounded-lg py-1 text-[11px] transition-colors"
            style={{ paddingLeft: `${1 * 14 + 6 + 20}px`, color: W.faint }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = W.success; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = W.faint; }}>
            <FolderPlus className="size-3" /> Thêm học phần
          </button>
        </div>
      </div>

      {/* Right detail */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: W.bg }}>
        {detail()}
      </div>

      {/* Dialogs */}
      <MaterialUploadDialog
        isOpen={matDlg.open}
        onOpenChange={(open) => setMatDlg({ open, activityId: "", material: null })}
        activityId={matDlg.activityId}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existingMaterial={matDlg.material as any}
        onSuccess={onRefresh}
      />
      <ConfirmDialog
        isOpen={!!delTarget}
        onOpenChange={(open) => { if (!open) setDelTarget(null); }}
        onConfirm={handleDel}
        title={`Xác nhận xóa ${delTarget?.type === "module" ? "Module" : delTarget?.type === "course" ? "Khóa học" : "Hoạt động"}`}
        description={`Bạn có chắc muốn xóa "${delTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa bỏ" cancelLabel="Hủy" variant="destructive"
      />
    </div>
  );
}

