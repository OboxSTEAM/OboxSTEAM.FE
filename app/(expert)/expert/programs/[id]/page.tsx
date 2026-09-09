import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProgramAdvisoryWorkspace } from "@/components/expert/programs/program-advisory-workspace";
import { getProgramById } from "@/lib/api";
import { hydrateProgramCurriculum } from "@/lib/api/programs/hydrate-curriculum";
import { programIdParamSchema } from "@/lib/validations/programs";

export const metadata: Metadata = {
  title: "Không gian thẩm định",
};

type ExpertProgramWorkspacePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExpertProgramWorkspacePage({
  params,
}: ExpertProgramWorkspacePageProps) {
  const { id } = await params;
  const parsed = programIdParamSchema.safeParse({ id });

  if (!parsed.success) {
    notFound();
  }

  const program = await loadProgram(parsed.data.id);

  if (!program) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-[480px] animate-pulse p-6" />}>
      <ProgramAdvisoryWorkspace program={program} />
    </Suspense>
  );
}

async function loadProgram(programId: string) {
  try {
    const result = await getProgramById(programId);
    const program = result?.data;
    return program ? await hydrateProgramCurriculum(program) : null;
  } catch (error) {
    console.error("Error loading program for expert advisory:", error);
    return null;
  }
}
