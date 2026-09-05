"use client";

import { useProgramEnrollmentLookup } from "./program-enrollment-lookup";
import { ProgramOpenClassesPreview } from "./program-open-classes-preview";

type ProgramOpenClassesSectionProps = {
  programId: string;
};

/** Hides first-purchase open-classes when the student should use rebuy catalog. */
export function ProgramOpenClassesSection({
  programId,
}: ProgramOpenClassesSectionProps) {
  const { enrollment, isLoading } = useProgramEnrollmentLookup();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#E5E5E0] bg-white p-6 shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <div className="h-24 animate-pulse rounded-lg bg-[#E5E5E0]/70" aria-hidden />
      </div>
    );
  }

  if (
    enrollment?.status === "Failed" ||
    enrollment?.status === "Dropped"
  ) {
    return (
      <div className="rounded-xl border border-[#E5E5E0] bg-white p-6 shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <h3 className="font-heading text-lg font-semibold text-[#2D2D2D]">
          Đăng ký lại chương trình
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">
          Ghi danh trước đã kết thúc. Dùng nút{" "}
          <span className="font-semibold text-[#2D2D2D]">Đăng ký lại</span> để
          xem lớp phù hợp và phí thanh toán (50% trong 1 tháng; sau đó giá đầy
          đủ, chỉ lớp Open).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E5E0] bg-white p-6 shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      <ProgramOpenClassesPreview programId={programId} />
    </div>
  );
}
