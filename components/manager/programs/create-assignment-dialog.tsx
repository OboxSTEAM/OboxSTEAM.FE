"use client";

import { useEffect, useMemo, useState } from "react";

import { AssignmentFormPanel } from "@/components/manager/programs/assignment-form-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import type { AssignmentDetail, ProgramWithModules } from "@/lib/api";
import { cn } from "@/lib/utils";

type CreateAssignmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: ProgramWithModules[];
  onCreated?: (assignment: AssignmentDetail) => void;
};

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  programs,
  onCreated,
}: CreateAssignmentDialogProps) {
  const [programId, setProgramId] = useState("");
  const [moduleId, setModuleId] = useState("");

  useEffect(() => {
    if (!open) return;
    setProgramId("");
    setModuleId("");
  }, [open]);

  const modules = useMemo(() => {
    const program = programs.find((p) => p.id === programId);
    if (!program) return [];
    return (program.modules ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      moduleType: m.moduleType,
    }));
  }, [programs, programId]);

  const courseOptions = useMemo(() => {
    const program = programs.find((p) => p.id === programId);
    const mod = program?.modules?.find((m) => m.id === moduleId);
    if (!mod) return [];
    return (mod.courses ?? []).map((c) => ({ id: c.id, name: c.name }));
  }, [programs, programId, moduleId]);

  useEffect(() => {
    if (moduleId && !modules.some((m) => m.id === moduleId)) {
      setModuleId("");
    }
  }, [modules, moduleId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="flex h-[min(90vh,820px)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-[#E5E5E0] px-6 py-4">
          <DialogTitle>Tạo bài tập</DialogTitle>
          <DialogDescription>
            Chọn module thuộc chương trình, rồi điền thông tin bài tập / quiz.
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 space-y-3 border-b border-[#E5E5E0] bg-[#FAFAF5] px-6 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#2D2D2D]">
                Chương trình <span className="text-[#E94B3C]">*</span>
              </Label>
              <Select
                value={programId || "none"}
                onValueChange={(v) => {
                  setProgramId(!v || v === "none" ? "" : v);
                  setModuleId("");
                }}
              >
                <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "w-full")}>
                  <span className="truncate">
                    {programs.find((p) => p.id === programId)?.name ||
                      "Chọn chương trình"}
                  </span>
                </SelectTrigger>
                <SelectContent className={LIGHT_SELECT_CONTENT}>
                  <SelectItem value="none" className={LIGHT_SELECT_ITEM}>
                    Chọn chương trình
                  </SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id} className={LIGHT_SELECT_ITEM}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#2D2D2D]">
                Module <span className="text-[#E94B3C]">*</span>
              </Label>
              <Select
                value={moduleId || "none"}
                onValueChange={(v) => setModuleId(!v || v === "none" ? "" : v)}
                disabled={!programId}
              >
                <SelectTrigger
                  className={cn(
                    LIGHT_SELECT_TRIGGER,
                    "w-full",
                    !programId && "opacity-60",
                  )}
                >
                  <span className="truncate">
                    {modules.find((m) => m.id === moduleId)?.name ||
                      (programId ? "Chọn module" : "Chọn chương trình trước")}
                  </span>
                </SelectTrigger>
                <SelectContent className={LIGHT_SELECT_CONTENT}>
                  <SelectItem value="none" className={LIGHT_SELECT_ITEM}>
                    {programId ? "Chọn module" : "Chọn chương trình trước"}
                  </SelectItem>
                  {modules.map((m) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className={LIGHT_SELECT_ITEM}
                    >
                      {m.name}
                      <span className="text-[#6B6B6B]"> · {m.moduleType}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!moduleId ? (
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
            </div>
          ) : null}
        </div>

        {moduleId ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <AssignmentFormPanel
              key={moduleId}
              moduleId={moduleId}
              courseOptions={courseOptions}
              assignmentToEdit={null}
              onSuccess={(assignment) => {
                onCreated?.(assignment);
                onOpenChange(false);
              }}
            />
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-[#6B6B6B]">
            Chọn chương trình và module để mở form tạo bài tập.
          </p>
        )}
      </DialogPopup>
    </Dialog>
  );
}
