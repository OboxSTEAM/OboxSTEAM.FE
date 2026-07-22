import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { CurriculumLearnContent } from "@/components/curriculum/curriculum-learn-content";
import { programIdParamSchema } from "@/lib/validations/programs";

type LearnPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Học chương trình — OboxSTEAM",
  robots: { index: false, follow: false },
};

function LearnPageFallback() {
  return (
    <div className="learn-shell min-h-dvh animate-pulse bg-learn-bg pt-[4.5rem] sm:pt-20">
      <div className="h-[4.5rem] border-b border-learn-border bg-learn-surface sm:h-20" />
      <div className="grid lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="hidden h-[calc(100dvh-4.5rem)] bg-learn-surface-2/60 sm:h-[calc(100dvh-5rem)] lg:block" />
        <div className="m-4 h-[70vh] rounded-2xl bg-learn-surface-2/60" />
      </div>
    </div>
  );
}

export default async function ProgramLearnPage({ params }: LearnPageProps) {
  const { id } = await params;
  const parsed = programIdParamSchema.safeParse({ id });

  if (!parsed.success) {
    notFound();
  }

  return (
    <Suspense fallback={<LearnPageFallback />}>
      <CurriculumLearnContent programId={parsed.data.id} />
    </Suspense>
  );
}
