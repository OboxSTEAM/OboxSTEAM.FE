import type { Metadata } from "next";

import { CurriculumLearnContent } from "@/components/curriculum/curriculum-learn-content";
import { programIdParamSchema } from "@/lib/validations/programs";
import { notFound } from "next/navigation";

type LearnPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Học chương trình — OboxSTEAM",
  robots: { index: false, follow: false },
};

export default async function ProgramLearnPage({ params }: LearnPageProps) {
  const { id } = await params;
  const parsed = programIdParamSchema.safeParse({ id });

  if (!parsed.success) {
    notFound();
  }

  return <CurriculumLearnContent programId={parsed.data.id} />;
}
