"use client";

import { useEffect, useMemo, useState } from "react";

import { MilestoneFormPanel } from "@/components/manager/programs/milestone-form-panel";
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
import type { ProgramWithModules, ResearchMilestone } from "@/lib/api";
import { cn } from "@/lib/utils";

type CreateMilestoneDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: ProgramWithModules[];
  onCreated?: (milestone: ResearchMilestone) => void;
};

export function CreateMilestoneDialog({
  open,
  onOpenChange,
  programs,
  onCreated,
}: CreateMilestoneDialogProps) {
  const [programId, setProgramId] = useState("");
  const [moduleId, setModuleId] = useState("");

  useEffect(() => {
    if (!open) return;
    setProgramId("");
    setModuleId("");
  }, [open]);

  const researchModules = useMemo(() => {
    const program = programs.find((p) => p.id === programId);
    if (!program) return [];
    return (program.modules ?? [])
      .filter((m) => m.moduleType === "Research")
      .map((m) => ({ id: m.id, name: m.name }));
  }, [programs, programId]);

  const activityOptions = useMemo(() => {
    const program = programs.find((p) => p.id === programId);
    const mod = program?.modules?.find((m) => m.id === moduleId);
    if (!mod) return [];
    return (mod.courses ?? []).flatMap((course) =>
      (course.activities ?? []).map((a) => ({
        id: a.id,
        name: a.name,
      })),
    );
  }, [programs, programId, moduleId]);

  useEffect(() => {
    if (moduleId && !researchModules.some((m) => m.id === moduleId)) {
      setModuleId("");
    }
  }, [researchModules, moduleId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="flex h-[min(90vh,820px)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-[#E5E5E0] px-6 py-4">
          <DialogTitle>Tạo milestone nghiên cứu</DialogTitle>
          <DialogDescription>
            Chọn module Research, rồi điền thông tin milestone và sản phẩm nộp.
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
                Module Research <span className="text-[#E94B3C]">*</span>
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
                    {researchModules.find((m) => m.id === moduleId)?.name ||
                      (programId
                        ? "Chọn module Research"
                        : "Chọn chương trình trước")}
                  </span>
                </SelectTrigger>
                <SelectContent className={LIGHT_SELECT_CONTENT}>
                  <SelectItem value="none" className={LIGHT_SELECT_ITEM}>
                    {programId
                      ? "Chọn module Research"
                      : "Chọn chương trình trước"}
                  </SelectItem>
                  {researchModules.map((m) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className={LIGHT_SELECT_ITEM}
                    >
                      {m.name}
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
            <MilestoneFormPanel
              key={moduleId}
              moduleId={moduleId}
              activityOptions={activityOptions}
              milestoneToEdit={null}
              onSuccess={(milestone) => {
                onCreated?.(milestone);
                onOpenChange(false);
              }}
            />
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-[#6B6B6B]">
            Chọn chương trình và module Research để mở form tạo milestone.
          </p>
        )}
      </DialogPopup>
    </Dialog>
  );
}
