"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Edit2, Flag, Plus, Search, Trash2, X } from "lucide-react";

import { CreateMilestoneDialog } from "@/components/manager/programs/create-milestone-dialog";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  deleteResearchMilestone,
  getProgramsWithModules,
  getResearchMilestonesByModule,
  hydrateProgramCurriculum,
  type ProgramWithModules,
  type ResearchMilestone,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  buildModuleIndex,
  milestoneEditHref,
} from "@/lib/manager/curriculum-catalog";

type MilestoneRow = ResearchMilestone & {
  programId: string;
  programName: string;
  moduleName: string;
};

export function MilestoneManager() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MilestoneRow | null>(null);
  const [localRemoved, setLocalRemoved] = useState<Set<string>>(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [programs, setPrograms] = useState<ProgramWithModules[]>([]);

  const { data, isLoading, retry } = useClientFetch({
    fetcher: async () => {
      const result = await getProgramsWithModules({ page: 1, pageSize: 100 });
      const items = result?.data?.items ?? [];
      const hydrated = await Promise.all(
        items.map((p) => hydrateProgramCurriculum(p)),
      );
      setPrograms(hydrated);
      const moduleIndex = buildModuleIndex(hydrated);
      const researchModules = [...moduleIndex.values()].filter(
        (m) => m.moduleType === "Research",
      );

      const milestoneLists = await Promise.all(
        researchModules.map(async (mod) => {
          try {
            const res = await getResearchMilestonesByModule(mod.moduleId);
            return (res?.data ?? []).map((ms) => ({
              ...ms,
              programId: mod.programId,
              programName: mod.programName,
              moduleName: mod.moduleName,
            }));
          } catch {
            return [] as MilestoneRow[];
          }
        }),
      );

      return {
        data: {
          items: milestoneLists.flat(),
        },
      };
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "programs.list"),
  });

  const rows = useMemo(() => {
    const items = data?.data?.items ?? [];
    return items.filter((row) => !localRemoved.has(row.id));
  }, [data, localRemoved]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.title?.toLowerCase().includes(q) ||
        row.code?.toLowerCase().includes(q) ||
        row.moduleName.toLowerCase().includes(q) ||
        row.programName.toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteResearchMilestone(deleteTarget.id);
      setLocalRemoved((prev) => new Set(prev).add(deleteTarget.id));
      showAppSuccess({
        title: "Đã xóa",
        description: `Milestone "${deleteTarget.title ?? ""}" đã được xóa.`,
      });
      setDeleteTarget(null);
      retry();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.node.delete");
    }
  }

  const columns: ColumnDef<MilestoneRow>[] = [
    {
      header: "Milestone",
      className: "max-w-xs",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E5E0] bg-white text-[#8b5cf6]">
            <Flag className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#2D2D2D]">
              {row.title ?? "—"}
            </p>
            <p className="truncate text-[11px] text-[#6B6B6B]">
              {row.code || "Không mã"}
              {row.isCapstone ? " · Capstone" : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Thứ tự",
      render: (row) => (
        <span className="tabular-nums text-[#2D2D2D]">{row.milestoneOrder}</span>
      ),
    },
    {
      header: "Module",
      className: "max-w-[180px] truncate text-[#2D2D2D]",
      render: (row) => row.moduleName,
    },
    {
      header: "Chương trình",
      className: "max-w-[180px] truncate text-[#6B6B6B]",
      render: (row) => row.programName,
    },
    {
      header: "Thao tác",
      className: "text-right w-24",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <Link
                href={milestoneEditHref(row.programId, row.moduleId, row.id)}
              />
            }
            className="size-8 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F0]"
            title="Mở trong khung chương trình"
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(row)}
            className="size-8 rounded-lg text-[#E94B3C] hover:bg-[#E94B3C]/10"
            title="Xóa milestone"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Milestone nghiên cứu"
        description="Tạo milestone tại đây hoặc trong module Research của khung chương trình."
        breadcrumbs={[{ label: "Milestone nghiên cứu" }]}
      >
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="h-11 gap-2 rounded-xl bg-[#E94B3C] px-5 font-semibold text-white hover:bg-[#D94134] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Tạo milestone
        </Button>
      </ManagerPageHeader>

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-xl border border-[#E5E5E0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E5E0] px-4 py-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B6B6B]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề, mã, module, chương trình…"
                className="h-9 rounded-lg border-[#DDDDD8] bg-white pl-9 pr-9 text-sm"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#2D2D2D]"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>

          <ManagerDataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            emptyState={
              <ManagerEmptyState
                icon={Flag}
                title="Chưa có milestone"
                description="Tạo milestone ngay trên trang này, hoặc trong module Research của chương trình."
                actionLabel="Tạo milestone"
                onAction={() => setCreateOpen(true)}
              />
            }
          />
        </div>
      </div>

      <CreateMilestoneDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        programs={programs}
        onCreated={() => {
          setLocalRemoved(new Set());
          retry();
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa milestone"
        description={`Xóa "${deleteTarget?.title ?? ""}"? Hành động không thể hoàn tác.`}
        confirmLabel="Xóa bỏ"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </div>
  );
}
