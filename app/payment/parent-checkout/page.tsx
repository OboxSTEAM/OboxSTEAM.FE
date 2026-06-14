import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { ParentCheckoutPageContent } from "@/components/payment/parent-checkout-page-content";

export const metadata: Metadata = {
  title: "Thanh toán phụ huynh — OboxSTEAM",
  robots: { index: false, follow: false },
};

function ParentCheckoutFallback() {
  return (
    <div className="mx-auto max-w-lg animate-pulse px-4 py-16">
      <div className="h-56 rounded-xl bg-[#E5E5E0]" />
    </div>
  );
}

export default function ParentCheckoutPage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-[4.5rem] sm:pt-20">
        <Suspense fallback={<ParentCheckoutFallback />}>
          <ParentCheckoutPageContent />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
