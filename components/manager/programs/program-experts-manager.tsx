"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  Link2Off,
  Pencil,
  Plus,
  UserRoundPlus,
  UserRoundSearch,
} from "lucide-react";

import { ExpertProfileDialog } from "@/components/experts/expert-profile-dialog";
import {
  ExpertFormDialog,
  type ExpertFormValues,
} from "@/components/manager/experts/expert-form-dialog";
import { AssignExistingExpertDialog } from "@/components/manager/programs/assign-existing-expert-dialog";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  addExpertToProgram,
  createExpert,
  getExpertById,
  getExperts,
  removeExpertFromProgram,
  updateExpert,
  type Expert,
  type ProgramExpert,
  type ProgramWithModules,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  getExpertAvatarUrl,
  getExpertInitials,
} from "@/lib/programs/format";

type ProgramExpertsManagerProps = {
  program: ProgramWithModules;
};

export function ProgramExpertsManager({ program }: ProgramExpertsManagerProps) {
  const router = useRouter();
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ProgramExpert | null>(null);
  const [loadingExpertId, setLoadingExpertId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const experts = program.experts;

  const { data: expertsData, isLoading: isExpertsLoading } = useClientFetch({
    fetcher: () =>
      getExperts({
        sortBy: "fullName",
        isDescending: false,
        page: 1,
        pageSize: 100,
      }),
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "experts.list"),
  });

  const availableExperts = expertsData?.data?.items ?? [];

  function openCreate() {
    setEditingExpert(null);
    setFormOpen(true);
  }

  async function openEdit(expertId: string) {
    setLoadingExpertId(expertId);
    try {
      const result = await getExpertById(expertId);
      if (!result?.data) return;
      setEditingExpert(result.data);
      setFormOpen(true);
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.expert");
    } finally {
      setLoadingExpertId(null);
    }
  }

  async function handleSubmit(values: ExpertFormValues) {
    setIsSubmitting(true);
    try {
      if (editingExpert) {
        await updateExpert(editingExpert.id, values);
        showAppSuccess({
          title: "Đã cập nhật chuyên gia",
          description: `Thông tin của ${values.fullName} đã được lưu.`,
        });
      } else {
        await createExpert(values);
        showAppSuccess({
          title: "Đã thêm chuyên gia",
          description: `${values.fullName} đã được tạo và gán vào ${program.name}.`,
        });
      }
      setFormOpen(false);
      setEditingExpert(null);
      router.refresh();
    } catch (error) {
      showAppErrorFromUnknown(
        error,
        editingExpert ? "experts.update" : "experts.create",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssignExisting(
    expertId: string,
    roleInBoard: string,
  ) {
    setIsAssigning(true);
    try {
      await addExpertToProgram(expertId, program.id, {
        roleInBoard: roleInBoard || undefined,
      });
      const expert = availableExperts.find((item) => item.id === expertId);
      showAppSuccess({
        title: "Đã gán chuyên gia",
        description: `${expert?.fullName || "Chuyên gia"} đã được thêm vào ${program.name}.`,
      });
      setAssignOpen(false);
      router.refresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "experts.update");
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleRemoveAssignment() {
    if (!removeTarget) return;
    try {
      await removeExpertFromProgram(removeTarget.expertId, program.id);
      showAppSuccess({
        title: "Đã gỡ chuyên gia khỏi chương trình",
        description: `${removeTarget.fullName} không còn tham gia ${program.name}. Hồ sơ chuyên gia vẫn được giữ nguyên.`,
      });
      setRemoveTarget(null);
      router.refresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "experts.update");
      throw error;
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
      <header className="flex flex-col gap-4 border-b border-[#E5E5E0] bg-[#FAFAF5]/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#4FC3F7]/12 text-[#0D6E9C]">
              <BriefcaseBusiness className="size-4" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-[#2D2D2D]">
                Hội đồng chuyên gia
              </h2>
              <p className="mt-0.5 text-xs text-[#6B6B6B]">
                {experts.length > 0
                  ? `${experts.length} chuyên gia đang tham gia chương trình`
                  : "Chưa có chuyên gia được gán cho chương trình"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={openCreate}
            aria-label="Tạo chuyên gia"
            className="group h-10 w-10 gap-0 overflow-hidden rounded-xl bg-[#E94B3C] px-0 text-sm font-semibold text-white transition-[width,padding,gap] duration-200 hover:w-48 hover:gap-2 hover:bg-[#D94134] hover:px-4 active:scale-[0.98]"
          >
            <Plus className="size-4 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover:max-w-32 group-hover:opacity-100">
              Tạo chuyên gia
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAssignOpen(true)}
            aria-label="Gán chuyên gia có sẵn"
            className="group h-10 w-10 gap-0 overflow-hidden rounded-xl border-[#D8D8D2] bg-white px-0 text-sm font-semibold text-[#2D2D2D] transition-[width,padding,gap] duration-200 hover:w-64 hover:gap-2 hover:border-[#4FC3F7] hover:bg-[#4FC3F7]/8 hover:px-4"
          >
            <UserRoundPlus className="size-4 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover:max-w-48 group-hover:opacity-100">
              Gán chuyên gia có sẵn
            </span>
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/manager/experts" />}
            variant="outline"
            aria-label="Quay về danh sách chuyên gia"
            className="group h-10 w-10 gap-0 overflow-hidden rounded-xl border-[#D8D8D2] bg-white px-0 text-sm font-semibold text-[#2D2D2D] transition-[width,padding,gap] duration-200 hover:w-56 hover:gap-2 hover:px-4 hover:bg-[#F5F5F0]"
          >
            <ArrowRight className="size-4 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover:max-w-44 group-hover:opacity-100">
              Danh sách chuyên gia
            </span>
          </Button>
        </div>
      </header>

      {experts.length === 0 ? (
        <div className="p-6">
          <ManagerEmptyState
            title="Chưa gán chuyên gia"
            description={`Tạo hồ sơ chuyên gia mới và gán trực tiếp vào ${program.name}.`}
            icon={UserRoundSearch}
            actionLabel="Thêm chuyên gia"
            onAction={openCreate}
          />
        </div>
      ) : (
        <div className="grid gap-px bg-[#E5E5E0] md:grid-cols-2">
          {experts.map((expert) => {
            const avatarUrl = getExpertAvatarUrl(expert.avatarUrl);
            return (
              <article
                key={expert.expertId}
                className="group flex min-w-0 items-start gap-4 bg-white p-6 transition-colors hover:bg-[#FAFAF5]/70"
              >
                <Avatar className="size-14 shrink-0 border border-[#E5E5E0]">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={expert.fullName} />
                  ) : null}
                  <AvatarFallback className="bg-[#4FC3F7]/12 font-heading text-sm font-bold text-[#0D6E9C]">
                    {getExpertInitials(expert.fullName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-sm font-bold text-[#2D2D2D]">
                        {expert.fullName || "Chưa cập nhật tên"}
                      </h3>
                      <p className="mt-1 truncate text-xs text-[#6B6B6B]">
                        {[expert.title, expert.organization].filter(Boolean).join(" · ") ||
                          "Chưa cập nhật chức danh"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedExpertId(expert.expertId)}
                        aria-label={`Xem hồ sơ ${expert.fullName}`}
                        className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#4FC3F7]/10 hover:text-[#0D6E9C]"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={loadingExpertId === expert.expertId}
                        onClick={() => void openEdit(expert.expertId)}
                        aria-label={`Sửa ${expert.fullName}`}
                        className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#FDD835]/25 hover:text-[#8A7200]"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRemoveTarget(expert)}
                        aria-label={`Gỡ ${expert.fullName} khỏi chương trình`}
                        className="size-9 rounded-lg text-[#E94B3C] hover:bg-[#E94B3C]/10 hover:text-[#C9362B]"
                      >
                        <Link2Off className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-md border-[#D8D8D2] font-mono text-[10px] text-[#6B6B6B]"
                    >
                      {expert.code || "CHƯA CÓ MÃ"}
                    </Badge>
                    {expert.roleInBoard ? (
                      <Badge className="rounded-md bg-[#FDD835]/20 text-[11px] font-semibold text-[#725D00]">
                        {expert.roleInBoard}
                      </Badge>
                    ) : (
                      <span className="text-xs italic text-[#8A8A84]">
                        Chưa cập nhật vai trò
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ExpertFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingExpert(null);
        }}
        expert={editingExpert}
        defaultProgramId={program.id}
        programs={[program]}
        isProgramsLoading={false}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      {assignOpen ? (
        <AssignExistingExpertDialog
          open
          onOpenChange={setAssignOpen}
          programName={program.name}
          experts={availableExperts}
          assignedExpertIds={experts.map((expert) => expert.expertId)}
          isLoading={isExpertsLoading}
          isSubmitting={isAssigning}
          onSubmit={handleAssignExisting}
        />
      ) : null}

      <ConfirmDialog
        isOpen={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={handleRemoveAssignment}
        title="Gỡ chuyên gia khỏi chương trình?"
        description={`“${removeTarget?.fullName || ""}” sẽ không còn tham gia ${program.name}. Hồ sơ chuyên gia không bị xóa và vẫn có thể gán lại sau.`}
        confirmLabel="Gỡ khỏi chương trình"
        variant="destructive"
      />

      <ExpertProfileDialog
        expertId={selectedExpertId}
        open={selectedExpertId !== null}
        currentProgramId={program.id}
        onOpenChange={(open) => {
          if (!open) setSelectedExpertId(null);
        }}
      />
    </section>
  );
}
