import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClassDetail } from "@/components/manager/classes/class-detail";
import { classIdParamSchema } from "@/lib/validations/classes";
import { programIdParamSchema } from "@/lib/validations/programs";

type ProgramClassDetailPageProps = {
  params: Promise<{ id: string; classId: string }>;
};

export const metadata: Metadata = {
  title: "Chi tiết lớp",
};

export default async function ProgramClassDetailPage({
  params,
}: ProgramClassDetailPageProps) {
  const { id, classId } = await params;
  const programParsed = programIdParamSchema.safeParse({ id });
  const classParsed = classIdParamSchema.safeParse({ classId });

  if (!programParsed.success || !classParsed.success) {
    notFound();
  }

  return (
    <ClassDetail
      classId={classParsed.data.classId}
      programId={programParsed.data.id}
    />
  );
}
