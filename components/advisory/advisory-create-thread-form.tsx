"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdvisoryTargetType, AdvisoryThreadType } from "@/lib/api";
import { ADVISORY_THREAD_TYPE_LABELS } from "@/lib/expert/advisory-labels";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";

export type AdvisoryThreadTarget = {
  targetType: AdvisoryTargetType;
  targetId: string | null;
  targetLabel: string;
  targetContext?: string;
};

type AdvisoryCreateThreadFormProps = {
  targets: AdvisoryThreadTarget[];
  defaultTarget?: AdvisoryThreadTarget | null;
  canCreateRequiredChange: boolean;
  submissionId?: string | null;
  isSubmitting?: boolean;
  onSubmit: (input: {
    targetType: AdvisoryTargetType;
    targetId: string | null;
    type: AdvisoryThreadType;
    message: string;
    submissionId?: string | null;
  }) => Promise<void>;
  onCancel?: () => void;
};

export function AdvisoryCreateThreadForm({
  targets,
  defaultTarget = null,
  canCreateRequiredChange,
  submissionId = null,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: AdvisoryCreateThreadFormProps) {
  const initialTarget = defaultTarget ?? targets[0] ?? null;
  const [targetKey, setTargetKey] = useState(
    initialTarget
      ? `${initialTarget.targetType}:${initialTarget.targetId ?? "program"}`
      : "Program:program",
  );
  const [threadType, setThreadType] = useState<AdvisoryThreadType>("Suggestion");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedTarget =
    targets.find(
      (t) => `${t.targetType}:${t.targetId ?? "program"}` === targetKey,
    ) ?? initialTarget;

  const threadTypeOptions: AdvisoryThreadType[] = canCreateRequiredChange
    ? ["Suggestion", "RequiredChange"]
    : ["Suggestion"];

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Vui lòng nhập nội dung góp ý.");
      return;
    }
    if (!selectedTarget) {
      setError("Vui lòng chọn đối tượng góp ý.");
      return;
    }
    setError(null);
    await onSubmit({
      targetType: selectedTarget.targetType,
      targetId: selectedTarget.targetId,
      type: threadType,
      message: trimmed,
      submissionId,
    });
    setMessage("");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="size-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Tạo luồng góp ý</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Đối tượng</Label>
          <Select
            value={targetKey}
            onValueChange={(value) => setTargetKey(value ?? "")}
          >
            <SelectTrigger className={THEME_SELECT_TRIGGER}>
              {selectedTarget?.targetLabel ?? "Chọn đối tượng"}
            </SelectTrigger>
            <SelectContent className={THEME_SELECT_CONTENT}>
              {targets.map((target) => {
                const key = `${target.targetType}:${target.targetId ?? "program"}`;
                return (
                  <SelectItem key={key} value={key} className={THEME_SELECT_ITEM}>
                    {target.targetLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Loại góp ý</Label>
          <Select
            value={threadType}
            onValueChange={(v) => {
              if (v) setThreadType(v as AdvisoryThreadType);
            }}
          >
            <SelectTrigger className={THEME_SELECT_TRIGGER}>
              {ADVISORY_THREAD_TYPE_LABELS[threadType]}
            </SelectTrigger>
            <SelectContent className={THEME_SELECT_CONTENT}>
              {threadTypeOptions.map((type) => (
                <SelectItem key={type} value={type} className={THEME_SELECT_ITEM}>
                  {ADVISORY_THREAD_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="advisory-thread-message">Nội dung</Label>
        <Textarea
          id="advisory-thread-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mô tả góp ý hoặc yêu cầu chỉnh sửa cụ thể…"
          disabled={isSubmitting}
          className="rounded-xl border-input bg-background"
        />
      </div>

      {error ? (
        <p className="text-xs font-medium text-primary">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="h-10 rounded-xl bg-primary px-4 font-semibold text-white"
        >
          {isSubmitting ? "Đang gửi…" : "Gửi góp ý"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 rounded-xl"
          >
            Hủy
          </Button>
        ) : null}
      </div>
    </div>
  );
}
