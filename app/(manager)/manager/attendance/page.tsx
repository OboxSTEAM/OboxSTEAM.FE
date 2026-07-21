import type { Metadata } from "next";

import { AttendanceManager } from "@/components/manager/classes/attendance-manager";

export const metadata: Metadata = {
  title: "Điểm danh",
};

export default function ManagerAttendancePage() {
  return <AttendanceManager />;
}
