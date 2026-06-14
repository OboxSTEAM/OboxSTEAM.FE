"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parentCheckout } from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { parentCheckoutLinkParamsSchema } from "@/lib/validations/payments";

type FlowState = "loading" | "redirecting" | "error";

export function ParentCheckoutPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const parsed = useMemo(() => {
    try {
      return parentCheckoutLinkParamsSchema.parse({ token });
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!parsed || hasStartedRef.current) return;
    hasStartedRef.current = true;

    (async () => {
      try {
        setFlowState("redirecting");
        const result = await parentCheckout({
          token: parsed.token,
          gateway: "Stripe",
        });
        const checkoutUrl = result?.data?.checkoutUrl;
        if (!checkoutUrl) {
          throw new Error("Không nhận được liên kết thanh toán.");
        }
        window.location.href = checkoutUrl;
      } catch (error) {
        setFlowState("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Yêu cầu thất bại.",
        );
        showAppErrorFromUnknown(error, "payments.parent-checkout");
      }
    })();
  }, [parsed]);

  if (!parsed) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
        <Card className="border-[#E5E5E0] bg-white shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl text-[#2D2D2D]">
              Liên kết không hợp lệ
            </CardTitle>
            <CardDescription className="text-[#6B6B6B]">
              Thiếu mã thanh toán trên URL. Mở lại liên kết từ email phụ huynh.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link
              href="/#programs"
              className={cn(buttonVariants(), "font-semibold")}
            >
              Xem chương trình
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="border-[#E5E5E0] bg-white shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-[#4FC3F7]/15 text-[#4FC3F7]">
            <Loader2 className="size-7 animate-spin" aria-hidden />
          </div>
          <CardTitle className="font-heading text-2xl text-[#2D2D2D]">
            {flowState === "error"
              ? "Không thể thanh toán"
              : "Đang chuyển đến Stripe…"}
          </CardTitle>
          <CardDescription className="text-[#6B6B6B]">
            {flowState === "error"
              ? errorMessage ??
                "Liên kết có thể đã hết hạn. Nhờ học viên gửi lại yêu cầu."
              : "Vui lòng đợi — trang thanh toán an toàn sẽ mở trong giây lát."}
          </CardDescription>
        </CardHeader>
        {flowState === "error" ? (
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/#programs"
              className={cn(buttonVariants(), "font-semibold")}
            >
              Xem chương trình
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-[#E5E5E0]",
              )}
            >
              Đăng nhập
            </Link>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
