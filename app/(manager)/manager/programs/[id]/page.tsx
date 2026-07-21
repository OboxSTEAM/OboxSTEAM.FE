import { notFound } from "next/navigation";

import { ProgramDetailEditClient } from "@/components/manager/programs/program-detail-edit-client";
import { getProgramById } from "@/lib/api";
import { hydrateProgramCurriculum } from "@/lib/api/programs/hydrate-curriculum";
import { programIdParamSchema } from "@/lib/validations/programs";

type ProgramPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { id } = await params;
  const parsed = programIdParamSchema.safeParse({ id });

  if (!parsed.success) {
    notFound();
  }

  try {
    const result = await getProgramById(parsed.data.id);
    const program = result?.data;

    if (!program) {
      notFound();
    }

    const withCourses = await hydrateProgramCurriculum(program);
    return <ProgramDetailEditClient program={withCourses} />;
  } catch (error) {
    console.error("Error loading program detail:", error);
    notFound();
  }
}
