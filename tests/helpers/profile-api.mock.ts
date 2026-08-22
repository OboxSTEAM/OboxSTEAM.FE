import type { PortfolioItem } from "@/lib/api/entities/portfolio";
import type { UserProfile } from "@/lib/api/entities/user";

export const mockUserProfile: UserProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  code: "STU001",
  fullName: "Nguyen Van A",
  email: "student@example.com",
  avatarUrl: null,
  phone: "0912345678",
  role: "Student",
  status: "Active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const mockParentProfile: UserProfile = {
  ...mockUserProfile,
  id: "22222222-2222-2222-2222-222222222222",
  code: "PAR001",
  fullName: null,
  phone: null,
  email: "parent@example.com",
  role: "Parent",
  isEmailVerified: false,
};

export const mockPortfolioItem: PortfolioItem = {
  id: "33333333-3333-3333-3333-333333333333",
  itemType: "Project",
  title: "Du an STEAM",
  subtitle: null,
  organization: null,
  startDate: null,
  endDate: null,
  description: null,
  mentorEndorsement: null,
  studentEditedBody: null,
  mediaUrl: null,
  externalUrl: null,
  displayOrder: 0,
  isVisible: true,
  source: "StudentEdited",
  accentColor: null,
  isFeatured: null,
  span: null,
  mediaAssets: [],
  programId: null,
  programName: null,
  moduleId: null,
  moduleName: null,
  moduleEnrollmentId: null,
  submissionId: null,
  appendixSections: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: null,
};
