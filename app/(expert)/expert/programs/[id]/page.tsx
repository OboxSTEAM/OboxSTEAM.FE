import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ExpertProgramWorkspace } from "@/components/expert/programs/expert-program-workspace";
import { getProgramById, getProgramFrameworkById } from "@/lib/api";
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

  const framework = program.frameworkId ? await loadFramework(program.frameworkId) : null;

  return (
    <Suspense fallback={<div className="min-h-[480px] animate-pulse p-6 motion-reduce:animate-none" />}>
      <ExpertProgramWorkspace program={program} framework={framework} />
    </Suspense>
  );
}

/** Board members may not be allowed to read the framework; the live check still renders without it. */
async function loadFramework(frameworkId: string) {
  try {
    const result = await getProgramFrameworkById(frameworkId);
    return result?.data ?? null;
  } catch {
    return null;
  }
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
