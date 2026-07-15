import type { CertificateDetail } from "@/lib/api/entities/certificate";
import { formatCertificateDate } from "@/lib/certificates/format";
import { cn } from "@/lib/utils";

type CertificateVisualProps = {
  certificate: CertificateDetail;
  className?: string;
};

export function CertificateVisual({
  certificate,
  className,
}: CertificateVisualProps) {
  const studentName = certificate.student.fullName?.trim() || "Học viên";
  const programName = certificate.program.name?.trim() || "Chương trình STEAM";
  const issuer = certificate.issuerName?.trim() || "OboxSTEAM";
  const issueDate = formatCertificateDate(certificate.issueDate);
  const code = certificate.code?.trim();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_4px_24px_rgba(45,45,45,0.08)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5"
        style={{
          background:
            "linear-gradient(90deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-[0.12]"
        style={{
          background:
            "linear-gradient(135deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)",
        }}
      />

      <div className="flex min-h-[22rem] flex-col px-6 py-8 sm:px-8 sm:py-10">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#6B6B6B]">
          Chứng chỉ hoàn thành
        </p>
        <p className="font-heading mt-2 text-sm font-semibold text-[#E94B3C]">
          {issuer}
        </p>

        <div className="mt-8 flex flex-1 flex-col justify-center space-y-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
            Chứng nhận
          </p>
          <p className="font-heading text-2xl font-extrabold tracking-tight text-[#2D2D2D] sm:text-3xl">
            {studentName}
          </p>
          <p className="text-sm leading-relaxed text-[#6B6B6B]">
            đã hoàn thành chương trình
          </p>
          <p className="font-heading text-lg font-bold leading-snug text-[#2D2D2D] sm:text-xl">
            {programName}
          </p>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4 border-t border-[#E5E5E0] pt-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">
              Ngày cấp
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#2D2D2D]">
              {issueDate}
            </p>
          </div>
          {code ? (
            <div className="min-w-0 text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">
                Xác minh tại
              </p>
              <p className="mt-0.5 truncate font-mono text-xs font-medium text-[#4FC3F7]">
                {code}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
