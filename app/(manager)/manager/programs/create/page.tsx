"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProgramForm } from "@/components/manager/programs/program-form";
import { createProgram } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

export default function CreateProgramPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const response = await createProgram(values);
      showAppSuccess({
        title: "Tạo thành công",
        description: response.message || `Chương trình ${values.name} đã được tạo thành công.`,
      });
      router.push("/manager/programs");
    } catch (err) {
      showAppErrorFromUnknown(err, "programs.create");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    // Trigger form submit with status = Draft via hidden button
    const btn = document.getElementById("__program-form-submit");
    if (btn) (btn as HTMLButtonElement).click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Sticky action bar (mimics reference header) ────────────── */}
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3.5">
          {/* Left: back + title */}
          <div className="flex items-center gap-3">
            <Link
              href="/manager/programs"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Danh sách chương trình
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <h1 className="text-base font-bold text-foreground">Tạo chương trình học mới</h1>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDraftSaving || isSubmitting}
              onClick={handleSaveDraft}
              className="h-9 gap-1.5 rounded-xl border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <Save className="size-3.5" />
              Lưu bản nháp
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || isDraftSaving}
              onClick={() => {
                const btn = document.getElementById("__program-form-submit");
                if (btn) (btn as HTMLButtonElement).click();
              }}
              className="h-9 gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <FileCheck className="size-3.5" />
              {isSubmitting ? "Đang tạo..." : "Tạo chương trình"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Form body ──────────────────────────────────────────────── */}
      <div className="flex-1 px-6 py-6 max-w-5xl">
        <ProgramForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
