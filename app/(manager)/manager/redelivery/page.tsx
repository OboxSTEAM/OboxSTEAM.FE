import type { Metadata } from "next";

import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Inbox } from "lucide-react";

export const metadata: Metadata = {
  title: "Học lại lớp",
};

/** Waitlist / remedial manager flow removed (BE 410). */
export default function ManagerRedeliveryPage() {
  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Học lại lớp"
        description="Luồng xếp lớp / waitlist đã gỡ. Học viên tự chọn lớp continuity hoặc rebuy."
        breadcrumbs={[{ label: "Học lại lớp" }]}
      />
      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
          <ManagerEmptyState
            icon={Inbox}
            title="Không còn hàng đợi quản lý"
            description="Waitlist và lớp Remedial intensive đã tắt. Học viên chọn lớp Open / InProgress trực tiếp và thanh toán phí học lại (50%)."
          />
        </div>
      </div>
    </div>
  );
}
