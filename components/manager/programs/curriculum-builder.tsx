"use client";

import { useState, type ReactNode } from "react";
import {
  Plus,
  Pencil,
  Trash,
  PlusCircle,
  FolderPlus,
  FileText,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ModuleFormDialog,
  CourseFormDialog,
  ActivityFormDialog,
  MaterialUploadDialog,
} from "./curriculum-dialogs";
import { deleteModule, deleteCourse, deleteActivity, type ProgramWithModules } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { formatProgramPrice, MODULE_TYPE_LABELS } from "@/lib/programs/constants";
import { formatActivityScheduleRange } from "@/lib/curriculum/datetime";
import { cn } from "@/lib/utils";

// ─── Warm palette (mirrors .learn-shell tokens) ───────────────────────────
const W = {
  bg:          "#ede9e0",
  surface:     "#f4f1ea",
  surface2:    "#e7e2d8",
  surface3:    "#ded8cc",
  border:      "#d8d2c6",
  textStrong:  "#2d2b27",
  text:        "#3a3833",
  muted:       "#6b6b6b",
  faint:       "#8c8678",
  accent:      "#4fc3f7",
  success:     "#7cb342",
  primary:     "#e94b3c",
} as const;

// ─── Activity type → display prefix ──────────────────────────────────────
const ACTIVITY_PREFIX: Record<string, string> = {
  SelfPaced:    "Đọc/Xem",
  LiveOnline:   "Buổi học",
  Offline:      "Thực hành",
  OfflineClass: "Thực hành",
};

// ─── Module type badge styles ─────────────────────────────────────────────
const MODULE_TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  Theory:       { bg: "rgba(79,195,247,0.12)",  text: "#0d6e9c" },
  Experiential: { bg: "rgba(124,179,66,0.12)",  text: "#3d5c22" },
  Research:     { bg: "rgba(126,87,194,0.12)",  text: "#51308a" },
};

function formatIndex(n: number) {
  return String(n + 1).padStart(2, "0");
}

// ─── Tree visual primitives ───────────────────────────────────────────────
function TreeBranch({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative ml-3 pl-4", className)}>
      <span
        className="pointer-events-none absolute top-0 bottom-2 left-0 w-px"
        style={{ background: W.border }}
        aria-hidden
      />
      {children}
    </div>
  );
}

function TreeNode({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute top-[1.375rem] left-0 h-px w-4 -translate-x-4"
        style={{ background: W.border }}
        aria-hidden
      />
      {children}
    </div>
  );
}

