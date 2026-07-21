"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getProgramsWithModules, hydrateProgramCurriculum, type ProgramWithModules } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  buildCurriculumIndex,
  SEARCH_KIND_LABELS,
  SEARCH_KIND_ORDER,
  type CurriculumSearchItem,
  type CurriculumSearchKind,
} from "./build-curriculum-index";

type ScopeMode = "program" | "platform";

type ManagerCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function matchProgramId(pathname: string): string | null {
  const m = pathname.match(
    /^\/manager\/programs\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  return m?.[1] ?? null;
}

export function ManagerCommandPalette({
  open,
  onOpenChange,
}: ManagerCommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const routeProgramId = matchProgramId(pathname);

  const [query, setQuery] = React.useState("");
  const [scope, setScope] = React.useState<ScopeMode>("platform");
  const [loading, setLoading] = React.useState(false);
  const [programs, setPrograms] = React.useState<ProgramWithModules[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setScope(routeProgramId ? "program" : "platform");
  }, [open, routeProgramId]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getProgramsWithModules({
          page: 1,
          pageSize: 100,
        });
        const items = result?.data?.items ?? [];
        const hydrated = await Promise.all(
          items.map((program) => hydrateProgramCurriculum(program)),
        );
        if (!cancelled) {
          setPrograms(hydrated);
        }
      } catch {
        if (!cancelled) {
          setError("Không tải được dữ liệu tìm kiếm.");
          setPrograms([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const scopedProgram = React.useMemo(
    () => programs.find((p) => p.id === routeProgramId) ?? null,
    [programs, routeProgramId],
  );

  const index = React.useMemo(() => {
    const source =
      scope === "program" && scopedProgram
        ? [scopedProgram]
        : programs;
    return buildCurriculumIndex(source);
  }, [programs, scope, scopedProgram]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index;
    return index.filter((item) => {
      const hay = `${item.name} ${item.code ?? ""} ${item.parentPath}`.toLowerCase();
      return hay.includes(q);
    });
  }, [index, query]);

  const grouped = React.useMemo(() => {
    const map = new Map<CurriculumSearchKind, CurriculumSearchItem[]>();
    for (const kind of SEARCH_KIND_ORDER) map.set(kind, []);
    for (const item of filtered) {
      map.get(item.kind)?.push(item);
    }
    return map;
  }, [filtered]);

  const handleSelect = (item: CurriculumSearchItem) => {
    onOpenChange(false);
    router.push(item.href);
  };

  const canScopeToProgram = !!routeProgramId;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tìm kiếm nền tảng"
      description="Tìm chương trình, module, khóa học, hoạt động"
    >
      <Command shouldFilter={false} className="rounded-xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5E0] px-3 py-2">
          {canScopeToProgram && (
            <button
              type="button"
              onClick={() => setScope("program")}
              className={cn(
                "inline-flex max-w-[220px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                scope === "program"
                  ? "border-[#E94B3C]/30 bg-[#E94B3C]/10 text-[#E94B3C]"
                  : "border-[#E5E5E0] bg-[#FAFAF5] text-[#6B6B6B] hover:text-[#2D2D2D]",
              )}
            >
              <span className="truncate">
                {scopedProgram?.name ?? "Chương trình này"}
              </span>
              {scope === "program" && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Chuyển sang toàn nền tảng"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScope("platform");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setScope("platform");
                    }
                  }}
                  className="rounded-full p-0.5 hover:bg-[#E94B3C]/15"
                >
                  <X className="size-3" />
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setScope("platform")}
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              scope === "platform"
                ? "border-[#2D2D2D]/20 bg-[#2D2D2D] text-white"
                : "border-[#E5E5E0] bg-[#FAFAF5] text-[#6B6B6B] hover:text-[#2D2D2D]",
            )}
          >
            Toàn nền tảng
          </button>
        </div>

        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Tìm theo tên, mã, đường dẫn cha…"
        />

        <CommandList>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#6B6B6B]">
              <Loader2 className="size-4 animate-spin" />
              Đang tải…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-[#E94B3C]">{error}</div>
          ) : (
            <>
              <CommandEmpty>Không có kết quả phù hợp.</CommandEmpty>
              {SEARCH_KIND_ORDER.map((kind) => {
                const rows = grouped.get(kind) ?? [];
                if (rows.length === 0) return null;
                return (
                  <CommandGroup key={kind} heading={SEARCH_KIND_LABELS[kind]}>
                    {rows.map((item) => (
                      <CommandItem
                        key={`${item.kind}-${item.id}`}
                        value={`${item.kind}-${item.id}-${item.name}`}
                        onSelect={() => handleSelect(item)}
                        className="items-start py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-[#2D2D2D]">
                              {item.name}
                            </span>
                            {item.code && (
                              <span className="shrink-0 rounded border border-[#E5E5E0] bg-[#FAFAF5] px-1.5 py-px font-mono text-[10px] text-[#6B6B6B]">
                                {item.code}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-[#8c8678]">
                            {item.parentPath}
                          </p>
                          {item.issueHint && (
                            <p className="mt-0.5 text-[11px] font-medium text-[#c97800]">
                              {item.issueHint}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          )}
        </CommandList>

        <div className="flex items-center justify-between border-t border-[#E5E5E0] px-3 py-2 text-[10px] text-[#8c8678]">
          <span>⌘K / Ctrl+K để mở</span>
          <span>Enter để mở · Esc đóng</span>
        </div>
      </Command>
    </CommandDialog>
  );
}
