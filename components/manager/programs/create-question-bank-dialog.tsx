"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  createQuestionBank,
  type ProgramWithModules,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type CreateQuestionBankDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: ProgramWithModules[];
  onCreated?: () => void;
};

export function CreateQuestionBankDialog({
  open,
  onOpenChange,
  programs,
  onCreated,
}: CreateQuestionBankDialogProps) {
  const [programId, setProgramId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProgramId("");
    setCourseId("");
    setName("");
    setDescription("");
    setError(null);
  }, [open]);

  const courses = useMemo(() => {
    const program = programs.find((p) => p.id === programId);
    if (!program) return [];
    return (program.modules ?? []).flatMap((mod) =>
      (mod.courses ?? []).map((course) => ({
        id: course.id,
        name: course.name,
        moduleName: mod.name,
      })),
    );
  }, [programs, programId]);

  useEffect(() => {
    if (courseId && !courses.some((c) => c.id === courseId)) {
      setCourseId("");
    }
  }, [courses, courseId]);

  async function handleSubmit() {
    if (!courseId) {
      setError("Vui lòng chọn khóa học.");
      return;
    }
    if (!name.trim()) {
      setError("Vui lòng nhập tên ngân hàng đề.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createQuestionBank({
        courseId,
        name: name.trim(),
        description: description.trim() || null,
      });
      if (!result?.data) {
        throw new Error("Create question bank returned empty data.");
      }
      showAppSuccess({
        title: "Tạo thành công",
        description: `Đã tạo ngân hàng "${name.trim()}".`,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.questionBank.save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo ngân hàng câu hỏi</DialogTitle>
          <DialogDescription>
            Chọn khóa học rồi đặt tên ngân hàng đề. Có thể import CSV sau trong
            khung chương trình.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Chương trình <span className="text-primary">*</span>
            </Label>
            <Select
              value={programId || "none"}
              onValueChange={(v) => {
                setProgramId(!v || v === "none" ? "" : v);
                setCourseId("");
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
            <Label className="text-sm font-semibold text-foreground">
              Khóa học <span className="text-primary">*</span>
            </Label>
            <Select
              value={courseId || "none"}
              onValueChange={(v) => setCourseId(!v || v === "none" ? "" : v)}
              disabled={!programId}
            >
              <SelectTrigger
                className={cn(LIGHT_SELECT_TRIGGER, "w-full", !programId && "opacity-60")}
              >
                <span className="truncate">
                  {courses.find((c) => c.id === courseId)?.name ||
                    (programId ? "Chọn khóa học" : "Chọn chương trình trước")}
                </span>
              </SelectTrigger>
              <SelectContent className={LIGHT_SELECT_CONTENT}>
                <SelectItem value="none" className={LIGHT_SELECT_ITEM}>
                  {programId ? "Chọn khóa học" : "Chọn chương trình trước"}
                </SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id} className={LIGHT_SELECT_ITEM}>
                    {c.name}
                    <span className="text-muted-foreground"> · {c.moduleName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Tên ngân hàng <span className="text-primary">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Ngân hàng đề Chương 1"
              className="h-10 rounded-lg border-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">Mô tả</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn (tùy chọn)"
              className="h-10 rounded-lg border-input"
            />
          </div>

          {error ? (
            <p className="text-xs font-semibold text-primary">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="gap-2 rounded-lg bg-primary font-semibold text-white hover:bg-primary/90"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Đang tạo..." : "Tạo ngân hàng"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
