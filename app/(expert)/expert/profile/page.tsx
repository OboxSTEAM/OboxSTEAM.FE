import type { Metadata } from "next";

import { ExpertProfileManager } from "@/components/expert/profile/expert-profile-manager";

export const metadata: Metadata = {
  title: "Hồ sơ chuyên môn",
};

export default function ExpertProfilePage() {
  return <ExpertProfileManager />;
}
