import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProgramDetailContent } from "@/components/programs/detail/program-detail-content";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { ApiRequestError } from "@/lib/api/errors";
import {
  getProgramById,
  getProgramReviews,
  type Paginated,
  type ProgramReview,
  type ProgramWithModules,
} from "@/lib/api/programs";
import { DEFAULT_PROGRAM_REVIEWS_QUERY } from "@/lib/programs/constants";
import { programIdParamSchema } from "@/lib/validations/programs";

type ProgramDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function loadProgramDetail(id: string): Promise<{
  program: ProgramWithModules;
  reviews: Paginated<ProgramReview>;
}> {
  const [programResult, reviewsResult] = await Promise.all([
    getProgramById(id),
    getProgramReviews(id, DEFAULT_PROGRAM_REVIEWS_QUERY),
  ]);

  const program = programResult?.data;
  const reviews = reviewsResult?.data;

  if (!program || !reviews) {
    throw new Error("Program detail response missing data.");
  }

  return { program, reviews };
}

export async function generateMetadata({
  params,
}: ProgramDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const parsed = programIdParamSchema.safeParse({ id });

  if (!parsed.success) {
    return { title: "Không tìm thấy — OboxSTEAM" };
  }

  try {
    const result = await getProgramById(parsed.data.id);
    const program = result?.data;

    if (!program) {
      return { title: "Không tìm thấy — OboxSTEAM" };
    }

    return {
      title: `${program.name} — OboxSTEAM`,
      description: program.description,
      openGraph: program.thumbnailUrl
        ? { images: [{ url: program.thumbnailUrl }] }
        : undefined,
    };
  } catch {
    return { title: "Chương trình — OboxSTEAM" };
  }
}

export default async function ProgramDetailPage({
  params,
}: ProgramDetailPageProps) {
  const { id } = await params;
  const parsed = programIdParamSchema.safeParse({ id });

  if (!parsed.success) {
    notFound();
  }

  let program: ProgramWithModules;
  let reviews: Paginated<ProgramReview>;

  try {
    ({ program, reviews } = await loadProgramDetail(parsed.data.id));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-[4.5rem] sm:pt-20">
        <ProgramDetailContent program={program} initialReviews={reviews} />
      </main>
      <SiteFooter />
    </>
  );
}
