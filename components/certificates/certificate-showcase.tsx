import Image from "next/image";
import { Check } from "lucide-react";

import { CertificateActions } from "@/components/certificates/certificate-actions";
import { CertificateVisual } from "@/components/certificates/certificate-visual";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CertificateDetail } from "@/lib/api/entities/certificate";
import {
  formatCertificateDate,
  resolveCertificateSkills,
} from "@/lib/certificates/format";
import { cn } from "@/lib/utils";

type CertificateShowcaseProps = {
  certificate: CertificateDetail;
  shareUrl: string;
  className?: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function CertificateShowcase({
  certificate,
  shareUrl,
  className,
}: CertificateShowcaseProps) {
  const studentName = certificate.student.fullName?.trim() || "Học viên";
  const programName = certificate.program.name?.trim() || "Chương trình STEAM";
  const issueDate = formatCertificateDate(certificate.issueDate);
  const duration = certificate.program.estimatedDuration?.trim();
  const description = certificate.program.description?.trim();
  const modules = [...(certificate.modules ?? [])].sort(
    (a, b) => a.moduleOrder - b.moduleOrder,
  );
  const outcomes = (certificate.learningOutcomes ?? []).filter(Boolean);
  const skills = resolveCertificateSkills(
    certificate.skillsGained,
    certificate.skillsAcquired,
  );
  const avatarUrl = certificate.student.avatarUrl?.trim() || null;
  const thumbnailUrl = certificate.program.thumbnailUrl?.trim() || null;

  return (
    <div
      className={cn(
        "mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14",
        className,
      )}
    >
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[#6B6B6B]">
              Chứng chỉ · Chuyên ngành
            </p>
            <h1 className="font-heading text-balance text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl">
              {programName}
            </h1>
          </header>

          <section className="rounded-2xl border border-[#4FC3F7]/30 bg-[#E8F7FD]/70 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3.5">
              <Avatar className="size-12 ring-2 ring-white">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={studentName} />
                ) : null}
                <AvatarFallback className="bg-[#4FC3F7] text-sm font-semibold text-white">
                  {getInitials(studentName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-base font-semibold text-[#2D2D2D]">
                  Hoàn thành bởi {studentName}
                </p>
                <p className="mt-1 text-sm text-[#6B6B6B]">
                  {issueDate}
                  {duration ? ` · ${duration}` : null}
                </p>
                {description ? (
                  <p className="mt-3 text-sm leading-relaxed text-[#2D2D2D]/80">
                    {description}
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-[#2D2D2D]/80">
                    OboxSTEAM xác nhận học viên đã hoàn thành chương trình
                    chuyên ngành này.
                  </p>
                )}
              </div>
            </div>

            {modules.length > 0 ? (
              <div className="mt-5 border-t border-[#4FC3F7]/25 pt-4">
                <h2 className="text-sm font-semibold text-[#2D2D2D]">
                  Nội dung đã hoàn thành
                </h2>
                <ul className="mt-3 space-y-2">
                  {modules.map((module) => (
                    <li
                      key={module.moduleId}
                      className="flex items-start gap-2 text-sm text-[#2D2D2D]"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-[#7CB342]"
                        aria-hidden
                      />
                      <span>{module.name?.trim() || "Học phần"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {(thumbnailUrl || outcomes.length > 0 || skills.length > 0) && (
            <section className="space-y-6">
              {thumbnailUrl ? (
                <div className="flex items-center gap-3">
                  <div className="relative size-12 overflow-hidden rounded-xl border border-[#E5E5E0] bg-[#F5F5F0]">
                    <Image
                      src={thumbnailUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-base font-semibold text-[#2D2D2D]">
                      {programName}
                    </p>
                    {duration ? (
                      <p className="text-xs text-[#6B6B6B]">{duration}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {outcomes.length > 0 ? (
                <div>
                  <h2 className="font-heading text-lg font-semibold text-[#2D2D2D]">
                    Bạn sẽ học được
                  </h2>
                  <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {outcomes.map((outcome) => (
                      <li
                        key={outcome}
                        className="flex items-start gap-2 text-sm text-[#2D2D2D]"
                      >
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-[#7CB342]"
                          aria-hidden
                        />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {skills.length > 0 ? (
                <div>
                  <h2 className="font-heading text-lg font-semibold text-[#2D2D2D]">
                    Kỹ năng đạt được
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-[#E5E5E0] bg-[#F5F5F0] px-3 py-1 text-xs font-medium text-[#2D2D2D]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
          <CertificateVisual certificate={certificate} />
          <CertificateActions
            shareUrl={shareUrl}
            pdfUrl={certificate.pdfUrl}
          />
        </aside>
      </div>
    </div>
  );
}
