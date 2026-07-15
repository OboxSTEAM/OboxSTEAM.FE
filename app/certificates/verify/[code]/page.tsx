import type { Metadata } from "next";
import Link from "next/link";

import { CertificateShowcase } from "@/components/certificates/certificate-showcase";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { verifyCertificate } from "@/lib/api/certificates";
import type { CertificateDetail } from "@/lib/api/entities/certificate";
import { ApiRequestError } from "@/lib/api/errors";
import { getCertificateVerifyHref } from "@/lib/certificates/format";
import { certificateCodeParamSchema } from "@/lib/validations/certificates";
import { cn } from "@/lib/utils";

type VerifyCertificatePageProps = {
  params: Promise<{ code: string }>;
};

const SITE_ORIGIN = "https://oboxsteam.edu.vn";

async function loadCertificate(
  code: string,
): Promise<CertificateDetail | null> {
  const parsed = certificateCodeParamSchema.safeParse({ code });
  if (!parsed.success) return null;

  try {
    const result = await verifyCertificate(parsed.data.code);
    return result?.data ?? null;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.status === 404 || error.status === 400) return null;
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: VerifyCertificatePageProps): Promise<Metadata> {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode);
  const certificate = await loadCertificate(code);

  if (!certificate) {
    return {
      title: "Không tìm thấy chứng chỉ — OboxSTEAM",
      robots: { index: false, follow: false },
    };
  }

  const studentName = certificate.student.fullName?.trim() || "Học viên";
  const programName =
    certificate.program.name?.trim() || "Chương trình STEAM";
  const title = `${studentName} · ${programName} — Chứng chỉ OboxSTEAM`;
  const description = `Xác minh chứng chỉ hoàn thành chương trình ${programName} của ${studentName} trên OboxSTEAM.`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      ...(certificate.program.thumbnailUrl
        ? { images: [{ url: certificate.program.thumbnailUrl }] }
        : {}),
    },
  };
}

function CertificateNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[#6B6B6B]">
        Chứng chỉ
      </p>
      <h1 className="font-heading mt-2 text-2xl font-bold text-[#2D2D2D] sm:text-3xl">
        Không tìm thấy chứng chỉ
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#6B6B6B]">
        Mã xác minh không hợp lệ hoặc chứng chỉ chưa được cấp. Kiểm tra lại
        liên kết và thử lại.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants(), "mt-6 inline-flex font-semibold")}
      >
        Về trang chủ
      </Link>
    </div>
  );
}

export default async function VerifyCertificatePage({
  params,
}: VerifyCertificatePageProps) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode);
  const certificate = await loadCertificate(code);

  const shareUrl = certificate?.code
    ? `${SITE_ORIGIN}${getCertificateVerifyHref(certificate.code)}`
    : `${SITE_ORIGIN}${getCertificateVerifyHref(code)}`;

  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-[4.5rem] sm:pt-20">
        {certificate ? (
          <CertificateShowcase
            certificate={certificate}
            shareUrl={shareUrl}
          />
        ) : (
          <CertificateNotFound />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
