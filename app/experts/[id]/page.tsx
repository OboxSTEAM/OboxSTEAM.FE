import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExpertProfileContent } from "@/components/experts/expert-profile-content";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { getExpertPublicProfile } from "@/lib/api/experts";
import { expertIdParamSchema } from "@/lib/validations/experts";

type ExpertPublicPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ExpertPublicPageProps): Promise<Metadata> {
  const { id } = await params;
  const parsed = expertIdParamSchema.safeParse({ expertId: id });
  if (!parsed.success) {
    return { title: "Không tìm thấy — OboxSTEAM" };
  }

  try {
    const result = await getExpertPublicProfile(parsed.data.expertId);
    const expert = result?.data;
    if (!expert) return { title: "Không tìm thấy — OboxSTEAM" };
    return {
      title: `${expert.fullName || "Chuyên gia"} — OboxSTEAM`,
      description: expert.bio || expert.title,
    };
  } catch {
    return { title: "Chuyên gia — OboxSTEAM" };
  }
}

export default async function ExpertPublicPage({ params }: ExpertPublicPageProps) {
  const { id } = await params;
  const parsed = expertIdParamSchema.safeParse({ expertId: id });
  if (!parsed.success) notFound();

  try {
    const result = await getExpertPublicProfile(parsed.data.expertId);
    const expert = result?.data;
    if (!expert) notFound();

    return (
      <div className="min-h-screen bg-[#FAFAF5]">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          <ExpertProfileContent expert={expert} />
        </main>
        <SiteFooter />
      </div>
    );
  } catch {
    notFound();
  }
}
