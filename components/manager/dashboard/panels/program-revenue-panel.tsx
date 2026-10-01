"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft } from "lucide-react";

import { PieCenter } from "@/components/charts/pie-center";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useContainerWidth } from "@/hooks/use-container-narrow";
import { getPrograms, type RevenueOverview } from "@/lib/api";
import type { ProgramCategory } from "@/lib/api/entities/program";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  PROGRAM_CATEGORY_META,
  PROGRAM_CATEGORY_ORDER,
} from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

import { DonutDominantLine, type DonutInsightSlice } from "../donut-insights";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { formatMoney, prefersReducedMotion } from "../dashboard-utils";

const UNASSIGNED_KEY = "unassigned";
const UNASSIGNED_FILL = "var(--muted-foreground)";
const compactMoneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 1,
  notation: "compact",
  compactDisplay: "short",
});

function formatCompactMoney(value: number): string {
  return compactMoneyFormatter.format(value);
}

type ProgramRevenuePanelProps = {
  revenue: RevenueOverview;
  isLoading?: boolean;
  revealSignature: string;
};

type CategoryLookup = Record<string, ProgramCategory | null>;

type SteamProgram = {
  id: string;
  name: string;
  amount: number;
  share: number;
};

type SteamSlice = DonutInsightSlice & {
  letter: string;
  name: string;
  amountLabel: string;
  programs: SteamProgram[];
};

