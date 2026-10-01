"use client";

import Link from "next/link";
import { Target } from "lucide-react";

import { useClientFetch } from "@/hooks/use-client-fetch";
import { getDashboardEnrollment, getPrograms, type StatusCount } from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";

import { programEndPassRate } from "./chart-data";
import { formatCount } from "./dashboard-utils";

const percentFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});

type ProgramPassRow = {
  id: string;
  name: string;
  passed: number;
  finished: number;
  rate: number;
};

type PassRateByProgramCardProps = {
  items: StatusCount[];
};

export function PassRateByProgramCard({ items }: PassRateByProgramCardProps) {
  const overall = programEndPassRate(items);
  const { data, isLoading } = useClientFetch({
    fetcher: loadProgramPassRows,
    deps: [],
    minSkeletonMs: 0,
    onError: (error) => {
      showAppErrorFromUnknown(error, "dashboard.load");
    },
  });

  return (
    <section className="flex h-full min-w-0 flex-col rounded-2xl border border-border/70 bg-card p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">Tỷ lệ đạt</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Học viên đã kết thúc chương trình
          </p>
        </div>
        <Target className="size-4 shrink-0 text-steam-mathematics opacity-90" />
      </div>

      <p className="mt-2.5 font-heading text-2xl font-black tabular-nums tracking-tight text-steam-mathematics sm:text-3xl">
        {formatPercent(overall.rate)}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
        {overall.finished > 0
          ? `${formatCount(overall.passed)} hoàn thành / ${formatCount(overall.finished)} đã kết thúc`
          : "Chưa có học viên kết thúc khóa"}
      </p>

      {isLoading && !data ? (
        <div className="mt-3 h-16 animate-pulse rounded-xl bg-border/70" />
      ) : data && data.length > 0 ? (
        <ul className="mt-2 max-h-[180px] min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
          {data.map((program) => (
            <li key={program.id}>
              <Link
                href={`/manager/programs/${program.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-foreground">
                    {program.name}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {formatCount(program.passed)} hoàn thành /{" "}
                    {formatCount(program.finished)} đã kết thúc
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                  {formatPercent(program.rate)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

async function loadProgramPassRows(): Promise<ProgramPassRow[]> {
  const programs = [];
  let page = 1;

  for (let guard = 0; guard < 5; guard += 1) {
    const result = await getPrograms({ page, pageSize: 100, sortBy: "name" });
    const pageData = result.data;
    programs.push(...(pageData?.items ?? []));
    if (!pageData?.hasNext) break;
    page += 1;
  }

  const rows = await mapPool(programs, 4, async (program) => {
    try {
      const result = await getDashboardEnrollment({ programId: program.id });
      const pass = programEndPassRate(
        result.data?.programEnrollmentsByStatus ?? [],
      );
      if (pass.finished <= 0) return null;
      return {
        id: program.id,
        name: program.name.trim() || "Chương trình không tên",
        passed: pass.passed,
        finished: pass.finished,
        rate: pass.rate,
      };
    } catch {
      return null;
    }
  });

  return rows
    .filter((row): row is ProgramPassRow => row != null)
    .sort((a, b) => b.passed - a.passed || a.name.localeCompare(b.name, "vi"));
}
