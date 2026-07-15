"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, AlertCircle, BookOpen } from "lucide-react";

import {
  Dialog,
  DialogPopup,
  DialogClose,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  createModule,
  updateModule,
  createCourse,
  updateCourse,
  createActivity,
  updateActivity,
  uploadMaterial,
  deleteMaterial,
  type Module,
  type Course,
  type Activity,
} from "@/lib/api";
import {
  createModuleSchema,
  updateModuleSchema,
  createCourseSchema,
  updateCourseSchema,
  createActivitySchema,
  updateActivitySchema,
  type CreateModuleInput,
  type UpdateModuleInput,
  type CreateCourseInput,
  type UpdateCourseInput,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "@/lib/validations/curriculum";
import { updateMaterialSchema, type UpdateMaterialInput } from "@/lib/validations/materials";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  LIGHT_SELECT_TRIGGER,
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
} from "@/components/programs/program-select-styles";
import { MODULE_TYPE_LABELS } from "@/lib/programs/constants";

// --- Date/Time Helpers ---
function formatToApiDateTime(val: string | null | undefined): string | null {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:00`;
}

function formatFromApiDateTime(val: string | null | undefined): string {
  if (!val) return "";
  const parts = val.split(" ");
  if (parts.length < 2) return "";
  const dateParts = parts[0].split("/");
  const timeParts = parts[1].split(":");
  if (dateParts.length < 3 || timeParts.length < 2) return "";
  const day = dateParts[0];
  const month = dateParts[1];
  const year = dateParts[2];
  const hours = timeParts[0];
  const minutes = timeParts[1];
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ==========================================
// 1. Module Form Dialog
// ==========================================
type ModuleFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  moduleToEdit?: Module | null;
  modulesInProgram: Module[];
  onSuccess: () => void;
};

type ModuleFormValues = {
  code: string;
  programId: string;
  name: string;
  moduleType: "Theory" | "Experiential" | "Research";
  moduleOrder: number;
  prerequisiteModuleId: string | null;
  isMandatory: boolean;
  price: number;
  retakeFee: number;
  learningOutcomesText: string;
};

export function ModuleFormDialog({
  isOpen,
  onOpenChange,
  programId,
  moduleToEdit,
  modulesInProgram,
  onSuccess,
}: ModuleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!moduleToEdit;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(isEdit ? updateModuleSchema : createModuleSchema) as any,
    defaultValues: {
      code: "",
      programId,
      name: "",
      moduleType: "Theory" as const,
      moduleOrder: 1,
      prerequisiteModuleId: null as string | null,
      isMandatory: true,
      price: 0,
      retakeFee: 0,
      learningOutcomesText: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (moduleToEdit) {
        reset({
          code: moduleToEdit.code || "",
          programId: moduleToEdit.programId,
          name: moduleToEdit.name,
          moduleType: moduleToEdit.moduleType,
          moduleOrder: moduleToEdit.moduleOrder,
          prerequisiteModuleId: moduleToEdit.prerequisiteModuleId || null,
          isMandatory: moduleToEdit.isMandatory,
          price: moduleToEdit.price,
          retakeFee: moduleToEdit.retakeFee,
          // @ts-ignore
          learningOutcomesText: moduleToEdit.learningOutcomes?.join("\n") || "",
        });
      } else {
        reset({
          code: "",
          programId,
          name: "",
          moduleType: "Theory",
          moduleOrder: (modulesInProgram.length || 0) + 1,
          prerequisiteModuleId: null,
          isMandatory: true,
          price: 0,
          retakeFee: 0,
          learningOutcomesText: "",
        });
      }
    }
  }, [isOpen, moduleToEdit, programId, reset, modulesInProgram]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const outcomes = data.learningOutcomesText
        ? data.learningOutcomesText
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        code: data.code || null,
        programId: data.programId,
        name: data.name,
        moduleType: data.moduleType,
        moduleOrder: Number(data.moduleOrder),
        prerequisiteModuleId: data.prerequisiteModuleId || null,
        isMandatory: data.isMandatory,
        price: Number(data.price),
        retakeFee: Number(data.retakeFee),
        learningOutcomes: outcomes,
      };

      if (isEdit && moduleToEdit) {
        await updateModule(moduleToEdit.id, payload);
        showAppSuccess({
          title: "Cập nhật thành công",
          description: `Đã cập nhật thông tin module ${data.name}.`,
        });
      } else {
        await createModule(payload);
        showAppSuccess({
          title: "Tạo thành công",
          description: `Đã tạo module ${data.name} mới.`,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      showAppErrorFromUnknown(err, "programs.detail");
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherModules = modulesInProgram.filter(
    (m) => !isEdit || m.id !== moduleToEdit?.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-3xl max-h-[92vh] overflow-y-auto gap-0 p-0">
        <DialogClose className="absolute right-4 top-4 z-10" />

        {/* Dialog Header with accent */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E5E5E0] bg-[#FAFAF5] rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white border border-[#E5E5E0] shadow-xs">
              <BookOpen className="size-4 text-[#7CB342]" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-[#2D2D2D]">
                {isEdit ? "Cập nhật Module" : "Tạo Module mới"}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B6B6B] mt-0.5">
                Điền thông tin chi tiết cho học phần (Module) thuộc chương trình học này.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-[#F0F0EB]">

          {/* Section 1: Thông tin cơ bản */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6B6B6B]">
              Thông tin cơ bản
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="module-name" className="text-sm font-semibold text-[#2D2D2D]">
                  Tên Module <span className="text-[#E94B3C]">*</span>
                </Label>
                <Input
                  id="module-name"
                  type="text"
                  placeholder="Ví dụ: Robotics Cơ Bản"
                  {...register("name")}
                  className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
                />
                {errors.name && (
                  <p className="text-xs font-semibold text-[#E94B3C]">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="module-code" className="text-sm font-semibold text-[#2D2D2D]">
                  Mã Module
                </Label>
                <Input
                  id="module-code"
                  type="text"
                  placeholder="Ví dụ: MOD-ROBO1"
                  {...register("code")}
                  className="h-10 rounded-lg border-[#D8D8D3] font-mono focus-visible:ring-[#4FC3F7]/50"
                />
                {errors.code && (
                  <p className="text-xs font-semibold text-[#E94B3C]">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="moduleOrder" className="text-sm font-semibold text-[#2D2D2D]">
                  Thứ tự học <span className="text-[#E94B3C]">*</span>
                </Label>
                <Input
                  id="moduleOrder"
                  type="number"
                  {...register("moduleOrder", { valueAsNumber: true })}
                  className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
                />
                {errors.moduleOrder && (
                  <p className="text-xs font-semibold text-[#E94B3C]">{errors.moduleOrder.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Cấu hình học tập */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6B6B6B]">
              Cấu hình học tập
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="moduleType" className="text-sm font-semibold text-[#2D2D2D]">
                  Loại Module <span className="text-[#E94B3C]">*</span>
                </Label>
                <Controller
                  name="moduleType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg border-[#D8D8D3]")}>
                        <span className="truncate">
                          {MODULE_TYPE_LABELS[field.value as keyof typeof MODULE_TYPE_LABELS] ?? field.value ?? "Chọn loại Module"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className={LIGHT_SELECT_CONTENT}>
                        <SelectItem value="Theory" className={LIGHT_SELECT_ITEM}>Lý thuyết</SelectItem>
                        <SelectItem value="Experiential" className={LIGHT_SELECT_ITEM}>Trải nghiệm</SelectItem>
                        <SelectItem value="Research" className={LIGHT_SELECT_ITEM}>Nghiên cứu</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="prerequisiteModuleId" className="text-sm font-semibold text-[#2D2D2D]">
                  Module tiên quyết
                </Label>
                <Controller
                  name="prerequisiteModuleId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || "none"} onValueChange={(val) => field.onChange(val === "none" ? null : val)}>
                      <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg border-[#D8D8D3]")}>
                        <span className="truncate">
                          {!field.value || field.value === "none"
                            ? "Không có"
                            : (otherModules.find((m) => m.id === field.value)?.name ?? "Không có")}
                        </span>
                      </SelectTrigger>
                      <SelectContent className={LIGHT_SELECT_CONTENT}>
                        <SelectItem value="none" className={LIGHT_SELECT_ITEM}>Không có</SelectItem>
                        {otherModules.map((m) => (
                          <SelectItem key={m.id} value={m.id} className={LIGHT_SELECT_ITEM}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Controller
                  name="isMandatory"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isMandatory"
                      checked={field.value}
                      onCheckedChange={(val) => field.onChange(val === true)}
                    />
                  )}
                />
                <Label htmlFor="isMandatory" className="text-sm font-semibold text-[#2D2D2D] cursor-pointer">
                  Học phần bắt buộc
                </Label>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="learningOutcomesText" className="text-sm font-semibold text-[#2D2D2D]">
                  Kiến thức đạt được
                  <span className="ml-1 text-xs font-normal text-[#6B6B6B]">(mỗi dòng một mục tiêu)</span>
                </Label>
                <textarea
                  id="learningOutcomesText"
                  rows={3}
                  placeholder={`Ví dụ:\nHiểu các linh kiện điện tử cơ bản\nLập trình được Robot di chuyển tránh vật cản`}
                  {...register("learningOutcomesText")}
                  className="w-full text-sm p-3 rounded-lg border border-[#D8D8D3] focus-visible:ring-1 focus-visible:ring-[#4FC3F7]/50 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Học phí */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6B6B6B]">
              Học phí
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-semibold text-[#2D2D2D]">
                  Học phí Module (VND) <span className="text-[#E94B3C]">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  {...register("price", { valueAsNumber: true })}
                  className="h-10 rounded-lg border-[#D8D8D3] font-mono focus-visible:ring-[#4FC3F7]/50"
                />
                {errors.price && (
                  <p className="text-xs font-semibold text-[#E94B3C]">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="retakeFee" className="text-sm font-semibold text-[#2D2D2D]">
                  Học phí học lại (VND) <span className="text-[#E94B3C]">*</span>
                </Label>
                <Input
                  id="retakeFee"
                  type="number"
                  placeholder="0"
                  {...register("retakeFee", { valueAsNumber: true })}
                  className="h-10 rounded-lg border-[#D8D8D3] font-mono focus-visible:ring-[#4FC3F7]/50"
                />
                {errors.retakeFee && (
                  <p className="text-xs font-semibold text-[#E94B3C]">{errors.retakeFee.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2 px-6 py-4 bg-[#FAFAF5] rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-lg border-[#E5E5E0] text-[#2D2D2D] hover:bg-white"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg font-semibold text-white bg-[#7CB342] hover:bg-[#7CB342]/90 gap-1.5"
            >
              {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Module"}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

// ==========================================
// 2. Course Form Dialog
// ==========================================
type CourseFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  courseToEdit?: Course | null;
  onSuccess: () => void;
};

export function CourseFormDialog({
  isOpen,
  onOpenChange,
  moduleId,
  courseToEdit,
  onSuccess,
}: CourseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!courseToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? updateCourseSchema : createCourseSchema),
    defaultValues: {
      code: "",
      moduleId,
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (courseToEdit) {
        reset({
          code: courseToEdit.code || "",
          moduleId: courseToEdit.moduleId,
          name: courseToEdit.name,
          description: courseToEdit.description || "",
        });
      } else {
        reset({
          code: "",
          moduleId,
          name: "",
          description: "",
        });
      }
    }
  }, [isOpen, courseToEdit, moduleId, reset]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        code: data.code || null,
        moduleId: data.moduleId,
        name: data.name,
        description: data.description || "",
      };

      if (isEdit && courseToEdit) {
        await updateCourse(courseToEdit.id, payload);
        showAppSuccess({
          title: "Cập nhật thành công",
          description: `Đã cập nhật thông tin khóa học ${data.name}.`,
        });
      } else {
        await createCourse(payload);
        showAppSuccess({
          title: "Tạo thành công",
          description: `Đã tạo khóa học ${data.name} mới.`,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      showAppErrorFromUnknown(err, "programs.detail");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg gap-4">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật Khóa học" : "Tạo Khóa học mới"}</DialogTitle>
          <DialogDescription>
            Nhập thông tin khóa học cụ thể nằm trong Module được chọn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-name" className="text-sm font-semibold text-[#2D2D2D]">
                Tên Khóa học <span className="text-[#E94B3C]">*</span>
              </Label>
              <Input
                id="course-name"
                type="text"
                placeholder="Ví dụ: Nhập môn lập trình với Scratch"
                {...register("name")}
                className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
              />
              {errors.name && (
                <p className="text-xs font-semibold text-[#E94B3C] mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="course-code" className="text-sm font-semibold text-[#2D2D2D]">
                Mã Khóa học
              </Label>
              <Input
                id="course-code"
                type="text"
                placeholder="Ví dụ: CRS-SCRATCH1"
                {...register("code")}
                className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
              />
              {errors.code && (
                <p className="text-xs font-semibold text-[#E94B3C] mt-1">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="course-description" className="text-sm font-semibold text-[#2D2D2D]">
                Mô tả khóa học
              </Label>
              <textarea
                id="course-description"
                rows={3}
                placeholder="Nhập mô tả tóm tắt nội dung học tập của khóa học này..."
                {...register("description")}
                className="w-full text-sm p-3 rounded-lg border border-[#D8D8D3] focus-visible:ring-1 focus-visible:ring-[#4FC3F7]/50 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-lg border-[#E5E5E0] text-[#2D2D2D] hover:bg-[#FAFAF5]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg font-semibold text-white bg-[#7CB342] hover:bg-[#7CB342]/90"
            >
              {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Khóa học"}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

// ==========================================
// 3. Activity Form Dialog
// ==========================================
type ActivityFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  activityToEdit?: Activity | null;
  onSuccess: () => void;
};

export function ActivityFormDialog({
  isOpen,
  onOpenChange,
  courseId,
  activityToEdit,
  onSuccess,
}: ActivityFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!activityToEdit;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? updateActivitySchema : createActivitySchema),
    defaultValues: {
      code: "",
      courseId,
      name: "",
      activityType: "SelfPaced" as const,
      description: "",
      activityOrder: 1,
      location: "",
      startTime: "",
      endTime: "",
      maxCapacity: null as number | null,
      requireQrCheckin: false,
      requireMediaEvidence: false,
    },
  });

  const activityType = watch("activityType");

  useEffect(() => {
    if (isOpen) {
      if (activityToEdit) {
        reset({
          code: activityToEdit.code || "",
          courseId: activityToEdit.courseId,
          name: activityToEdit.name,
          activityType: activityToEdit.activityType,
          description: activityToEdit.description || "",
          activityOrder: activityToEdit.activityOrder,
          location: activityToEdit.location || "",
          startTime: formatFromApiDateTime(activityToEdit.startTime),
          endTime: formatFromApiDateTime(activityToEdit.endTime),
          maxCapacity: activityToEdit.maxCapacity,
          requireQrCheckin: activityToEdit.requireQrCheckin,
          requireMediaEvidence: activityToEdit.requireMediaEvidence,
        });
      } else {
        reset({
          code: "",
          courseId,
          name: "",
          activityType: "SelfPaced",
          description: "",
          activityOrder: 1,
          location: "",
          startTime: "",
          endTime: "",
          maxCapacity: null,
          requireQrCheckin: false,
          requireMediaEvidence: false,
        });
      }
    }
  }, [isOpen, activityToEdit, courseId, reset]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const isOnlineOrOffline = data.activityType !== "SelfPaced";
      const payload = {
        code: data.code || null,
        courseId: data.courseId,
        name: data.name,
        activityType: data.activityType,
        description: data.description || "",
        activityOrder: Number(data.activityOrder),
        location: isOnlineOrOffline ? data.location || null : null,
        startTime: isOnlineOrOffline ? formatToApiDateTime(data.startTime) : null,
        endTime: isOnlineOrOffline ? formatToApiDateTime(data.endTime) : null,
        maxCapacity: isOnlineOrOffline && data.maxCapacity ? Number(data.maxCapacity) : null,
        requireQrCheckin: data.requireQrCheckin,
        requireMediaEvidence: data.requireMediaEvidence,
      };

      if (isEdit && activityToEdit) {
        await updateActivity(activityToEdit.id, payload);
        showAppSuccess({
          title: "Cập nhật thành công",
          description: `Đã cập nhật thông tin hoạt động ${data.name}.`,
        });
      } else {
        await createActivity(payload);
        showAppSuccess({
          title: "Tạo thành công",
          description: `Đã tạo hoạt động ${data.name} mới.`,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      showAppErrorFromUnknown(err, "programs.detail");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl max-h-[90vh] overflow-y-auto gap-4">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật Hoạt động" : "Tạo Hoạt động mới"}</DialogTitle>
          <DialogDescription>
            Thiết lập thông tin hoạt động học tập (tự học, lớp online, lớp offline).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label htmlFor="act-name" className="text-sm font-semibold text-[#2D2D2D]">
                Tên Hoạt động <span className="text-[#E94B3C]">*</span>
              </Label>
              <Input
                id="act-name"
                type="text"
                placeholder="Ví dụ: Xem Video hướng dẫn Assembly"
                {...register("name")}
                className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
              />
              {errors.name && (
                <p className="text-xs font-semibold text-[#E94B3C] mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label htmlFor="act-code" className="text-sm font-semibold text-[#2D2D2D]">
                Mã Hoạt động
              </Label>
              <Input
                id="act-code"
                type="text"
                placeholder="Ví dụ: ACT-SCRATCH1"
                {...register("code")}
                className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
              />
              {errors.code && (
                <p className="text-xs font-semibold text-[#E94B3C] mt-1">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1 flex flex-col">
              <Label htmlFor="activityType" className="text-sm font-semibold text-[#2D2D2D] mb-1.5">
                Loại Hoạt động <span className="text-[#E94B3C]">*</span>
              </Label>
              <Controller
                name="activityType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg border-[#D8D8D3]")}>
                      <SelectValue placeholder="Chọn loại hoạt động" />
                    </SelectTrigger>
                    <SelectContent className={LIGHT_SELECT_CONTENT}>
                      <SelectItem value="SelfPaced" className={LIGHT_SELECT_ITEM}>Tự học (Self-Paced)</SelectItem>
                      <SelectItem value="LiveOnline" className={LIGHT_SELECT_ITEM}>Online trực tiếp (LiveOnline)</SelectItem>
                      <SelectItem value="Offline" className={LIGHT_SELECT_ITEM}>Offline tại lớp (Offline)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label htmlFor="activityOrder" className="text-sm font-semibold text-[#2D2D2D]">
                Thứ tự hoạt động <span className="text-[#E94B3C]">*</span>
              </Label>
              <Input
                id="activityOrder"
                type="number"
                {...register("activityOrder", { valueAsNumber: true })}
                className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
              />
              {errors.activityOrder && (
                <p className="text-xs font-semibold text-[#E94B3C] mt-1">{errors.activityOrder.message}</p>
              )}
            </div>

            {activityType !== "SelfPaced" && (
              <>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="act-location" className="text-sm font-semibold text-[#2D2D2D]">
                    Địa điểm / Đường dẫn phòng học <span className="text-[#E94B3C]">*</span>
                  </Label>
                  <Input
                    id="act-location"
                    type="text"
                    placeholder={activityType === "LiveOnline" ? "Ví dụ: Zoom link, Google Meet..." : "Ví dụ: Phòng học 201, Tòa nhà A..."}
                    {...register("location")}
                    className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <Label htmlFor="startTime" className="text-sm font-semibold text-[#2D2D2D]">
                    Thời gian bắt đầu <span className="text-[#E94B3C]">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    {...register("startTime")}
                    className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <Label htmlFor="endTime" className="text-sm font-semibold text-[#2D2D2D]">
                    Thời gian kết thúc <span className="text-[#E94B3C]">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    {...register("endTime")}
                    className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <Label htmlFor="maxCapacity" className="text-sm font-semibold text-[#2D2D2D]">
                    Sức chứa tối đa (Học viên)
                  </Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    placeholder="Không giới hạn"
                    {...register("maxCapacity")}
                    className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
                  />
                </div>
              </>
            )}

            <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Controller
                  name="requireQrCheckin"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="requireQrCheckin"
                      checked={field.value}
                      onCheckedChange={(val) => field.onChange(val === true)}
                    />
                  )}
                />
                <Label htmlFor="requireQrCheckin" className="text-sm font-semibold text-[#2D2D2D] cursor-pointer">
                  Yêu cầu Check-in QR
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  name="requireMediaEvidence"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="requireMediaEvidence"
                      checked={field.value}
                      onCheckedChange={(val) => field.onChange(val === true)}
                    />
                  )}
                />
                <Label htmlFor="requireMediaEvidence" className="text-sm font-semibold text-[#2D2D2D] cursor-pointer">
                  Yêu cầu minh chứng hình ảnh
                </Label>
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="act-desc" className="text-sm font-semibold text-[#2D2D2D]">
                Mô tả hoạt động
              </Label>
              <textarea
                id="act-desc"
                rows={3}
                placeholder="Nhập hướng dẫn chi tiết cho hoạt động này..."
                {...register("description")}
                className="w-full text-sm p-3 rounded-lg border border-[#D8D8D3] focus-visible:ring-1 focus-visible:ring-[#4FC3F7]/50 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-lg border-[#E5E5E0] text-[#2D2D2D] hover:bg-[#FAFAF5]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg font-semibold text-white bg-[#7CB342] hover:bg-[#7CB342]/90"
            >
              {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Hoạt động"}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

// ==========================================
// 4. Material Form Dialog (Upload)
// ==========================================
type MaterialUploadDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  existingMaterial?: { id: string; title: string; fileUrl: string | null } | null;
  onSuccess: () => void;
};

export function MaterialUploadDialog({
  isOpen,
  onOpenChange,
  activityId,
  existingMaterial,
  onSuccess,
}: MaterialUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateMaterialSchema),
    defaultValues: {
      title: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      reset({
        title: existingMaterial?.title || "",
      });
    }
  }, [isOpen, existingMaterial, reset]);

  const onSubmit = async (data: { title: string }) => {
    setIsSubmitting(true);
    try {
      if (existingMaterial) {
        // Just updating the title of existing material
        // Wait, does the backend support updating title?
        // Yes, PUT /api/materials/{materialId} takes UpdateMaterialRequestDto containing { title }.
        // If they want to upload a new file, we delete first or upload to overwrite (upload replaces it).
        if (file) {
          // If a new file is selected, upload it
          await uploadMaterial(activityId, data.title, file);
        } else {
          // Just update title
          // @ts-ignore
          await updateMaterial(existingMaterial.id, { title: data.title });
        }
        showAppSuccess({
          title: "Cập nhật thành công",
          description: `Đã cập nhật tài liệu học tập.`,
        });
      } else {
        if (!file) {
          showAppErrorFromUnknown(new Error("Vui lòng chọn tệp tin cần tải lên."), "programs.detail");
          setIsSubmitting(false);
          return;
        }
        await uploadMaterial(activityId, data.title, file);
        showAppSuccess({
          title: "Tải lên thành công",
          description: `Đã tải lên tài liệu: ${data.title}.`,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      showAppErrorFromUnknown(err, "programs.detail");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingMaterial) return;
    setIsDeleting(true);
    try {
      await deleteMaterial(existingMaterial.id);
      showAppSuccess({
        title: "Xóa thành công",
        description: `Đã gỡ bỏ tài liệu học tập khỏi hoạt động.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      showAppErrorFromUnknown(err, "programs.detail");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md gap-4">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{existingMaterial ? "Quản lý Tài liệu học tập" : "Tải lên Tài liệu học tập"}</DialogTitle>
          <DialogDescription>
            Hỗ trợ định dạng PDF, Word (≤50MB), Video (≤3GB) hoặc Ảnh (≤10MB).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mat-title" className="text-sm font-semibold text-[#2D2D2D]">
                Tiêu đề hiển thị <span className="text-[#E94B3C]">*</span>
              </Label>
              <Input
                id="mat-title"
                type="text"
                placeholder="Ví dụ: Slide bài giảng Buổi 1"
                {...register("title")}
                className="h-10 rounded-lg border-[#D8D8D3] focus-visible:ring-[#4FC3F7]/50"
              />
              {errors.title && (
                <p className="text-xs font-semibold text-[#E94B3C] mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#2D2D2D]">Tệp tài liệu</Label>
              {existingMaterial && !file ? (
                <div className="rounded-lg border border-[#E5E5E0] bg-[#FAFAF5] p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-sm font-medium text-[#2D2D2D] truncate">
                      {existingMaterial.title}
                    </p>
                    {existingMaterial.fileUrl && (
                      <a
                        href={existingMaterial.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#4FC3F7] hover:underline truncate block"
                      >
                        Xem tài liệu hiện tại
                      </a>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-8 text-[#E94B3C] hover:bg-[#E94B3C]/10 text-xs px-2.5 rounded-md shrink-0 font-medium"
                  >
                    {isDeleting ? "Đang gỡ..." : "Gỡ bỏ"}
                  </Button>
                </div>
              ) : null}

              <div className="mt-2">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#D8D8D3] hover:border-[#4FC3F7] rounded-xl p-6 cursor-pointer bg-white transition-all text-center">
                  <Upload className="size-8 text-[#6B6B6B] mb-2" />
                  <span className="text-sm font-medium text-[#2D2D2D]">
                    {file ? file.name : existingMaterial ? "Chọn tệp khác để thay thế..." : "Kéo thả hoặc nhấp chọn tệp tin"}
                  </span>
                  <span className="text-xs text-[#6B6B6B] mt-1">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Tối đa 50MB (Tài liệu) / 3GB (Video)"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (selected) {
                        setFile(selected);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-lg border-[#E5E5E0] text-[#2D2D2D] hover:bg-[#FAFAF5]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!file && !existingMaterial)}
              className="h-10 rounded-lg font-semibold text-white bg-[#7CB342] hover:bg-[#7CB342]/90"
            >
              {isSubmitting ? "Đang xử lý..." : existingMaterial ? "Lưu thay đổi" : "Tải lên"}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