export function ProgramRevenuePanel({
  revenue,
  isLoading,
  revealSignature,
}: ProgramRevenuePanelProps) {
  const reducedMotion = prefersReducedMotion();
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const width = useContainerWidth(bodyRef);
  const sideBySide = width === 0 || width >= 400;
  const pieSize =
    width > 0 && width < 360 ? 152 : width > 0 && width < 480 ? 172 : 196;
  const innerRadius = Math.round(pieSize * 0.31);

  const { data: categories, isLoading: isCategoriesLoading } = useClientFetch({
    fetcher: loadProgramCategories,
    deps: [],
    minSkeletonMs: 0,
    onError: (error) => {
      showAppErrorFromUnknown(error, "programs.list");
    },
  });

  React.useEffect(() => {
    setHoveredIndex(null);
    setSelectedKey(null);
  }, [revealSignature]);

  const slices = React.useMemo(
    () => (categories ? buildSteamRevenueSlices(revenue, categories) : []),
    [categories, revenue],
  );
  const selectedIndex = slices.findIndex((slice) => slice.key === selectedKey);
  const selected = selectedIndex >= 0 ? slices[selectedIndex] : undefined;
  const activeIndex = hoveredIndex ?? (selected ? selectedIndex : null);
  const pieData = slices.map((slice) => ({
    label: slice.label,
    value: slice.value,
    color: slice.color,
  }));

  function selectSlice(key: string) {
    setSelectedKey((current) => (current === key ? null : key));
    setHoveredIndex(null);
  }

  const showEmpty = slices.length === 0 && !isLoading && !isCategoriesLoading;

  return (
    <DashboardPanel className="flex h-full min-w-0 flex-col">
      <DashboardSectionTitle
        title="Tỷ trọng doanh thu theo STEAM"
        description="Phần trăm từng lĩnh vực · bấm để xem chương trình"
      />

      <div ref={bodyRef} className="mt-3 min-w-0">
        {isCategoriesLoading && !categories ? (
          <div className="h-[200px] animate-pulse rounded-xl bg-border/70" />
        ) : showEmpty ? (
          <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            Chưa có doanh thu theo lĩnh vực
          </div>
        ) : (
          <div
            key={revealSignature}
            className={cn(
              "flex gap-4",
              sideBySide
                ? "flex-row items-start gap-4 sm:gap-5"
                : "flex-col items-center",
            )}
          >
            <div
              className="flex shrink-0 flex-col gap-2.5"
              style={{ width: pieSize }}
            >
              <div className="aspect-square w-full" style={{ height: pieSize }}>
                <PieChart
                  data={pieData}
                  size={pieSize}
                  innerRadius={innerRadius}
                  padAngle={0.035}
                  cornerRadius={4}
                  hoveredIndex={activeIndex}
                  onHoverChange={setHoveredIndex}
                  className="h-full w-full"
                >
                  {pieData.map((slice, index) => (
                    <PieSlice
                      key={slices[index]?.key ?? slice.label}
                      index={index}
                      animate={!reducedMotion}
                      hoverEffect={reducedMotion ? "none" : "translate"}
                      hoverOffset={width > 0 && width < 400 ? 4 : 6}
                      showGlow={!reducedMotion}
                      onSelect={() => {
                        const key = slices[index]?.key;
                        if (key) selectSlice(key);
                      }}
                    />
                  ))}
                  <PieCenter
                    defaultLabel="Tổng"
                    className="overflow-hidden"
                    formatOptions={{
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                      notation: "compact",
                    }}
                  >
                    {({ label, isHovered, value }) => {
                      const slice =
                        isHovered && activeIndex !== null
                          ? slices[activeIndex]
                          : undefined;
                      return (
                        <div className="flex w-full min-w-0 flex-col items-center justify-center overflow-hidden px-1 text-center">
                          <p className="max-w-full truncate font-heading text-[clamp(0.7rem,26cqw,1rem)] font-black tabular-nums leading-none tracking-tight text-foreground">
                            {formatCompactMoney(slice?.value ?? value)}
                          </p>
                          <p className="mt-1 max-w-full truncate text-[10px] font-medium leading-none text-muted-foreground">
                            {slice?.label ?? label}
                          </p>
                          {slice ? (
                            <p className="mt-0.5 text-[10px] font-semibold tabular-nums leading-none text-foreground">
                              {slice.share.toFixed(0)}%
                            </p>
                          ) : null}
                        </div>
                      );
                    }}
                  </PieCenter>
                </PieChart>
              </div>
              <DonutDominantLine slices={slices} />
            </div>

            {selected ? (
              <ProgramList
                slice={selected}
                onBack={() => setSelectedKey(null)}
              />
            ) : (
              <ul className="max-h-[220px] w-full min-w-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
                {slices.map((slice, index) => {
                  const isHovered = activeIndex === index;
                  const isFaded = activeIndex !== null && activeIndex !== index;
                  return (
                    <li key={slice.key}>
                      <button
                        type="button"
                        aria-pressed={false}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-opacity duration-150",
                          isHovered && "bg-secondary",
                          isFaded && "opacity-40",
                        )}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onFocus={() => setHoveredIndex(index)}
                        onBlur={() => setHoveredIndex(null)}
                        onClick={() => selectSlice(slice.key)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <LetterMark letter={slice.letter} color={slice.color} />
                          <span className="truncate text-xs font-medium text-foreground">
                            {slice.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {slice.amountLabel}
                          <span className="ml-1.5 text-[10px] font-semibold text-foreground">
                            {slice.share.toFixed(0)}%
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <Link
        href="/manager/programs"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-technology hover:underline"
      >
        Quản lý chương trình
        <ArrowUpRight className="size-3.5" aria-hidden />
      </Link>
    </DashboardPanel>
  );
}

function ProgramList({
  slice,
  onBack,
}: {
  slice: SteamSlice;
  onBack: () => void;
}) {
  return (
    <div className="w-full min-w-0 flex-1">
      <button
        type="button"
        onClick={onBack}
        className="mb-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        Tất cả lĩnh vực
      </button>
      <p className="px-2 pb-1 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">{slice.label}</span>
        {" · "}
        {slice.programs.length} chương trình
      </p>
      <ul className="max-h-[180px] space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
        {slice.programs.map((program) => (
          <li
            key={program.id}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              <span className="truncate text-xs font-medium text-foreground">
                {program.name}
              </span>
            </span>
            <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {formatMoney(program.amount)}
              <span className="ml-1.5 text-[10px] font-semibold text-foreground">
                {program.share.toFixed(0)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LetterMark({ letter, color }: { letter: string; color: string }) {
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
      }}
      aria-hidden
    >
      {letter}
    </span>
  );
}

async function loadProgramCategories(): Promise<CategoryLookup> {
  const lookup: CategoryLookup = {};
  let page = 1;

  for (let guard = 0; guard < 10; guard += 1) {
    const result = await getPrograms({ page, pageSize: 100 });
    const pageData = result?.data;
    for (const program of pageData?.items ?? []) {
      lookup[program.id] = program.category ?? null;
    }
    if (!pageData?.hasNext) break;
    page += 1;
  }

  return lookup;
}

function buildSteamRevenueSlices(
  revenue: RevenueOverview,
  categories: CategoryLookup,
): SteamSlice[] {
  const programs = revenue.topProgramsByRevenue.items.filter(
    (item) => item.amount > 0,
  );
  const buckets = new Map<
    string,
    { amount: number; programs: SteamProgram[] }
  >();

  for (const item of programs) {
    const category = categories[item.programId] ?? null;
    const key =
      category && PROGRAM_CATEGORY_META[category] ? category : UNASSIGNED_KEY;
    const bucket = buckets.get(key) ?? { amount: 0, programs: [] };
    bucket.amount += item.amount;
    bucket.programs.push({
      id: item.programId,
      name: item.programName?.trim() || "Không tên",
      amount: item.amount,
      share: 0,
    });
    buckets.set(key, bucket);
  }

  const total = [...buckets.values()].reduce((sum, bucket) => sum + bucket.amount, 0);
  if (total <= 0) return [];

  const orderedKeys = [
    ...PROGRAM_CATEGORY_ORDER.filter((category) => buckets.has(category)),
    ...(buckets.has(UNASSIGNED_KEY) ? [UNASSIGNED_KEY] : []),
  ];

  return orderedKeys.map((key) => {
    const bucket = buckets.get(key)!;
    const meta =
      key === UNASSIGNED_KEY ? null : PROGRAM_CATEGORY_META[key as ProgramCategory];
    const programsInSlice = bucket.programs
      .map((program) => ({
        ...program,
        share: bucket.amount > 0 ? (program.amount / bucket.amount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      key,
      letter: meta?.letter ?? "?",
      name: meta?.label ?? "Chưa phân loại",
      label: meta ? `${meta.letter} · ${meta.label}` : "Chưa phân loại",
      value: bucket.amount,
      color: meta?.color ?? UNASSIGNED_FILL,
      share: (bucket.amount / total) * 100,
      amountLabel: formatMoney(bucket.amount),
      programs: programsInSlice,
    };
  });
}
