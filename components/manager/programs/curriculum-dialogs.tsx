"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, AlertCircle, BookOpen } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogScrollBody,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollPopup,
  DialogTitle,
  dialogScrollFormClassName,
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
import { DEFAULT_LIVE_ACTIVITY_DURATION_MINUTES } from "@/lib/classes/lifecycle";
import { invalidateClassSessions } from "@/lib/classes/session-invalidate-bus";
import { showAppError, showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  LIGHT_SELECT_TRIGGER,
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
} from "@/components/programs/program-select-styles";
import { MODULE_TYPE_LABELS } from "@/lib/programs/constants";

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
        code: data.code,
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
      showAppErrorFromUnknown(err, "curriculum.module.save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherModules = modulesInProgram.filter(
    (m) => !isEdit || m.id !== moduleToEdit?.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogScrollPopup className="max-w-3xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={dialogScrollFormClassName}
        >
          <DialogScrollHeader className="bg-background">
            <DialogClose />
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-card shadow-xs">
                <BookOpen className="size-4 text-[#7CB342]" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {isEdit ? "Cập nhật Module" : "Tạo Module mới"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  Điền thông tin chi tiết cho học phần (Module) thuộc chương trình học này.
                </DialogDescription>
              </div>
            </div>
          </DialogScrollHeader>

          <DialogScrollBody className="divide-y divide-border px-0 py-0">
          {/* Section 1: Thông tin cơ bản */}
          <div className="space-y-4 px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Thông tin cơ bản
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="module-name" className="text-sm font-semibold text-foreground">
                  Tên Module <span className="text-primary">*</span>
                </Label>
                <Input
                  id="module-name"
                  type="text"
                  placeholder="Ví dụ: Robotics Cơ Bản"
                  {...register("name")}
                  className="h-10 rounded-lg border-border focus-visible:ring-ring/50"
                />
                {errors.name && (
                  <p className="text-xs font-semibold text-primary">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="module-code" className="text-sm font-semibold text-foreground">
                  Mã Module <span className="text-primary">*</span>
                </Label>
                <Input
                  id="module-code"
                  type="text"
                  placeholder="Ví dụ: MOD-ROBO1"
                  {...register("code")}
                  className="h-10 rounded-lg border-border font-mono focus-visible:ring-ring/50"
                />
                {errors.code && (
                  <p className="text-xs font-semibold text-primary">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="moduleOrder" className="text-sm font-semibold text-foreground">
                  Thứ tự học <span className="text-primary">*</span>
                </Label>
                <Input
                  id="moduleOrder"
                  type="number"
                  {...register("moduleOrder", { valueAsNumber: true })}
                  className="h-10 rounded-lg border-border focus-visible:ring-ring/50"
                />
                {errors.moduleOrder && (
                  <p className="text-xs font-semibold text-primary">{errors.moduleOrder.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Cấu hình học tập */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Cấu hình học tập
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="moduleType" className="text-sm font-semibold text-foreground">
                  Loại Module <span className="text-primary">*</span>
                </Label>
                <Controller
                  name="moduleType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg border-border")}>
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
                <Label htmlFor="prerequisiteModuleId" className="text-sm font-semibold text-foreground">
                  Module tiên quyết
                </Label>
                <Controller
                  name="prerequisiteModuleId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || "none"} onValueChange={(val) => field.onChange(val === "none" ? null : val)}>
                      <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg border-border")}>
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
                      className="border-input bg-background data-checked:border-primary"
                    />
                  )}
                />
                <Label htmlFor="isMandatory" className="text-sm font-semibold text-foreground cursor-pointer">
                  Học phần bắt buộc
                </Label>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="learningOutcomesText" className="text-sm font-semibold text-foreground">
                  Kiến thức đạt được
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(mỗi dòng một mục tiêu)</span>
                </Label>
                <textarea
                  id="learningOutcomesText"
                  rows={3}
                  placeholder={`Ví dụ:\nHiểu các linh kiện điện tử cơ bản\nLập trình được Robot di chuyển tránh vật cản`}
                  {...register("learningOutcomesText")}
                  className="w-full text-sm p-3 rounded-lg border border-border focus-visible:ring-1 focus-visible:ring-ring/50 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Học phí */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Học phí
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-semibold text-foreground">
                  Học phí Module (VND) <span className="text-primary">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  {...register("price", { valueAsNumber: true })}
                  className="h-10 rounded-lg border-border font-mono focus-visible:ring-ring/50"
                />
                {errors.price && (
                  <p className="text-xs font-semibold text-primary">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="retakeFee" className="text-sm font-semibold text-foreground">
                  Học phí học lại (VND) <span className="text-primary">*</span>
                </Label>
                <Input
                  id="retakeFee"
                  type="number"
                  placeholder="0"
                  {...register("retakeFee", { valueAsNumber: true })}
                  className="h-10 rounded-lg border-border font-mono focus-visible:ring-ring/50"
                />
                {errors.retakeFee && (
                  <p className="text-xs font-semibold text-primary">{errors.retakeFee.message}</p>
                )}
              </div>
            </div>
          </div>
          </DialogScrollBody>

          <DialogScrollFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-lg border-border text-foreground hover:bg-card"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 gap-1.5 rounded-lg bg-[#7CB342] font-semibold text-white hover:bg-[#7CB342]/90"
            >
              {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Module"}
            </Button>
          </DialogScrollFooter>
        </form>
      </DialogScrollPopup>
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
  coursesInModule?: Course[];
  onSuccess: () => void;
};

export function CourseFormDialog({
  isOpen,
  onOpenChange,
  moduleId,
  courseToEdit,
  coursesInModule = [],
  onSuccess,
}: CourseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!courseToEdit;
  const nextCourseOrder =
    coursesInModule.reduce((max, course) => Math.max(max, course.courseOrder ?? 0), 0) + 1;

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
      courseOrder: nextCourseOrder,
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
          courseOrder: courseToEdit.courseOrder ?? 1,
        });
      } else {
        reset({
          code: "",
          moduleId,
          name: "",
          description: "",
          courseOrder: nextCourseOrder,
        });
      }
    }
  }, [isOpen, courseToEdit, moduleId, nextCourseOrder, reset]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const orderNum = Number(data.courseOrder);
      const payload = {
        code: data.code,
        moduleId: data.moduleId,
        name: data.name,
        description: data.description || "",
        courseOrder: orderNum,
      };

      if (isEdit && courseToEdit) {
        const orderUnchanged = orderNum === courseToEdit.courseOrder;
        await updateCourse(courseToEdit.id, {
          ...payload,
          courseOrder: orderUnchanged ? undefined : orderNum,
        });
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
      showAppErrorFromUnknown(err, "curriculum.course.save");
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
              <Label htmlFor="course-name" className="text-sm font-semibold text-foreground">
                Tên Khóa học <span className="text-primary">*</span>
              </Label>
              <Input
                id="course-name"
                type="text"
                placeholder="Ví dụ: Nhập môn lập trình với Scratch"
                {...register("name")}
                className="h-10 rounded-lg border-border focus-visible:ring-ring/50"
              />
              {errors.name && (
                <p className="text-xs font-semibold text-primary mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-[1fr_6.5rem] gap-4">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="course-code" className="text-sm font-semibold text-foreground">
                  Mã Khóa học <span className="text-primary">*</span>
                </Label>
                <Input
                  id="course-code"
                  type="text"
                  placeholder="Ví dụ: CRS-SCRATCH1"
                  {...register("code")}
                  className="h-10 rounded-lg border-border font-mono focus-visible:ring-ring/50"
                />
                {errors.code && (
                  <p className="text-xs font-semibold text-primary mt-1">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="courseOrder" className="text-sm font-semibold text-foreground">
                  Thứ tự <span className="text-primary">*</span>
                </Label>
                <Input
                  id="courseOrder"
                  type="number"
                  min={1}
                  {...register("courseOrder", { valueAsNumber: true })}
                  className="h-10 rounded-lg border-border font-mono focus-visible:ring-ring/50"
                />
                {errors.courseOrder && (
                  <p className="text-xs font-semibold text-primary mt-1">{errors.courseOrder.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="course-description" className="text-sm font-semibold text-foreground">
                Mô tả khóa học
              </Label>
              <textarea
                id="course-description"
                rows={3}
                placeholder="Nhập mô tả tóm tắt nội dung học tập của khóa học này..."
                {...register("description")}
                className="w-full text-sm p-3 rounded-lg border border-border focus-visible:ring-1 focus-visible:ring-ring/50 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-lg border-border text-foreground hover:bg-background"
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
    setValue,
    getValues,
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
      durationMinutes: null,
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
          durationMinutes: activityToEdit.durationMinutes ?? null,
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
          durationMinutes: null,
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
        code: data.code,
        courseId: data.courseId,
        name: data.name,
        activityType: data.activityType,
        description: data.description || "",
        activityOrder: Number(data.activityOrder),
        durationMinutes: isOnlineOrOffline
          ? Number(data.durationMinutes) || DEFAULT_LIVE_ACTIVITY_DURATION_MINUTES
          : null,
        requireQrCheckin: data.activityType === "Offline" ? data.requireQrCheckin : false,
        requireMediaEvidence: data.activityType === "Offline" ? data.requireMediaEvidence : false,
      };

      if (isEdit && activityToEdit) {
        const previousDuration = activityToEdit.durationMinutes ?? null;
        await updateActivity(activityToEdit.id, payload);
        const durationChanged =
          isOnlineOrOffline &&
          previousDuration !== (payload.durationMinutes ?? null);
        if (durationChanged) {
          invalidateClassSessions();
        }
        showAppSuccess({
          title: "Cập nhật thành công",
          description: durationChanged
            ? `Đã cập nhật hoạt động ${data.name}. EndTime các buổi gắn activity đã được máy chủ tính lại.`
            : `Đã cập nhật thông tin hoạt động ${data.name}.`,
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
      showAppErrorFromUnknown(err, "curriculum.activity.save");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogScrollPopup className="max-w-2xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={dialogScrollFormClassName}
        >
          <DialogScrollHeader>
            <DialogTitle>{isEdit ? "Cập nhật Hoạt động" : "Tạo Hoạt động mới"}</DialogTitle>
            <DialogDescription>
              Thiết lập thông tin hoạt động học tập (tự học, lớp online, lớp offline).
            </DialogDescription>
          </DialogScrollHeader>
          <DialogClose />

          <DialogScrollBody>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label htmlFor="act-name" className="text-sm font-semibold text-foreground">
                Tên Hoạt động <span className="text-primary">*</span>
              </Label>
              <Input
                id="act-name"
                type="text"
                placeholder="Ví dụ: Xem Video hướng dẫn Assembly"
                {...register("name")}
                className="h-10 rounded-lg border-border focus-visible:ring-ring/50"
              />
              {errors.name && (
                <p className="text-xs font-semibold text-primary mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label htmlFor="act-code" className="text-sm font-semibold text-foreground">
                Mã Hoạt động <span className="text-primary">*</span>
              </Label>
              <Input
                id="act-code"
                type="text"
                placeholder="Ví dụ: ACT-01"
                {...register("code")}
                className="h-10 rounded-lg border-border focus-visible:ring-ring/50"
              />
              {errors.code && (
                <p className="text-xs font-semibold text-primary mt-1">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1 flex flex-col">
              <Label htmlFor="activityType" className="text-sm font-semibold text-foreground mb-1.5">
                Loại Hoạt động <span className="text-primary">*</span>
              </Label>
              <Controller
                name="activityType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value ?? "");
                      if (value !== "Offline") {
                        setValue("requireQrCheckin", false);
                        setValue("requireMediaEvidence", false);
                      }
                      if (value && value !== "SelfPaced" && !getValues("durationMinutes")) {
                        setValue(
                          "durationMinutes",
                          DEFAULT_LIVE_ACTIVITY_DURATION_MINUTES,
                        );
                      }
                    }}
                  >
                    <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-10 rounded-lg border-border")}>
                      <SelectValue placeholder="Chọn loại hoạt động" />
                    </SelectTrigger>
                    <SelectContent className={LIGHT_SELECT_CONTENT}>
                      <SelectItem value="SelfPaced" className={LIGHT_SELECT_ITEM}>Tự học (Self-Paced)</SelectItem>
                      <SelectItem value="LiveOnline" className={LIGHT_SELECT_ITEM}>Online</SelectItem>
                      <SelectItem value="Offline" className={LIGHT_SELECT_ITEM}>Offline</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label htmlFor="activityOrder" className="text-sm font-semibold text-foreground">
                Thứ tự hoạt động <span className="text-primary">*</span>
              </Label>
              <Input
                id="activityOrder"
                type="number"
                {...register("activityOrder", { valueAsNumber: true })}
                className="h-10 rounded-lg border-border focus-visible:ring-ring/50"
              />
              {errors.activityOrder && (
                <p className="text-xs font-semibold text-primary mt-1">{errors.activityOrder.message}</p>
              )}
            </div>

            {activityType !== "SelfPaced" && (
              <>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <Label htmlFor="durationMinutes" className="text-sm font-semibold text-foreground">
                    Thời lượng (phút) <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min={1}
                    placeholder={String(DEFAULT_LIVE_ACTIVITY_DURATION_MINUTES)}
                    {...register("durationMinutes", { valueAsNumber: true })}
                    className="h-10 rounded-lg border-border focus-visible:ring-ring/50"
                  />
                  {errors.durationMinutes && (
                    <p className="text-xs font-semibold text-primary mt-1">
                      {errors.durationMinutes.message}
                    </p>
                  )}
                </div>
                <div className="col-span-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                  Thời lượng dùng khi xếp ClassSession. Giờ và địa điểm thật nằm
                  trên lịch lớp, không đặt ở cấp hoạt động.
                </div>
              </>
            )}

            {activityType === "Offline" && (
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
                        className="border-input bg-background data-checked:border-primary"
                      />
                    )}
                  />
                  <Label htmlFor="requireQrCheckin" className="text-sm font-semibold text-foreground cursor-pointer">
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
                        className="border-input bg-background data-checked:border-primary"
                      />
                    )}
                  />
                  <Label htmlFor="requireMediaEvidence" className="text-sm font-semibold text-foreground cursor-pointer">
                    Yêu cầu minh chứng hình ảnh
                  </Label>
                </div>
              </div>
            )}

            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="act-desc" className="text-sm font-semibold text-foreground">
                Mô tả hoạt động
              </Label>
              <textarea
                id="act-desc"
                rows={3}
                placeholder="Nhập hướng dẫn chi tiết cho hoạt động này..."
                {...register("description")}
                className="w-full text-sm p-3 rounded-lg border border-border focus-visible:ring-1 focus-visible:ring-ring/50 outline-none"
              />
            </div>
          </div>
          </DialogScrollBody>

          <DialogScrollFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-lg border-border text-foreground hover:bg-background"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-[#7CB342] font-semibold text-white hover:bg-[#7CB342]/90"
            >
              {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Hoạt động"}
            </Button>
          </DialogScrollFooter>
        </form>
      </DialogScrollPopup>
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
          showAppError({
            title: "Thiếu tệp tài liệu",
            reason: "Bạn chưa chọn tệp cần tải lên.",
            action: "Chọn tệp PDF, tài liệu hoặc media rồi thử lại.",
          });
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
      showAppErrorFromUnknown(err, "curriculum.material.save");
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
      showAppErrorFromUnknown(err, "curriculum.material.delete");
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
              <Label htmlFor="mat-title" className="text-sm font-semibold text-foreground">
                Tiêu đề hiển thị <span className="text-primary">*</span>
              </Label>
              <Input
                id="mat-title"
                type="text"
                placeholder="Ví dụ: Slide bài giảng Buổi 1"
                {...register("title")}
                className="h-10 rounded-lg border-border focus-visible:ring-ring/50"
              />
              {errors.title && (
                <p className="text-xs font-semibold text-primary mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">Tệp tài liệu</Label>
              {existingMaterial && !file ? (
                <div className="rounded-lg border border-border bg-background p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-sm font-medium text-foreground truncate">
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
                    className="h-8 text-primary hover:bg-primary/10 text-xs px-2.5 rounded-md shrink-0 font-medium"
                  >
                    {isDeleting ? "Đang gỡ..." : "Gỡ bỏ"}
                  </Button>
                </div>
              ) : null}

              <div className="mt-2">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-[#4FC3F7] rounded-xl p-6 cursor-pointer bg-card transition-all text-center">
                  <Upload className="size-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-foreground">
                    {file ? file.name : existingMaterial ? "Chọn tệp khác để thay thế..." : "Kéo thả hoặc nhấp chọn tệp tin"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
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

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-lg border-border text-foreground hover:bg-background"
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
