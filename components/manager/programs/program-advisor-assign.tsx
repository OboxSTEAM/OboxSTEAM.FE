"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRoundCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  assignProgramAdvisor,
  getExperts,
  type ProgramStatus,
  type ProgramWithModules,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";

type ProgramAdvisorAssignProps = {
  program: ProgramWithModules;
};

const ASSIGNABLE_STATUSES: ProgramStatus[] = ["Draft", "Active", "Inactive"];

type SelectableExpert = {
  id: string;
  fullName: string;
};

export function ProgramAdvisorAssign({ program }: ProgramAdvisorAssignProps) {
  const router = useRouter();
  const [selectedExpertId, setSelectedExpertId] = useState(
    program.advisorExpertId ?? "",
  );
  const [isAssigning, setIsAssigning] = useState(false);

  const canAssign = ASSIGNABLE_STATUSES.includes(program.status);

  const { data: expertsData, isLoading } = useClientFetch({
    enabled: canAssign && program.experts.length === 0,
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

  const selectableExperts: SelectableExpert[] =
    program.experts.length > 0
      ? program.experts.map((expert) => ({
          id: expert.expertId,
          fullName: expert.fullName,
        }))
      : (expertsData?.data?.items ?? []).map((expert) => ({
          id: expert.id,
          fullName: expert.fullName,
        }));

  async function handleAssign() {
    if (!selectedExpertId) return;
    setIsAssigning(true);
    try {
      await assignProgramAdvisor(program.id, {
        advisorExpertId: selectedExpertId,
      });
      showAppSuccess({
        title: "Đã gán chuyên gia phụ trách",
        description: "Chuyên gia phụ trách sẽ nhận thẩm định và trao đổi advisory.",
      });
      router.refresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.advisor");
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_2px_10px_rgba(45,45,45,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserRoundCheck className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Chuyên gia phụ trách</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Một chuyên gia chịu trách nhiệm thẩm định và quyết định rubric.
          </p>
          {program.advisorExpertName ? (
            <Badge className="mt-2 rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
              {program.advisorExpertName}
            </Badge>
          ) : (
            <p className="mt-2 text-xs italic text-muted-foreground">
              Chưa gán chuyên gia phụ trách
            </p>
          )}
        </div>

        {canAssign ? (
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedExpertId}
              onValueChange={(value) => setSelectedExpertId(value ?? "")}
              disabled={isLoading || isAssigning}
            >
              <SelectTrigger className={`${THEME_SELECT_TRIGGER} min-w-48`}>
                {selectableExperts.find((e) => e.id === selectedExpertId)?.fullName ||
                  "Chọn chuyên gia"}
              </SelectTrigger>
              <SelectContent className={THEME_SELECT_CONTENT}>
                {selectableExperts.map((expert) => (
                  <SelectItem
                    key={expert.id}
                    value={expert.id}
                    className={THEME_SELECT_ITEM}
                  >
                    {expert.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={() => void handleAssign()}
              disabled={!selectedExpertId || isAssigning}
              className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white"
            >
              {isAssigning ? "Đang gán…" : "Gán phụ trách"}
            </Button>
          </div>
        ) : (
          <p className="max-w-xs text-xs text-muted-foreground">
            Chỉ gán phụ trách khi chương trình ở trạng thái Bản nháp, Đang mở hoặc Ngừng hoạt động.
            Rút duyệt trước nếu đang Chờ duyệt.
          </p>
        )}
      </div>
    </section>
  );
}
