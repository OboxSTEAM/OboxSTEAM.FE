import type { Metadata } from "next";
import type { ReactNode } from "react";

export default function PublicPortfolioLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF5] text-[#2D2D2D]">{children}</div>
  );
}

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};
