"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Link2,
  Loader2,
  Send,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  checkoutPayment,
  getParentLinks,
  requestParentPayment,
  type ParentLinkedStudent,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { getProgramPriceParts } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type PaymentStep = "choose" | "parent";

type ProgramEnrollPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  price: number;
};

const STEP_EASE = "motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]";

function getParentDisplayName(parent: ParentLinkedStudent): string {
  if (parent.fullName?.trim()) return parent.fullName.trim();
  const local = parent.email.split("@")[0] ?? "PH";
  return local.replace(/[._-]/g, " ");
}

function getParentInitials(parent: ParentLinkedStudent): string {
  const name = getParentDisplayName(parent);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function PaymentStepPanel({
  active,
  from,
  children,
}: {
  active: boolean;
  from: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden={!active}
      inert={!active ? true : undefined}
      className={cn(
        "motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-reduce:transition-none",
        STEP_EASE,
        active
          ? "relative translate-x-0 opacity-100"
          : cn(
              "pointer-events-none absolute inset-x-0 top-0 opacity-0",
              from === "right" ? "translate-x-6" : "-translate-x-6",
            ),
      )}
    >
      {children}
    </div>
  );
}

function PaymentOptionTile({
  title,
  hint,
  icon: Icon,
  onClick,
  disabled,
}: {
  title: string;
  hint: string;
  icon: typeof CreditCard;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full flex-col items-center gap-3 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-4 py-5 text-center",
        "motion-safe:transition-[border-color,background-color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none",
        "hover:border-[#4FC3F7]/45 hover:bg-white hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
        "motion-safe:active:scale-[0.98]",
        disabled &&
          "cursor-not-allowed opacity-60 hover:border-[#E5E5E0] hover:bg-[#FAFAF5] hover:shadow-none",
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-white text-[#4FC3F7] ring-1 ring-[#E5E5E0] transition-colors group-hover:ring-[#4FC3F7]/30">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-heading text-sm font-semibold text-[#2D2D2D]">
          {title}
        </span>
        <span className="text-xs leading-snug text-[#6B6B6B]">{hint}</span>
      </span>
    </button>
  );
}

function ParentPaymentRow({
  parent,
  isSending,
  onSend,
}: {
  parent: ParentLinkedStudent;
  isSending: boolean;
  onSend: () => void;
}) {
  const displayName = getParentDisplayName(parent);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-3 py-3">
      <Avatar className="size-10 shrink-0">
        {parent.avatarUrl ? (
          <AvatarImage src={parent.avatarUrl} alt={displayName} />
        ) : null}
        <AvatarFallback className="bg-[#E94B3C]/10 text-xs font-semibold text-[#E94B3C]">
          {getParentInitials(parent)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight text-[#2D2D2D]">
          {displayName}
        </p>
        <p className="truncate text-xs text-[#6B6B6B]">{parent.email}</p>
      </div>
      <Button
        type="button"
        size="sm"
        className="shrink-0 gap-1.5 font-semibold"
        disabled={isSending}
        onClick={onSend}
      >
        {isSending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Send className="size-4" aria-hidden />
        )}
        Gửi
      </Button>
    </li>
  );
}

function ParentListSkeleton() {
  return (
    <div className="space-y-2.5" aria-hidden>
      <div className="h-16 animate-pulse rounded-xl bg-[#E5E5E0]/80" />
      <div className="h-16 animate-pulse rounded-xl bg-[#E5E5E0]/80" />
    </div>
  );
}

export function ProgramEnrollPaymentDialog({
  open,
  onOpenChange,
  programId,
  price,
}: ProgramEnrollPaymentDialogProps) {
  const priceParts = getProgramPriceParts(price);
  const priceLabel = priceParts.isFree
    ? priceParts.label
    : `${priceParts.amount} ${priceParts.unit}`;

  const [step, setStep] = useState<PaymentStep>("choose");
  const [panelFrom, setPanelFrom] = useState<"left" | "right">("right");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [parents, setParents] = useState<ParentLinkedStudent[]>([]);
  const [parentsLoadState, setParentsLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [sendingParentId, setSendingParentId] = useState<string | null>(null);

  const verifiedParents = parents.filter((parent) => parent.isVerified);

  const resetDialog = useCallback(() => {
    setStep("choose");
    setPanelFrom("right");
    setIsCheckingOut(false);
    setSendingParentId(null);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetDialog();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetDialog],
  );

  const goToChoose = useCallback(() => {
    setPanelFrom("left");
    setStep("choose");
  }, []);

  const goToParent = useCallback(() => {
    setPanelFrom("right");
    setStep("parent");
  }, []);

  const loadParents = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!open || step !== "parent") return;
    if (parentsLoadState === "idle") {
      void loadParents();
    }
  }, [open, step, parentsLoadState, loadParents]);

  const handleDirectCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const result = await checkoutPayment({
        programId,
        gateway: "Stripe",
      });
      const checkoutUrl = result?.data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error("Không nhận được liên kết thanh toán.");
      }
      window.location.href = checkoutUrl;
    } catch (error) {
      setIsCheckingOut(false);
      showAppErrorFromUnknown(error, "payments.checkout");
    }
  };

  const handleSendToParent = async (parent: ParentLinkedStudent) => {
    setSendingParentId(parent.linkedUserId);
    try {
      const result = await requestParentPayment({
        programId,
        parentId: parent.linkedUserId,
      });
      showAppSuccess({
        title: "Đã gửi yêu cầu thanh toán",
        description:
          result?.message?.trim() ||
          `Email thanh toán đã gửi tới ${parent.email}. Phụ huynh có 24 giờ để hoàn tất.`,
      });
      handleOpenChange(false);
    } catch (error) {
      showAppErrorFromUnknown(error, "payments.request-parent");
    } finally {
      setSendingParentId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="relative border-b border-[#E5E5E0] px-6 pb-4 pt-5">
          <DialogClose className="top-4 right-4" />

          <div className="flex items-start gap-2 pr-8">
            {step === "parent" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 shrink-0 text-[#6B6B6B] hover:text-[#2D2D2D]"
                aria-label="Quay lại"
                onClick={goToChoose}
              >
                <ArrowLeft className="size-4" aria-hidden />
              </Button>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-semibold leading-snug">
                  {step === "choose" ? "Thanh toán" : "Gửi phụ huynh"}
                </DialogTitle>
                {step === "choose" ? (
                  <span className="shrink-0 rounded-full bg-[#E94B3C]/10 px-2.5 py-1 text-xs font-semibold text-[#E94B3C]">
                    {priceLabel}
                  </span>
                ) : null}
              </div>
              <DialogDescription className="mt-1.5 text-sm leading-relaxed">
                {step === "choose"
                  ? "Chọn cách thanh toán phù hợp."
                  : "Email có hiệu lực 24 giờ."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="relative px-6 py-5">
          <PaymentStepPanel active={step === "choose"} from={panelFrom}>
            <div className="grid grid-cols-2 gap-3">
              <PaymentOptionTile
                title="Tự thanh toán"
                hint="Stripe · ngay lập tức"
                icon={CreditCard}
                disabled={isCheckingOut}
                onClick={() => void handleDirectCheckout()}
              />
              <PaymentOptionTile
                title="Nhờ phụ huynh"
                hint="Gửi email yêu cầu"
                icon={Users}
                disabled={isCheckingOut}
                onClick={goToParent}
              />
            </div>

            {isCheckingOut ? (
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#6B6B6B]">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Đang chuyển đến Stripe…
              </p>
            ) : null}
          </PaymentStepPanel>

          <PaymentStepPanel active={step === "parent"} from={panelFrom}>
            {parentsLoadState === "loading" ? (
              <ParentListSkeleton />
            ) : parentsLoadState === "error" ? (
              <div className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-4 py-5 text-center">
                <p className="text-sm text-[#6B6B6B]">
                  Không tải được danh sách phụ huynh.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 border-[#E5E5E0]"
                  onClick={() => void loadParents()}
                >
                  Thử lại
                </Button>
              </div>
            ) : verifiedParents.length > 0 ? (
              <ul className="max-h-[280px] space-y-2 overflow-y-auto pr-0.5">
                {verifiedParents.map((parent) => (
                  <ParentPaymentRow
                    key={parent.linkedUserId}
                    parent={parent}
                    isSending={sendingParentId === parent.linkedUserId}
                    onSend={() => void handleSendToParent(parent)}
                  />
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-[#E5E5E0] bg-[#FAFAF5] px-4 py-5 text-center">
                <Link2
                  className="mx-auto size-8 text-[#E94B3C]/70"
                  aria-hidden
                />
                <p className="mt-2 font-heading text-sm font-semibold text-[#2D2D2D]">
                  Chưa có phụ huynh sẵn sàng
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6B6B6B]">
                  {parents.length > 0
                    ? "Phụ huynh cần xác nhận liên kết trước."
                    : "Liên kết phụ huynh trong hồ sơ cá nhân."}
                </p>
                {parents.some((parent) => !parent.isVerified) ? (
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {parents
                      .filter((parent) => !parent.isVerified)
                      .map((parent) => (
                        <Badge
                          key={parent.linkedUserId}
                          variant="secondary"
                          className="bg-[#FDD835]/20 px-2 py-0.5 text-xs text-[#6b5a00]"
                        >
                          {getParentDisplayName(parent)} · chờ xác nhận
                        </Badge>
                      ))}
                  </div>
                ) : null}
                <Link
                  href="/profile"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "mt-4 font-semibold",
                  )}
                >
                  Mở hồ sơ cá nhân
                </Link>
              </div>
            )}
          </PaymentStepPanel>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
