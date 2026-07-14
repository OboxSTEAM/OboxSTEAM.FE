import { notFound } from "next/navigation";

import { ProgramDetailEditClient } from "@/components/manager/programs/program-detail-edit-client";
import { getProgramById } from "@/lib/api";
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

    return <ProgramDetailEditClient program={program} />;
  } catch (error) {
    console.error("Error loading program detail:", error);
    notFound();
  }
}
