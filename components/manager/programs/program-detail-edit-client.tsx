"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, Users, Star, GraduationCap } from "lucide-react";

import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { ProgramForm } from "@/components/manager/programs/program-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Button } from "@/components/ui/button";
import { updateProgram, type ProgramWithModules } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { CurriculumBuilder } from "./curriculum-builder";

type ProgramDetailEditClientProps = {
  program: ProgramWithModules;
};

export function ProgramDetailEditClient({ program: initialProgram }: ProgramDetailEditClientProps) {
  const router = useRouter();
  const [program, setProgram] = useState<ProgramWithModules>(initialProgram);
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setProgram(initialProgram);
  }, [initialProgram]);

  const handleUpdate = async (values: any) => {
    setIsSubmitting(true);
    try {
      const response = await updateProgram(program.id, values);
      if (!response) throw new Error("Không có phản hồi từ hệ thống.");
      if (response.data) setProgram(response.data);
      showAppSuccess({
        title: "Cập nhật thành công",
        description: response.message || `Chương trình ${values.name} đã được cập nhật.`,
      });
      router.refresh();
    } catch (err) {
      showAppErrorFromUnknown(err, "programs.detail");
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: "Chương trình", href: "/manager/programs" },
    { label: program.name },
  ];

  return (
    <div className="flex flex-col gap-0">
      <ManagerPageHeader
        title={program.name}
        description={`Mã: ${program.code} · Cập nhật thông tin và khung chương trình học`}
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* Tab bar + save button on same row */}
          <div className="flex items-center justify-between border-b border-[#E5E5E0] mb-6">
            <TabsList variant="line" className="pb-px gap-6">
              <TabsTrigger value="overview"    className="pb-3 text-sm">Thông tin chung</TabsTrigger>
              <TabsTrigger value="curriculum"  className="pb-3 text-sm">Chương trình học</TabsTrigger>
              <TabsTrigger value="experts"     className="pb-3 text-sm">Giảng viên</TabsTrigger>
              <TabsTrigger value="reviews"     className="pb-3 text-sm">Đánh giá</TabsTrigger>
              <TabsTrigger value="classes"     className="pb-3 text-sm">Lớp học</TabsTrigger>
            </TabsList>

            {/* Save button – only meaningful on overview tab */}
            {activeTab === "overview" && (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  const btn = document.getElementById("__program-form-submit");
                  if (btn) (btn as HTMLButtonElement).click();
                }}
                className="mb-1 h-9 gap-1.5 rounded-xl bg-[#E94B3C] px-5 text-sm font-semibold text-white hover:bg-[#d43f33] shadow-sm"
              >
                <Save className="size-3.5" />
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            )}
          </div>

          {/* Overview tab */}
          <TabsContent value="overview">
            <ProgramForm
              initialValues={{
                code:              program.code,
                name:              program.name,
                seriesName:        program.seriesName,
                description:       program.description,
                category:          program.category || "Science",
                level:             program.level,
                estimatedDuration: program.estimatedDuration,
                skillsGained:      program.skillsGained,
                thumbnailUrl:      program.thumbnailUrl || "",
                status:            program.status,
                price:             program.price,
              }}
              onSubmit={handleUpdate}
              isLoading={isSubmitting}
            />
          </TabsContent>

          {/* Curriculum builder tab */}
          <TabsContent value="curriculum">
            <CurriculumBuilder program={program} onRefresh={router.refresh} />
          </TabsContent>

          {/* Placeholder tabs */}
          <TabsContent value="experts">
            <div className="py-4">
              <ManagerEmptyState
                title="Giảng viên & Chuyên gia"
                description={`Gán giảng viên phụ trách hoặc chuyên gia phản biện cho chương trình ${program.name}.`}
                icon={Users}
              />
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="py-4">
              <ManagerEmptyState
                title="Đánh giá từ Học viên"
                description={`Danh sách ý kiến phản hồi và đánh giá sao cho chương trình ${program.name}.`}
                icon={Star}
              />
            </div>
          </TabsContent>

          <TabsContent value="classes">
            <div className="py-4">
              <ManagerEmptyState
                title="Lớp học của Chương trình"
                description={`Danh sách các lớp đang mở, đã kết thúc hoặc chuẩn bị tuyển sinh của chương trình ${program.name}.`}
                icon={GraduationCap}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
