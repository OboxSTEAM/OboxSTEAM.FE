import { z } from "zod";

export const portfolioPlanTypeSchema = z.enum(["Standard", "Premium"]);

export const portfolioItemTypeSchema = z.enum([
  "CapstoneProject",
  "InternalCertificate",
  "ExternalCert",
  "Hobby",
  "Extracurricular",
  "Project",
  "HighlightReel",
]);

export const portfolioItemSourceSchema = z.enum(["AutoImported", "StudentEdited"]);

export const portfolioThemeSchema = z.object({
  templateId: z.string().nullable(),
  primaryColor: z.string().nullable(),
  secondaryColor: z.string().nullable(),
  fontFamily: z.string().nullable(),
  layoutStyle: z.string().nullable(),
  sectionOrder: z.array(z.string()).nullable(),
});

export const portfolioLinkSchema = z.object({
  label: z.string().nullable(),
  url: z.string().nullable(),
});

export const portfolioAppendixItemSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  sectionTitle: z.string().nullable(),
  displayOrder: z.number().int(),
  contentText: z.string().nullable(),
  fileUrl: z.string().nullable(),
  assignedGrade: z.number().nullable(),
  milestoneTitle: z.string().nullable(),
});

export const portfolioItemSchema = z.object({
  id: z.string().uuid(),
  itemType: portfolioItemTypeSchema,
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  organization: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  description: z.string().nullable(),
  mentorEndorsement: z.string().nullable(),
  studentEditedBody: z.string().nullable(),
  mediaUrl: z.string().nullable(),
  externalUrl: z.string().nullable(),
  displayOrder: z.number().int(),
  isVisible: z.boolean(),
  source: portfolioItemSourceSchema,
  programId: z.string().uuid().nullable(),
  programName: z.string().nullable(),
  moduleId: z.string().uuid().nullable(),
  moduleName: z.string().nullable(),
  moduleEnrollmentId: z.string().uuid().nullable(),
  submissionId: z.string().uuid().nullable(),
  appendixSections: z.array(portfolioAppendixItemSchema).nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const portfolioSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  studentId: z.string().uuid(),
  studentName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  subdomain: z.string().nullable(),
  displayName: z.string().nullable(),
  headline: z.string().nullable(),
  tagline: z.string().nullable(),
  summary: z.string().nullable(),
  planType: portfolioPlanTypeSchema,
  isPublic: z.boolean(),
  theme: portfolioThemeSchema,
  links: z.array(portfolioLinkSchema).nullable(),
  items: z.array(portfolioItemSchema).nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const publicPortfolioSchema = z.object({
  subdomain: z.string().nullable(),
  displayName: z.string().nullable(),
  headline: z.string().nullable(),
  tagline: z.string().nullable(),
  summary: z.string().nullable(),
  studentName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  theme: portfolioThemeSchema,
  links: z.array(portfolioLinkSchema).nullable(),
  items: z.array(portfolioItemSchema).nullable(),
});

export const subdomainAvailabilitySchema = z.object({
  subdomain: z.string().nullable(),
  available: z.boolean(),
  reason: z.string().nullable(),
});

export type PortfolioPlanType = z.infer<typeof portfolioPlanTypeSchema>;
export type PortfolioItemType = z.infer<typeof portfolioItemTypeSchema>;
export type PortfolioItemSource = z.infer<typeof portfolioItemSourceSchema>;
export type PortfolioTheme = z.infer<typeof portfolioThemeSchema>;
export type PortfolioLink = z.infer<typeof portfolioLinkSchema>;
export type PortfolioAppendixItem = z.infer<typeof portfolioAppendixItemSchema>;
export type PortfolioItem = z.infer<typeof portfolioItemSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;
export type PublicPortfolio = z.infer<typeof publicPortfolioSchema>;
export type SubdomainAvailability = z.infer<typeof subdomainAvailabilitySchema>;
