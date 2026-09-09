import { redirect } from "next/navigation";

type ExpertReviewRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExpertReviewRedirectPage({
  params,
}: ExpertReviewRedirectPageProps) {
  const { id } = await params;
  redirect(`/expert/programs/${id}`);
}
