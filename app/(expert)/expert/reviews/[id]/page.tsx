import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExpertReviewDetail } from "@/components/expert/reviews/expert-review-detail";
import { getProgramById } from "@/lib/api";
import { hydrateProgramCurriculum } from "@/lib/api/programs/hydrate-curriculum";
import { programIdParamSchema } from "@/lib/validations/programs";

export const metadata: Metadata = {
  title: "Thẩm định chương trình",
};

type ExpertReviewDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExpertReviewDetailPage({
  params,
}: ExpertReviewDetailPageProps) {
  const { id } = await params;
  const parsed = programIdParamSchema.safeParse({ id });

  if (!parsed.success) {
    notFound();
  }

  const program = await loadProgram(parsed.data.id);

  if (!program) {
    notFound();
  }

  return <ExpertReviewDetail program={program} />;
}

async function loadProgram(programId: string) {
  try {
    const result = await getProgramById(programId);
    const program = result?.data;
    return program ? await hydrateProgramCurriculum(program) : null;
  } catch (error) {
    console.error("Error loading program for expert review:", error);
    return null;
  }
}
