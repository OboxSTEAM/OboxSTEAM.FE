import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PortfolioMicrosite,
  toPortfolioMicrositeData,
} from "@/components/portfolio/render/portfolio-microsite";
import { ApiRequestError } from "@/lib/api/errors";
import { getPublicPortfolioBySubdomain } from "@/lib/api/portfolios";
import { stripPortfolioHtmlText } from "@/lib/portfolio/sanitize-html";
import { portfolioSubdomainParamSchema } from "@/lib/validations/portfolios";

type PublicPortfolioPageProps = {
  params: Promise<{ subdomain: string }>;
};

async function loadPublicPortfolio(subdomain: string) {
  try {
    const result = await getPublicPortfolioBySubdomain(subdomain);
    return result.data;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PublicPortfolioPageProps): Promise<Metadata> {
  const { subdomain: raw } = await params;
  const parsed = portfolioSubdomainParamSchema.safeParse({ subdomain: raw });
  if (!parsed.success) {
    return { title: "Portfolio — OboxSTEAM" };
  }

  const portfolio = await loadPublicPortfolio(parsed.data.subdomain);
  if (!portfolio) {
    return { title: "Không tìm thấy portfolio — OboxSTEAM" };
  }

  const title =
    stripPortfolioHtmlText(portfolio.displayName) ||
    stripPortfolioHtmlText(portfolio.studentName) ||
    parsed.data.subdomain;

  const description =
    stripPortfolioHtmlText(portfolio.headline) ||
    stripPortfolioHtmlText(portfolio.tagline) ||
    stripPortfolioHtmlText(portfolio.summary) ||
    "Portfolio STEAM công khai trên OboxSTEAM.";

  return {
    title: `${title} — Portfolio OboxSTEAM`,
    description,
  };
}

export default async function PublicPortfolioPage({
  params,
}: PublicPortfolioPageProps) {
  const { subdomain: raw } = await params;
  const parsed = portfolioSubdomainParamSchema.safeParse({ subdomain: raw });
  if (!parsed.success) {
    notFound();
  }

  const portfolio = await loadPublicPortfolio(parsed.data.subdomain);
  if (!portfolio) {
    notFound();
  }

  return (
    <PortfolioMicrosite data={toPortfolioMicrositeData(portfolio)} />
  );
}
