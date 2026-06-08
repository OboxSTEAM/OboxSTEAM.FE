"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AnimatedContent from "@/components/AnimatedContent";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  getPrograms,
  type Paginated,
  type Program,
  type ProgramListQuery,
} from "@/lib/api/programs";
import {
  DEFAULT_PROGRAM_QUERY,
  PROGRAM_GRID_MIN_SKELETON_MS,
} from "@/lib/programs/constants";

import {
  getClearedProgramQuery,
  PROGRAM_SEARCH_DEBOUNCE_MS,
  ProgramFilters,
} from "./program-filters";
import { ProgramGrid } from "./program-grid";
import { ProgramPagination } from "./program-pagination";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function ProgramsSection() {
  const [query, setQuery] = useState<ProgramListQuery>(DEFAULT_PROGRAM_QUERY);
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [data, setData] = useState<Paginated<Program> | null>(null);
  const [isGridLoading, setIsGridLoading] = useState(true);
  const [resultsEpoch, setResultsEpoch] = useState(0);
  const hasLoadedOnceRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      setIsGridLoading(true);
      setCommittedSearch(trimmed);
      setQuery((current) =>
        current.page === 1 ? current : { ...current, page: 1 },
      );
    }, PROGRAM_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const activeQuery = useMemo<ProgramListQuery>(
    () => ({
      ...query,
      search: committedSearch || undefined,
    }),
    [query, committedSearch],
  );

  const isSearchPending = searchInput.trim() !== committedSearch;

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    const finishLoading = async (nextData: Paginated<Program> | null) => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, PROGRAM_GRID_MIN_SKELETON_MS - elapsed);

      if (remaining > 0) {
        await wait(remaining);
      }

      if (cancelled) return;

      if (nextData) {
        setData(nextData);
        hasLoadedOnceRef.current = true;
        setResultsEpoch((epoch) => epoch + 1);
      } else if (!hasLoadedOnceRef.current) {
        setData(null);
      }

      setIsGridLoading(false);
    };

    const loadPrograms = async () => {
      try {
        const result = await getPrograms(activeQuery);
        await finishLoading(result?.data ?? null);
      } catch (error) {
        if (!cancelled) {
          showAppErrorFromUnknown(error, "programs.list");
          await finishLoading(null);
        }
      }
    };

    void loadPrograms();

    return () => {
      cancelled = true;
    };
  }, [activeQuery]);

  const handleQueryChange = useCallback((patch: Partial<ProgramListQuery>) => {
    setIsGridLoading(true);
    setQuery((current) => ({
      ...current,
      ...patch,
    }));
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setIsGridLoading(true);
    setSearchInput("");
    setCommittedSearch("");
    setQuery(getClearedProgramQuery());
  }, []);

  const scrollToProgramsTop = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    section.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      setIsGridLoading(true);
      setQuery((current) => ({
        ...current,
        page,
      }));
      scrollToProgramsTop();
    },
    [scrollToProgramsTop],
  );

  const programs = data?.items ?? [];

  return (
    <section
      ref={sectionRef}
      id="programs"
      className="relative py-20 lg:py-28 bg-[#1A1A1A] overflow-hidden scroll-mt-[4.5rem] sm:scroll-mt-20"
      aria-labelledby="programs-heading"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(233,75,60,0.12) 0%, transparent 68%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(79,195,247,0.08) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="mb-8 lg:mb-10 max-w-xl">
            <EyebrowChip dark className="mb-3">
              Chương trình STEAM
            </EyebrowChip>
            <h2
              id="programs-heading"
              className="font-heading font-extrabold text-white text-balance tracking-tight leading-[0.97]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Khám phá STEAM.
            </h2>
            <p className="mt-3 text-white/50 text-sm sm:text-base leading-relaxed">
              Tìm, lọc và chọn chương trình phù hợp — mỗi khóa học là một bước
              trong hành trình portfolio của bạn.
            </p>
          </div>
        </AnimatedContent>

        <div className="mb-8">
          <ProgramFilters
            query={activeQuery}
            searchInput={searchInput}
            isSearchPending={isSearchPending}
            onSearchInputChange={handleSearchInputChange}
            onQueryChange={handleQueryChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        <ProgramGrid
          programs={programs}
          isLoading={isGridLoading}
          resultsEpoch={resultsEpoch}
          onClearFilters={handleClearFilters}
        />

        {data && !isGridLoading && (
          <ProgramPagination
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            hasPrevious={data.hasPrevious}
            hasNext={data.hasNext}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </section>
  );
}
