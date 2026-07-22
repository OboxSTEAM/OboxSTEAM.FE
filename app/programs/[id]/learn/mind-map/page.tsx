import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { programIdParamSchema } from "@/lib/validations/programs";

type MindMapPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Bản đồ học tập — OboxSTEAM",
  robots: { index: false, follow: false },
};

/** Mind map lives inside the curriculum learn page — keep this route as a bookmark redirect. */
export default async function ProgramCurriculumMindMapPage({
  params,
}: MindMapPageProps) {
  const { id } = await params;
  const parsed = programIdParamSchema.safeParse({ id });

  if (!parsed.success) {
    redirect("/courses");
  }

  redirect(`/programs/${parsed.data.id}/learn?view=mind-map`);
}
