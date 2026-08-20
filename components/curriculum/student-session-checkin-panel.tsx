"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentSessionCheckin } from "@/lib/api/class-sessions";
import type { SessionAttendanceStatus } from "@/lib/api/entities/session-attendance";
import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/classes/constants";
import { showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type StudentSessionCheckinPanelProps = {
  sessionId: string;
  requireQrCheckin?: boolean;
  initialStatus?: SessionAttendanceStatus | null;
  onCheckedIn?: (status: SessionAttendanceStatus) => void;
  className?: string;
};

export function StudentSessionCheckinPanel({
  sessionId,
  requireQrCheckin = false,
  initialStatus = null,
  onCheckedIn,
  className,
}: StudentSessionCheckinPanelProps) {
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<"code" | "token">("code");
  const [status, setStatus] = useState<SessionAttendanceStatus | null>(
    initialStatus,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPresent =
    status === "Present" || status === "Late" || status === "Excused";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const body =
        mode === "code"
          ? { code: code.trim() }
          : { token: token.trim() };

      const result = await studentSessionCheckin(sessionId, body);
      const nextStatus = result?.data?.status ?? "Present";
      setStatus(nextStatus);
      onCheckedIn?.(nextStatus);
      showAppSuccess({
        title: "Check-in thành công",
        description: "Điểm danh của bạn đã được ghi nhận.",
      });
      setCode("");
      setToken("");
    } catch (error) {
      const message = extractCheckinErrorMessage(error);
      if (message) {
        setErrorMessage(message);
      } else {
        setErrorMessage("Không thể check-in. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPresent) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-learn-success/30 bg-learn-success/10 px-4 py-3",
          className,
        )}
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-learn-success" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-learn-success">Đã check-in</p>
          <p className="mt-0.5 text-xs text-learn-muted">
            Trạng thái: {status ? ATTENDANCE_STATUS_LABELS[status] : "Có mặt"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-4 rounded-xl border border-learn-border bg-learn-surface-2 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-learn-accent" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-learn-text-strong">
            Tự check-in buổi học
          </p>
          <p className="mt-0.5 text-xs text-learn-muted">
            {requireQrCheckin
              ? "Buổi này bắt buộc check-in QR — mentor sẽ không thể hoàn thành hoạt động nếu bạn chưa check-in."
              : "Nhập mã 6 số mentor đang hiển thị, hoặc dán token nếu bạn quét QR bằng app khác."}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "code" ? "default" : "outline"}
          onClick={() => setMode("code")}
          className="h-8 rounded-lg text-xs"
        >
          Mã 6 số
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "token" ? "default" : "outline"}
          onClick={() => setMode("token")}
          className="h-8 rounded-lg text-xs"
        >
          Token QR
        </Button>
      </div>

      {mode === "code" ? (
        <div className="space-y-1.5">
          <Label htmlFor="checkin-code">Mã check-in</Label>
          <Input
            id="checkin-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="h-11 font-mono text-lg tracking-[0.3em]"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="checkin-token">Token từ QR</Label>
          <Input
            id="checkin-token"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={token}
            onChange={(event) => setToken(event.target.value.trim())}
            className="h-11 font-mono text-sm"
          />
        </div>
      )}

      {errorMessage ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={
          isSubmitting ||
          (mode === "code" ? code.trim().length === 0 : token.trim().length === 0)
        }
        className="h-11 w-full rounded-xl bg-learn-accent font-semibold text-white hover:opacity-90"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Đang check-in...
          </>
        ) : (
          "Xác nhận check-in"
        )}
      </Button>
    </form>
  );
}

function extractCheckinErrorMessage(error: unknown): string | null {
  if (error instanceof ApiResponseError) {
    return error.message?.trim() || null;
  }
  if (error instanceof ApiRequestError) {
    const body = error.body as { error?: { message?: string } } | null;
    return body?.error?.message?.trim() || null;
  }
  return null;
}
