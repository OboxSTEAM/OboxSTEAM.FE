"use client";

import { Download, Share2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type CertificateActionsProps = {
  shareUrl: string;
  pdfUrl: string | null;
  className?: string;
};

export function CertificateActions({
  shareUrl,
  pdfUrl,
  className,
}: CertificateActionsProps) {
  async function handleShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showAppSuccess({
        title: "Đã sao chép liên kết",
        description: "Bạn có thể chia sẻ liên kết xác minh chứng chỉ này.",
      });
    } catch {
      showAppSuccess({
        title: "Liên kết chứng chỉ",
        description: shareUrl,
      });
    }
  }

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      <Button
        type="button"
        className="inline-flex flex-1 gap-2 font-semibold"
        onClick={handleShare}
      >
        <Share2 className="size-4" aria-hidden />
        Chia sẻ chứng chỉ
      </Button>
      {pdfUrl ? (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex flex-1 gap-2 border-[#4FC3F7]/50 font-semibold text-[#1565c0] hover:bg-[#E8F7FD]",
          )}
        >
          <Download className="size-4" aria-hidden />
          Tải chứng chỉ
        </a>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled
          className="inline-flex flex-1 gap-2 border-[#E5E5E0] font-semibold"
        >
          <Download className="size-4" aria-hidden />
          Đang xử lý PDF
        </Button>
      )}
    </div>
  );
}
