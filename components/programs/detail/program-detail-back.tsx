"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProgramDetailBackProps = {
  className?: string;
};

export function ProgramDetailBack({ className }: ProgramDetailBackProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/#programs");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-2 h-9 gap-1.5 px-2 text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
        className,
      )}
      onClick={handleBack}
      aria-label="Quay lại"
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden />
      Quay lại
    </Button>
  );
}
