"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Loader2, QrCode, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogScrollBody,
  DialogScrollHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createSessionCheckinToken,
  type SessionCheckinToken,
} from "@/lib/api/class-sessions";
import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";
import { showAppErrorFromUnknown, translateApiMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const REFRESH_BEFORE_EXPIRY_MS = 1_500;

type SessionCheckinQrDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionTitle?: string | null;
};

function getRemainingMs(expiresAt: string, now: number): number {
  const expires = Date.parse(expiresAt);
  if (Number.isNaN(expires)) return 0;
  return Math.max(0, expires - now);
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  return `${totalSeconds}s`;
}

export function SessionCheckinQrDialog({
  open,
  onOpenChange,
  sessionId,
  sessionTitle,
}: SessionCheckinQrDialogProps) {
  const [tokenData, setTokenData] = useState<SessionCheckinToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const refreshTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const fetchTokenRef = useRef<(isAutoRefresh?: boolean) => Promise<void>>(
    async () => {},
  );

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current != null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (expiresAt: string) => {
      clearRefreshTimer();
      const delay = Math.max(
        0,
        getRemainingMs(expiresAt, Date.now()) - REFRESH_BEFORE_EXPIRY_MS,
      );
      refreshTimerRef.current = window.setTimeout(() => {
        void fetchTokenRef.current(true);
      }, delay);
    },
    [clearRefreshTimer],
  );

  const fetchToken = useCallback(
    async (isAutoRefresh = false) => {
      if (!sessionId) return;
      if (!isAutoRefresh) {
        setIsLoading(true);
        setErrorMessage(null);
      }

      try {
        const result = await createSessionCheckinToken(sessionId);
        const next = result?.data;
        if (!next || !isMountedRef.current) return;
        setTokenData(next);
        setErrorMessage(null);
        scheduleRefresh(next.expiresAt);
      } catch (error) {
        if (!isMountedRef.current) return;
        const apiMessage = extractCheckinTokenErrorMessage(error);
        if (apiMessage) {
          setErrorMessage(apiMessage);
        } else {
          showAppErrorFromUnknown(error, "classSessions.checkinToken");
        }
        setTokenData(null);
      } finally {
        if (isMountedRef.current && !isAutoRefresh) {
          setIsLoading(false);
        }
      }
    },
    [scheduleRefresh, sessionId],
  );

  fetchTokenRef.current = fetchToken;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearRefreshTimer();
    };
  }, [clearRefreshTimer]);

  useEffect(() => {
    if (!open) {
      clearRefreshTimer();
      setTokenData(null);
      setErrorMessage(null);
      setRemainingMs(0);
      return;
    }
    void fetchToken(false);
  }, [clearRefreshTimer, fetchToken, open]);

  useEffect(() => {
    if (!open || !tokenData?.expiresAt) return;
    const tick = () => {
      setRemainingMs(getRemainingMs(tokenData.expiresAt, Date.now()));
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [open, tokenData?.expiresAt]);

  const isExpired = tokenData != null && remainingMs <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogScrollHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" aria-hidden />
            Mã QR check-in
          </DialogTitle>
          <DialogDescription>
            {sessionTitle?.trim()
              ? `Buổi “${sessionTitle.trim()}” — mã làm mới mỗi 60 giây.`
              : "Mã QR làm mới mỗi 60 giây. Học viên quét token hoặc nhập mã 6 số."}
          </DialogDescription>
        </DialogScrollHeader>
        <DialogClose />

        <DialogScrollBody className="space-y-4">
          {isLoading && !tokenData ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
            </div>
          ) : errorMessage ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : tokenData ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <div
                  className={cn(
                    "rounded-2xl border bg-white p-4 shadow-sm",
                    isExpired ? "opacity-40" : undefined,
                  )}
                >
                  <QRCode value={tokenData.token} size={208} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Mã nhập tay (web)
                  </p>
                  <p className="mt-1 font-mono text-4xl font-bold tracking-[0.35em] text-foreground">
                    {tokenData.code}
                  </p>
                </div>
                <p
                  className={cn(
                    "font-mono text-sm tabular-nums",
                    remainingMs <= 5_000 ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-live="polite"
                >
                  Hết hạn sau {formatCountdown(remainingMs)}
                </p>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Mỗi lần mở sẽ tạo mã mới và vô hiệu mã cũ ngay lập tức.
              </p>
            </>
          ) : null}
        </DialogScrollBody>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => void fetchToken(false)}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} aria-hidden />
            Làm mới ngay
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

function extractCheckinTokenErrorMessage(error: unknown): string | null {
  if (error instanceof ApiResponseError) {
    return translateApiMessage(error.message);
  }
  if (error instanceof ApiRequestError) {
    const body = error.body as { error?: { message?: string } } | null;
    return translateApiMessage(body?.error?.message);
  }
  return null;
}