// ─── Inline action icon buttons (never nested inside another button) ───────
function ActionBtn({
  title,
  onClick,
  hoverBg,
  hoverColor,
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  hoverBg: string;
  hoverColor: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
      style={{ color: W.faint }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = hoverBg;
        el.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "transparent";
        el.style.color = W.faint;
      }}
    >
      {children}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────
type CurriculumBuilderProps = {
  program: ProgramWithModules;
  onRefresh: () => void;
};

// ─── Main ─────────────────────────────────────────────────────────────────
export function CurriculumBuilder({ program, onRefresh }: CurriculumBuilderProps) {
  const modules = [...(program.modules || [])].sort((a, b) => a.moduleOrder - b.moduleOrder);

  const [openModules,   setOpenModules]   = useState<Record<string, boolean>>({});
  const [openCourses,   setOpenCourses]   = useState<Record<string, boolean>>({});

  const [activeModuleDialog,   setActiveModuleDialog]   = useState<{ open: boolean; module: any | null }>({ open: false, module: null });
  const [activeCourseDialog,   setActiveCourseDialog]   = useState<{ open: boolean; moduleId: string; course: any | null }>({ open: false, moduleId: "", course: null });
  const [activeActivityDialog, setActiveActivityDialog] = useState<{ open: boolean; courseId: string; activity: any | null }>({ open: false, courseId: "", activity: null });
  const [activeMaterialDialog, setActiveMaterialDialog] = useState<{ open: boolean; activityId: string; material: any | null }>({ open: false, activityId: "", material: null });
  const [deleteTarget, setDeleteTarget] = useState<{ type: "module" | "course" | "activity"; id: string; name: string } | null>(null);

  const isModuleOpen = (id: string) => openModules[id] ?? true;
  const isCourseOpen = (id: string) => openCourses[id] ?? true;
  const toggleModule = (id: string) => setOpenModules((p) => ({ ...p, [id]: !isModuleOpen(id) }));
  const toggleCourse = (id: string) => setOpenCourses((p) => ({ ...p, [id]: !isCourseOpen(id) }));

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "module") {
        await deleteModule(deleteTarget.id);
        showAppSuccess({ title: "Xóa thành công", description: `Đã xóa module: ${deleteTarget.name}.` });
      } else if (deleteTarget.type === "course") {
        await deleteCourse(deleteTarget.id);
        showAppSuccess({ title: "Xóa thành công", description: `Đã xóa khóa học: ${deleteTarget.name}.` });
      } else {
        await deleteActivity(deleteTarget.id);
        showAppSuccess({ title: "Xóa thành công", description: `Đã xóa hoạt động: ${deleteTarget.name}.` });
      }
      onRefresh();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.node.delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: W.bg }}>

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ background: W.surface, borderColor: W.border }}
      >
        <div>
          <h3 className="text-base font-semibold" style={{ color: W.textStrong }}>
            Khung chương trình học
          </h3>
          <p className="text-xs mt-0.5" style={{ color: W.muted }}>
            {program.name} · {modules.length} học phần
          </p>
        </div>
        <Button
          onClick={() => setActiveModuleDialog({ open: true, module: null })}
          className="h-9 rounded-lg font-semibold text-white text-sm gap-1.5 border-none"
          style={{ background: W.success }}
        >
          <FolderPlus className="size-4" />
          Thêm Module
        </Button>
      </div>

      {/* ── Empty state ───────────────────────────────────────────── */}
      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FileText className="size-10" style={{ color: W.surface3 }} />
          <p className="text-sm font-semibold" style={{ color: W.textStrong }}>
            Chưa có học phần nào
          </p>
          <p className="text-xs" style={{ color: W.muted }}>
            Tạo Module đầu tiên để xây dựng khung chương trình.
          </p>
          <button
            type="button"
            onClick={() => setActiveModuleDialog({ open: true, module: null })}
            className="mt-1 text-xs font-semibold underline"
            style={{ color: W.accent }}
          >
            + Tạo Module
          </button>
        </div>
      ) : (
        <div className="space-y-2 p-3">
          {modules.map((module, mIdx) => {
            const open       = isModuleOpen(module.id);
            const courses    = [...(module.courses || [])];
            const typeMeta   = MODULE_TYPE_STYLE[module.moduleType] ?? { bg: "rgba(0,0,0,0.06)", text: W.muted };
            const prerequisite = program.modules.find((m) => m.id === module.prerequisiteModuleId);

            return (
              <div
                key={module.id}
                className="overflow-hidden rounded-xl border"
                style={{ background: W.surface2, borderColor: W.border }}
              >
                {/*
                  ── Module row ─────────────────────────────────────────────
                  Layout: [toggle area (flex-1)] [action buttons]
                  Action buttons are SIBLINGS of the toggle div, NOT children.
                  This avoids nested <button> inside <button>.
                */}
                <div
                  className="flex w-full items-center gap-1 pl-3 pr-2 py-3"
                  style={{ background: W.surface2 }}
                >
                  {/* Toggle area – a single button that collapses the module */}
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-expanded={open}
                  >
                    {/* Index badge */}
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold"
                      style={{ background: W.surface3, color: W.textStrong, border: `1px solid ${W.border}` }}
                    >
                      {formatIndex(mIdx)}
                    </span>

                    {/* Name + meta */}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="block font-semibold text-[15px] leading-snug" style={{ color: W.textStrong }}>
                          {module.name}
                        </span>
                        {module.isMandatory && (
                          <span
                            className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                            style={{ background: "rgba(233,75,60,0.10)", color: W.primary }}
                          >
                            Bắt buộc
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: W.faint }}>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: typeMeta.bg, color: typeMeta.text }}
                        >
                          {MODULE_TYPE_LABELS[module.moduleType] || module.moduleType}
                        </span>
                        <span>·</span>
                        <span>{formatProgramPrice(module.price)}</span>
                        {prerequisite && (
                          <>
                            <span>·</span>
                            <span>Sau: {prerequisite.name}</span>
                          </>
                        )}
                      </span>
                    </span>

                    {/* Chevron */}
                    <ChevronRight
                      className={cn("size-4 shrink-0 transition-transform duration-200", open && "rotate-90")}
                      style={{ color: W.faint }}
                      aria-hidden
                    />
                  </button>

                  {/* Action buttons – siblings of the toggle button, NOT nested inside it */}
                  <div className="flex items-center gap-0.5 shrink-0 ml-1">
                    <ActionBtn
                      title="Thêm Khóa học"
                      onClick={() => setActiveCourseDialog({ open: true, moduleId: module.id, course: null })}
                      hoverBg="rgba(124,179,66,0.12)"
                      hoverColor={W.success}
                    >
                      <Plus className="size-3.5" />
                    </ActionBtn>
                    <ActionBtn
                      title="Sửa Module"
                      onClick={() => setActiveModuleDialog({ open: true, module })}
                      hoverBg="rgba(79,195,247,0.12)"
                      hoverColor={W.accent}
                    >
                      <Pencil className="size-3.5" />
                    </ActionBtn>
                    <ActionBtn
                      title="Xóa Module"
                      onClick={() => setDeleteTarget({ type: "module", id: module.id, name: module.name })}
                      hoverBg="rgba(233,75,60,0.10)"
                      hoverColor={W.primary}
                    >
                      <Trash className="size-3.5" />
                    </ActionBtn>
                  </div>
                </div>

                {/* Module expanded body */}
                {open && (
                  <div
                    className="border-t px-2.5 pb-3 pt-2"
                    style={{ background: W.bg, borderColor: W.border }}
                  >
                    {/* Learning outcomes */}
                    {module.learningOutcomes && module.learningOutcomes.length > 0 && (
                      <div className="mb-2.5 flex flex-col gap-0.5 px-1">
                        {module.learningOutcomes.map((o: string, i: number) => (
                          <span key={i} className="flex items-start gap-1 text-[11px]" style={{ color: W.muted }}>
                            <CheckCircle2 className="size-3 shrink-0 mt-0.5" style={{ color: W.success }} />
                            {o}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Courses tree */}
                    {courses.length === 0 ? (
                      <div className="flex items-center gap-2 px-1 py-2 text-xs" style={{ color: W.muted }}>
                        <span>Chưa có khóa học nào.</span>
                        <button
                          type="button"
                          onClick={() => setActiveCourseDialog({ open: true, moduleId: module.id, course: null })}
                          className="font-semibold underline"
                          style={{ color: W.accent }}
                        >
                          + Thêm khóa học
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {courses.map((course) => {
                          const courseOpen = isCourseOpen(course.id);
                          const activities = [...(course.activities || [])].sort(
                            (a, b) => a.activityOrder - b.activityOrder
                          );

                          return (
                            <TreeNode key={course.id}>
                              {/*
                                ── Course row ───────────────────────────────────────────
                                Same pattern: [toggle button (flex-1)] [action buttons]
                                Siblings, never nested.
                              */}
                              <div
                                className="flex items-start rounded-lg group/c"
                                style={{ border: `1px solid ${W.border}`, background: W.surface }}
                              >
                                {/* Toggle button for course */}
                                <button
                                  type="button"
                                  onClick={() => toggleCourse(course.id)}
                                  className="flex min-w-0 flex-1 items-start gap-2 px-3 py-2.5 text-left"
                                  aria-expanded={courseOpen}
                                >
                                  <ChevronRight
                                    className={cn("mt-0.5 size-4 shrink-0 transition-transform duration-200", courseOpen && "rotate-90")}
                                    style={{ color: W.faint }}
                                    aria-hidden
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className="font-mono text-[10px] font-medium tracking-[0.12em] uppercase"
                                      style={{ color: W.faint }}
                                    >
                                      Khóa học
                                    </span>
                                    <span className="mt-0.5 flex items-center gap-2 flex-wrap">
                                      <span
                                        className="block font-semibold text-[15px] leading-snug"
                                        style={{ color: W.textStrong }}
                                      >
                                        {course.name}
                                      </span>
                                      {course.code && (
                                        <span
                                          className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                          style={{ background: W.surface3, color: W.faint, border: `1px solid ${W.border}` }}
                                        >
                                          {course.code}
                                        </span>
                                      )}
                                    </span>
                                    {course.description && (
                                      <span className="mt-0.5 block text-xs leading-snug" style={{ color: W.muted }}>
                                        {course.description}
                                      </span>
                                    )}
                                  </span>
                                </button>

                                {/* Course action buttons – siblings of toggle button */}
                                <div className="flex items-center gap-0.5 p-1.5 opacity-0 group-hover/c:opacity-100 transition-opacity shrink-0">
                                  <ActionBtn
                                    title="Thêm Hoạt động"
                                    onClick={() => setActiveActivityDialog({ open: true, courseId: course.id, activity: null })}
                                    hoverBg="rgba(124,179,66,0.12)"
                                    hoverColor={W.success}
                                  >
                                    <Plus className="size-3" />
                                  </ActionBtn>
                                  <ActionBtn
                                    title="Sửa Khóa học"
                                    onClick={() => setActiveCourseDialog({ open: true, moduleId: module.id, course })}
                                    hoverBg="rgba(79,195,247,0.12)"
                                    hoverColor={W.accent}
                                  >
                                    <Pencil className="size-3" />
                                  </ActionBtn>
                                  <ActionBtn
                                    title="Xóa Khóa học"
                                    onClick={() => setDeleteTarget({ type: "course", id: course.id, name: course.name })}
                                    hoverBg="rgba(233,75,60,0.10)"
                                    hoverColor={W.primary}
                                  >
                                    <Trash className="size-3" />
                                  </ActionBtn>
                                </div>
                              </div>

                              {/* Activities list */}
                              {courseOpen && (
                                <TreeBranch className="space-y-0.5 py-1">
                                  {activities.length === 0 ? (
                                    <div className="flex items-center gap-2 py-1.5 pl-2 text-xs" style={{ color: W.muted }}>
                                      <span>Chưa có hoạt động.</span>
                                      <button
                                        type="button"
                                        onClick={() => setActiveActivityDialog({ open: true, courseId: course.id, activity: null })}
                                        className="font-semibold underline"
                                        style={{ color: W.accent }}
                                      >
                                        + Thêm
                                      </button>
                                    </div>
                                  ) : (
                                    activities.map((activity) => {
                                      const prefix = ACTIVITY_PREFIX[activity.activityType] ?? activity.activityType;

                                      return (
                                        /*
                                          ── Activity row ─────────────────────────────────────
                                          Layout: [icon] [text (flex-1)] [material chip] [actions]
                                          No nested buttons – all are flat siblings.
                                        */
                                        <div key={activity.id} className="relative">
                                          <span
                                            className="pointer-events-none absolute top-[1.375rem] left-0 h-px w-4 -translate-x-4"
                                            style={{ background: W.border }}
                                            aria-hidden
                                          />
                                          <div
                                            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-2 group/act transition-colors"
                                            style={{ color: W.text }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = W.surface; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                          >
                                            {/* Status icon */}
                                            <Circle className="size-4 shrink-0" style={{ color: W.faint }} aria-hidden />

                                            {/* Text */}
                                            <span className="min-w-0 flex-1 leading-snug text-sm">
                                              <span style={{ color: W.faint }}>{prefix}: </span>
                                              {activity.name}
                                              {activity.activityType !== "SelfPaced" && (
                                                <span className="ml-2 inline-flex items-center gap-2 text-[11px]" style={{ color: W.faint }}>
                                                  {activity.location && (
                                                    <span className="flex items-center gap-0.5">
                                                      <MapPin className="size-2.5" />
                                                      <span className="truncate max-w-[100px]">{activity.location}</span>
                                                    </span>
                                                  )}
                                                  {activity.startTime && (
                                                    <span className="flex items-center gap-0.5">
                                                      <Calendar className="size-2.5" />
                                                      {formatActivityScheduleRange(
                                                        activity.startTime,
                                                        activity.endTime,
                                                      )}
                                                    </span>
                                                  )}
                                                  {activity.maxCapacity && (
                                                    <span className="flex items-center gap-0.5">
                                                      <Users className="size-2.5" />
                                                      {activity.maxCapacity}
                                                    </span>
                                                  )}
                                                </span>
                                              )}
                                            </span>

                                            {/* Material chip / add button */}
                                            {activity.material ? (
                                              <button
                                                type="button"
                                                onClick={() => setActiveMaterialDialog({ open: true, activityId: activity.id, material: activity.material })}
                                                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors"
                                                style={{ background: "rgba(124,179,66,0.10)", color: "#3d5c22", border: "1px solid rgba(124,179,66,0.20)" }}
                                              >
                                                <FileText className="size-2.5" />
                                                {activity.material.title.length > 18
                                                  ? activity.material.title.slice(0, 18) + "…"
                                                  : activity.material.title}
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => setActiveMaterialDialog({ open: true, activityId: activity.id, material: null })}
                                                className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium opacity-0 group-hover/act:opacity-100 transition-opacity"
                                                style={{ color: W.accent }}
                                              >
                                                <PlusCircle className="size-3" />
                                                tài liệu
                                              </button>
                                            )}

                                            {/* Activity actions */}
                                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/act:opacity-100 transition-opacity">
                                              <ActionBtn
                                                title="Sửa Hoạt động"
                                                onClick={() => setActiveActivityDialog({ open: true, courseId: course.id, activity })}
                                                hoverBg="rgba(79,195,247,0.12)"
                                                hoverColor={W.accent}
                                              >
                                                <Pencil className="size-3" />
                                              </ActionBtn>
                                              <ActionBtn
                                                title="Xóa Hoạt động"
                                                onClick={() => setDeleteTarget({ type: "activity", id: activity.id, name: activity.name })}
                                                hoverBg="rgba(233,75,60,0.10)"
                                                hoverColor={W.primary}
                                              >
                                                <Trash className="size-3" />
                                              </ActionBtn>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}

                                  {/* Add activity shortcut */}
                                  {activities.length > 0 && (
                                    <div className="relative">
                                      <span
                                        className="pointer-events-none absolute top-[1.375rem] left-0 h-px w-4 -translate-x-4"
                                        style={{ background: W.border }}
                                        aria-hidden
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setActiveActivityDialog({ open: true, courseId: course.id, activity: null })}
                                        className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
                                        style={{ color: W.faint }}
                                        onMouseEnter={(e) => {
                                          const el = e.currentTarget as HTMLElement;
                                          el.style.color = W.accent;
                                          el.style.background = W.surface;
                                        }}
                                        onMouseLeave={(e) => {
                                          const el = e.currentTarget as HTMLElement;
                                          el.style.color = W.faint;
                                          el.style.background = "transparent";
                                        }}
                                      >
                                        <Plus className="size-3.5" />
                                        Thêm hoạt động
                                      </button>
                                    </div>
                                  )}
                                </TreeBranch>
                              )}
                            </TreeNode>
                          );
                        })}

                        {/* Add course shortcut */}
                        <TreeNode>
                          <button
                            type="button"
                            onClick={() => setActiveCourseDialog({ open: true, moduleId: module.id, course: null })}
                            className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                            style={{ color: W.faint }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.color = W.accent;
                              el.style.background = W.surface;
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.color = W.faint;
                              el.style.background = "transparent";
                            }}
                          >
                            <Plus className="size-3.5" />
                            Thêm khóa học
                          </button>
                        </TreeNode>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────── */}
      <ModuleFormDialog
        isOpen={activeModuleDialog.open}
        onOpenChange={(open) => setActiveModuleDialog({ open, module: null })}
        programId={program.id}
        moduleToEdit={activeModuleDialog.module}
        modulesInProgram={program.modules || []}
        onSuccess={onRefresh}
      />
      <CourseFormDialog
        isOpen={activeCourseDialog.open}
        onOpenChange={(open) => setActiveCourseDialog({ open, moduleId: "", course: null })}
        moduleId={activeCourseDialog.moduleId}
        courseToEdit={activeCourseDialog.course}
        onSuccess={onRefresh}
      />
      <ActivityFormDialog
        isOpen={activeActivityDialog.open}
        onOpenChange={(open) => setActiveActivityDialog({ open, courseId: "", activity: null })}
        courseId={activeActivityDialog.courseId}
        activityToEdit={activeActivityDialog.activity}
        onSuccess={onRefresh}
      />
      <MaterialUploadDialog
        isOpen={activeMaterialDialog.open}
        onOpenChange={(open) => setActiveMaterialDialog({ open, activityId: "", material: null })}
        activityId={activeMaterialDialog.activityId}
        existingMaterial={activeMaterialDialog.material}
        onSuccess={onRefresh}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        title={`Xác nhận xóa ${deleteTarget?.type === "module" ? "Module" : deleteTarget?.type === "course" ? "Khóa học" : "Hoạt động"}`}
        description={`Bạn có chắc muốn xóa "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa bỏ"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </div>
  );
}
