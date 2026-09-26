import { redirect } from "next/navigation";

import { managerProgramClassesHref } from "@/lib/manager/class-paths";
import { programIdParamSchema } from "@/lib/validations/programs";

type ProgramClassesIndexPageProps = {
  params: Promise<{ id: string }>;
};

/** Breadcrumb "Lớp học" under a program → program detail, Lớp tab. */
export default async function ProgramClassesIndexPage({
  params,
}: ProgramClassesIndexPageProps) {
  const { id } = await params;
  const parsed = programIdParamSchema.safeParse({ id });
  if (!parsed.success) {
    redirect("/manager/programs");
  }
  redirect(managerProgramClassesHref(parsed.data.id));
}
