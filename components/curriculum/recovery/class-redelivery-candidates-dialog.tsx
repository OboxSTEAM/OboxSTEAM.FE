"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getClassRedeliveryCandidates,
  selectClassRedeliveryRequest,
  type RebuyClassCatalog,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

import { ContinuityClassPickerDialog } from "./continuity-class-picker-dialog";

type ClassRedeliveryCandidatesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  onSelected: (checkoutAmount?: number) => void;
};

export function ClassRedeliveryCandidatesDialog({
  open,
  onOpenChange,
  requestId,
  onSelected,
}: ClassRedeliveryCandidatesDialogProps) {
  const [catalog, setCatalog] = useState<RebuyClassCatalog | null>(null);
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!open) {
      setCatalog(null);
      setLoadState("idle");
      setSelectingId(null);
      return;
    }

    let cancelled = false;
    setLoadState("loading");
    void getClassRedeliveryCandidates(requestId)
      .then((result) => {
        if (cancelled) return;
        setCatalog(result?.data ?? null);
        setLoadState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalog(null);
        setLoadState("error");
        showAppErrorFromUnknown(error, "class-redelivery.select");
      });

    return () => {
      cancelled = true;
    };
  }, [open, requestId, reloadKey]);

  async function handleSelect(classId: string) {
    setSelectingId(classId);
    try {
      await selectClassRedeliveryRequest(requestId, { classId });
      showAppSuccess({
        title: "Đã chọn lớp học lại",
        description: "Tiếp theo hãy thanh toán để hoàn tất chuyển lớp.",
      });
      onOpenChange(false);
      onSelected(catalog?.checkoutAmount);
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.select");
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <ContinuityClassPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      catalog={catalog}
      loadState={loadState}
      selectingId={selectingId}
      onSelect={(classId) => void handleSelect(classId)}
      onRetryLoad={load}
    />
  );
}
