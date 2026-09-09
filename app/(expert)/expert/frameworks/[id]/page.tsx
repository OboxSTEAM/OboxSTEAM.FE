import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FrameworkWorkspace } from "@/components/expert/frameworks/framework-workspace";
import { programFrameworkIdParamSchema } from "@/lib/validations/program-frameworks";

export const metadata: Metadata = {
  title: "Biên tập khung chương trình",
};

type FrameworkEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FrameworkEditorPage({
  params,
}: FrameworkEditorPageProps) {
  const { id } = await params;
  const parsed = programFrameworkIdParamSchema.safeParse({ id });

  if (!parsed.success) {
    notFound();
  }

  return <FrameworkWorkspace frameworkId={parsed.data.id} />;
}
