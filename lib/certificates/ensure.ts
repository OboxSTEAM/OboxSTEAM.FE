import type {
  CertificateDetail,
  CertificateListItem,
} from "@/lib/api/entities/certificate";
import type { ProgramEnrollment } from "@/lib/api/entities/program-enrollment";

/** Enrollment looks finished but may still lack an issued certificate row. */
export function shouldEnsureProgramCertificate(
  enrollment: ProgramEnrollment,
  hasCertificate: boolean,
): boolean {
  if (hasCertificate) return false;
  return (
    enrollment.status === "Completed" || enrollment.progressPercent >= 100
  );
}

/** Map ensure/detail payload into the courses-page list card shape. */
export function toCertificateListItem(
  detail: CertificateDetail,
): CertificateListItem {
  return {
    id: detail.id,
    code: detail.code,
    programId: detail.program.id,
    programName: detail.program.name,
    issueDate: detail.issueDate,
    pdfUrl: detail.pdfUrl,
    verificationUrl: detail.verificationUrl,
  };
}
