import { z } from "zod";

import {
  portfolioItemTypeSchema,
  portfolioLinkSchema,
  portfolioThemeSchema,
} from "@/lib/api/entities/portfolio";

export const portfolioItemIdParamSchema = z.object({
  itemId: z.string().uuid("ID mục portfolio không hợp lệ."),
});

export const portfolioSubdomainParamSchema = z.object({
  subdomain: z.string().min(1, "Subdomain là bắt buộc."),
});

/** Query for `GET /api/portfolios/subdomain-available`. */
export const portfolioSubdomainAvailabilityQuerySchema = z.object({
  subdomain: z.string().min(1, "Subdomain là bắt buộc."),
});

/** Body for `PUT /api/portfolios/me` — profile, theme, and links only. */
export const updatePortfolioSchema = z.object({
  displayName: z.string().max(255, "Tên hiển thị tối đa 255 ký tự.").nullable().optional(),
  headline: z.string().max(255, "Tiêu đề tối đa 255 ký tự.").nullable().optional(),
  tagline: z.string().max(255, "Tagline tối đa 255 ký tự.").nullable().optional(),
  summary: z.string().nullable().optional(),
  theme: portfolioThemeSchema.optional(),
  links: z.array(portfolioLinkSchema).nullable().optional(),
});

/** Body for `PUT /api/portfolios/me/subdomain`. Send null/blank to clear while unpublished. */
export const updatePortfolioSubdomainSchema = z.object({
  subdomain: z.string().max(100, "Subdomain tối đa 100 ký tự.").nullable().optional(),
});

/** Body for `PUT /api/portfolios/me/publication`. */
export const updatePortfolioPublicationSchema = z.object({
  isPublished: z.boolean(),
});

/** Body for `POST /api/portfolios/me/items`. */
export const createPortfolioItemSchema = z.object({
  itemType: portfolioItemTypeSchema,
  title: z.string().min(1, "Tiêu đề là bắt buộc.").max(255, "Tiêu đề tối đa 255 ký tự."),
  subtitle: z.string().max(255, "Phụ đề tối đa 255 ký tự.").nullable().optional(),
  organization: z.string().max(255, "Tổ chức tối đa 255 ký tự.").nullable().optional(),
  description: z.string().nullable().optional(),
  studentEditedBody: z.string().nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
  externalUrl: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).max(2147483647).nullable().optional(),
  isVisible: z.boolean().nullable().optional(),
});

/** Body for `PUT /api/portfolios/me/items/{itemId}`. */
export const updatePortfolioItemSchema = z.object({
  title: z.string().max(255, "Tiêu đề tối đa 255 ký tự.").nullable().optional(),
  subtitle: z.string().max(255, "Phụ đề tối đa 255 ký tự.").nullable().optional(),
  organization: z.string().max(255, "Tổ chức tối đa 255 ký tự.").nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  studentEditedBody: z.string().nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
  externalUrl: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).max(2147483647).nullable().optional(),
  isVisible: z.boolean().nullable().optional(),
});

const reorderPortfolioItemEntrySchema = z.object({
  id: z.string().uuid("ID mục portfolio không hợp lệ."),
  displayOrder: z
    .number()
    .int()
    .min(0, "Thứ tự hiển thị không được âm.")
    .max(2147483647),
});

/** Body for `PUT /api/portfolios/me/items/reorder`. */
export const reorderPortfolioItemsSchema = z.object({
  items: z.array(reorderPortfolioItemEntrySchema).min(1, "Danh sách mục không được trống."),
});

export type PortfolioItemIdParam = z.infer<typeof portfolioItemIdParamSchema>;
export type PortfolioSubdomainParam = z.infer<typeof portfolioSubdomainParamSchema>;
export type PortfolioSubdomainAvailabilityQuery = z.infer<
  typeof portfolioSubdomainAvailabilityQuerySchema
>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
export type UpdatePortfolioSubdomainInput = z.infer<typeof updatePortfolioSubdomainSchema>;
export type UpdatePortfolioPublicationInput = z.infer<typeof updatePortfolioPublicationSchema>;
export type CreatePortfolioItemInput = z.infer<typeof createPortfolioItemSchema>;
export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemSchema>;
export type ReorderPortfolioItemsInput = z.infer<typeof reorderPortfolioItemsSchema>;
