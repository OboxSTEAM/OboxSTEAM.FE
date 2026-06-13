import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { PaymentSuccessPageContent } from "@/components/payment/payment-success-page-content";

export const metadata: Metadata = {
  title: "Thanh toán thành công — OboxSTEAM",
  robots: { index: false, follow: false },
};

function PaymentSuccessFallback() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-14 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-4 w-32 rounded bg-[#E5E5E0]" />
          <div className="h-10 w-72 rounded-lg bg-[#E5E5E0]" />
          <div className="aspect-[4/3] rounded-2xl bg-[#E5E5E0]" />
        </div>
        <div className="h-[28rem] rounded-2xl bg-[#E5E5E0]" />
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-[4.5rem] sm:pt-20">
        <Suspense fallback={<PaymentSuccessFallback />}>
          <PaymentSuccessPageContent />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
