import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PaymentIllustration } from "./payment-illustration";

type PaymentPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  illustrationSrc: string;
  illustrationAlt: string;
  children: ReactNode;
  className?: string;
};

export function PaymentPageShell({
  eyebrow,
  title,
  description,
  illustrationSrc,
  illustrationAlt,
  children,
  className,
}: PaymentPageShellProps) {
  return (
    <div className={cn("mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14", className)}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
        <aside className="space-y-6 lg:sticky lg:top-24">
          <header className="space-y-2 text-center lg:text-left">
            <p className="text-sm font-medium text-[#E94B3C]">{eyebrow}</p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-[#6B6B6B] lg:max-w-none">
              {description}
            </p>
          </header>

          <PaymentIllustration
            src={illustrationSrc}
            alt={illustrationAlt}
            priority
            className="lg:max-w-none"
          />
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
