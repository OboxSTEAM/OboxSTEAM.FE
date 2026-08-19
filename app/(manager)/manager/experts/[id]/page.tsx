"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ExpertProfileContent } from "@/components/experts/expert-profile-content";
import { ExpertFormDialog, type ExpertFormValues } from "@/components/manager/experts/expert-form-dialog";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getExpertById, getPrograms, updateExpert } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type ExpertProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default function ManagerExpertProfilePage({
  params,
}: ExpertProfilePageProps) {
  const { id } = use(params);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, hasError, retry, mutate } = useClientFetch({
    fetcher: async () => {
      const result = await getExpertById(id);
      return result?.data ?? null;
    },
    deps: [id],
    onError: (error) => showAppErrorFromUnknown(error, "experts.profile"),
  });

  const { data: programsData, isLoading: isProgramsLoading } = useClientFetch({
    fetcher: () => getPrograms({ sortBy: "name", page: 1, pageSize: 100 }),
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "programs.list"),
  });

  async function handleSubmit(values: ExpertFormValues) {
    setIsSubmitting(true);
    try {
      const result = await updateExpert(id, values);
      if (result?.data) mutate(result.data);
      showAppSuccess({ title: "Đã cập nhật hồ sơ chuyên môn" });
      setFormOpen(false);
    } catch (error) {
      showAppErrorFromUnknown(error, "experts.update");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ManagerPageHeader
        title="Hồ sơ chuyên môn"
        description="Cập nhật bằng cấp, bài báo và chuyên môn của chuyên gia."
      />

      <Link
        href="/manager/experts"
        className="-mt-2 inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Danh sách chuyên gia
      </Link>

      {isLoading && !data ? (
        <div className="h-48 animate-pulse rounded-2xl bg-border/70" />
      ) : hasError && !data ? (
        <p className="text-sm text-muted-foreground">Không tải được hồ sơ.</p>
      ) : data ? (
        <>
          <div className="rounded-2xl border border-border bg-card p-6">
            <ExpertProfileContent expert={data} />
            <Button
              type="button"
              className="mt-6 rounded-xl"
              onClick={() => setFormOpen(true)}
            >
              Cập nhật hồ sơ
            </Button>
          </div>
          <ExpertFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            expert={data}
            programs={programsData?.data?.items ?? []}
            isProgramsLoading={isProgramsLoading}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onExpertChange={mutate}
          />
        </>
      ) : null}
    </div>
  );
}
