import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tổng quan — Manager | OboxSTEAM",
};

export default function ManagerOverviewPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Placeholder stats grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Chương trình đang hoạt động", value: "—", color: "#E94B3C" },
          { label: "Lớp học", value: "—", color: "#4FC3F7" },
          { label: "Học viên đã đăng ký", value: "—", color: "#7CB342" },
          { label: "Mentor chờ duyệt", value: "—", color: "#FDD835" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#E5E5E0] bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-[#6B6B6B]">{card.label}</p>
            <p
              className="mt-3 font-heading text-3xl font-bold tabular-nums"
              style={{ color: card.color }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="mt-6 rounded-xl border border-dashed border-[#E5E5E0] bg-white p-8 text-center">
        <p className="font-heading text-base font-semibold text-[#2D2D2D]">
          Biểu đồ thống kê — sắp ra mắt
        </p>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          Charts và dữ liệu thống kê sẽ được wire sau khi BE cung cấp endpoint{" "}
          <code className="font-mono text-xs">/api/manager/dashboard/summary</code>.
        </p>
      </div>
    </div>
  );
}
