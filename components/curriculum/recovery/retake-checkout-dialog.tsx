"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Link2, Loader2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  checkoutRetakePayment,
  getParentLinks,
  requestParentRetakePayment,
  type ParentLinkedStudent,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type RetakeCheckoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retakeModuleEnrollmentId: string;
};

type Step = "choose" | "parent";

function getParentDisplayName(parent: ParentLinkedStudent): string {
  return parent.fullName?.trim() || parent.email || "Phụ huynh";
}

export function RetakeCheckoutDialog({
  open,
  onOpenChange,
  retakeModuleEnrollmentId,
}: RetakeCheckoutDialogProps) {
  const [step, setStep] = useState<Step>("choose");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [parents, setParents] = useState<ParentLinkedStudent[]>([]);
  const [parentsLoadState, setParentsLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [sendingParentId, setSendingParentId] = useState<string | null>(null);

  function reset() {
    setStep("choose");
    setIsCheckingOut(false);
    setSendingParentId(null);
    setParentsLoadState("idle");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function loadParents() {
    setParentsLoadState("loading");
    try {
      const result = await getParentLinks();
      setParents(result?.data ?? []);
      setParentsLoadState("ready");
    } catch (error) {
      setParents([]);
      setParentsLoadState("error");
      showAppErrorFromUnknown(error, "student.links");
    }
  }

  async function handleDirectCheckout() {
    setIsCheckingOut(true);
    try {
      const result = await checkoutRetakePayment({
        moduleEnrollmentId: retakeModuleEnrollmentId,
        gateway: "Stripe",
      });
      const checkoutUrl = result?.data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error("Không nhận được liên kết thanh toán.");
      }
      window.location.href = checkoutUrl;
    } catch (error) {
      setIsCheckingOut(false);
      showAppErrorFromUnknown(error, "payments.checkout-retake");
    }
  }

  async function handleSendToParent(parent: ParentLinkedStudent) {
    setSendingParentId(parent.linkedUserId);
    try {
      const result = await requestParentRetakePayment({
        moduleEnrollmentId: retakeModuleEnrollmentId,
        parentId: parent.linkedUserId,
      });
      showAppSuccess({
        title: "Đã gửi yêu cầu thanh toán học lại",
        description:
          result?.message?.trim() ||
          `Email thanh toán đã gửi tới ${parent.email}.`,
      });
      handleOpenChange(false);
    } catch (error) {
      showAppErrorFromUnknown(error, "payments.request-parent-retake");
    } finally {
      setSendingParentId(null);
    }
  }

  const verifiedParents = parents.filter((parent) => parent.isVerified);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="relative border-b border-learn-border px-6 pb-4 pt-5">
          <DialogClose className="top-4 right-4" />
          <div className="flex items-start gap-2 pr-8">
            {step === "parent" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 shrink-0"
                aria-label="Quay lại"
                onClick={() => setStep("choose")}
              >
                <ArrowLeft className="size-4" aria-hidden />
              </Button>
            ) : null}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold">
                {step === "choose" ? "Thanh toán học lại" : "Gửi phụ huynh"}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm">
                {step === "choose"
                  ? "Thanh toán phí học lại module để chuyển sang lớp mới."
                  : "Email có hiệu lực 24 giờ."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {step === "choose" ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={() => void handleDirectCheckout()}
                className="flex flex-col items-start gap-2 rounded-xl border border-learn-border bg-learn-surface-2/60 p-4 text-left transition hover:border-learn-primary/40 disabled:opacity-60"
              >
                <CreditCard className="size-5 text-learn-primary" aria-hidden />
                <span className="font-heading text-sm font-semibold text-learn-text-strong">
                  Tự thanh toán
                </span>
                <span className="text-xs text-learn-muted">Stripe · ngay</span>
              </button>
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={() => {
                  setStep("parent");
                  if (parentsLoadState === "idle") void loadParents();
                }}
                className="flex flex-col items-start gap-2 rounded-xl border border-learn-border bg-learn-surface-2/60 p-4 text-left transition hover:border-learn-primary/40 disabled:opacity-60"
              >
                <Users className="size-5 text-learn-primary" aria-hidden />
                <span className="font-heading text-sm font-semibold text-learn-text-strong">
                  Nhờ phụ huynh
                </span>
                <span className="text-xs text-learn-muted">Gửi email</span>
              </button>
              {isCheckingOut ? (
                <p className="col-span-2 flex items-center justify-center gap-2 text-xs text-learn-muted">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Đang chuyển đến Stripe…
                </p>
              ) : null}
            </div>
          ) : parentsLoadState === "loading" ? (
            <div className="space-y-2">
              <div className="h-12 animate-pulse rounded-xl bg-learn-surface-2" />
              <div className="h-12 animate-pulse rounded-xl bg-learn-surface-2" />
            </div>
          ) : parentsLoadState === "error" ? (
            <div className="rounded-xl border border-learn-border px-4 py-5 text-center">
              <p className="text-sm text-learn-muted">Không tải được phụ huynh.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void loadParents()}
              >
                Thử lại
              </Button>
            </div>
          ) : verifiedParents.length > 0 ? (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto">
              {verifiedParents.map((parent) => (
                <li key={parent.linkedUserId}>
                  <button
                    type="button"
                    disabled={sendingParentId != null}
                    onClick={() => void handleSendToParent(parent)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-learn-border px-3 py-2.5 text-left hover:bg-learn-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-learn-text-strong">
                        {getParentDisplayName(parent)}
                      </span>
                      <span className="block truncate text-xs text-learn-muted">
                        {parent.email}
                      </span>
                    </span>
                    {sendingParentId === parent.linkedUserId ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Badge variant="secondary">Gửi</Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-learn-border px-4 py-5 text-center">
              <Link2 className="mx-auto size-8 text-learn-primary/70" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-learn-text-strong">
                Chưa có phụ huynh sẵn sàng
              </p>
              <Link
                href="/profile"
                className={cn(buttonVariants({ size: "sm" }), "mt-4 font-semibold")}
              >
                Mở hồ sơ cá nhân
              </Link>
            </div>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  );
}
