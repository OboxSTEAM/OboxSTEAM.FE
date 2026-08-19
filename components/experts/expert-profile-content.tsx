"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { Expert, ExpertProgram } from "@/lib/api/entities/expert";
import {
  getExpertAvatarUrl,
  getExpertInitials,
} from "@/lib/programs/format";
import { cn } from "@/lib/utils";

type ExpertProfileContentProps = {
  expert: Expert;
  currentProgramId?: string;
  className?: string;
};

function isUsableExternalUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sortExpertPrograms(
  programs: ExpertProgram[],
  currentProgramId?: string,
): ExpertProgram[] {
  return [...programs].sort((left, right) => {
    if (currentProgramId) {
      if (left.programId === currentProgramId) return -1;
      if (right.programId === currentProgramId) return 1;
    }
    return left.name.localeCompare(right.name, "vi");
  });
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm italic text-muted-foreground">{children}</p>
  );
}

function DossierSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="border-b border-border pb-2 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ExpertIdentityHeader({
  fullName,
  title,
  organization,
  code,
  avatarUrl,
  linkedInUrl,
  className,
}: {
  fullName: string;
  title: string;
  organization: string;
  code?: string;
  avatarUrl: string | null;
  linkedInUrl?: string;
  className?: string;
}) {
  const hasLinkedIn = isUsableExternalUrl(linkedInUrl);

  return (
    <header className={cn("flex items-start gap-5", className)}>
      <Avatar className="size-24 shrink-0 rounded-md after:rounded-md sm:size-28">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="" className="rounded-md object-cover" />
        ) : null}
        <AvatarFallback className="rounded-md bg-muted font-heading text-lg font-semibold text-muted-foreground">
          {getExpertInitials(fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-heading text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
          {fullName || "Chuyên gia"}
        </p>
        {title ? (
          <p className="mt-1.5 text-sm font-medium text-foreground/80">{title}</p>
        ) : (
          <p className="mt-1.5 text-sm italic text-muted-foreground">
            Chưa cập nhật chức danh
          </p>
        )}
        {organization ? (
          <p className="mt-1 text-sm text-muted-foreground">{organization}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          {code ? (
            <span className="font-mono tracking-wide">{code}</span>
          ) : null}
          {hasLinkedIn && linkedInUrl ? (
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
            >
              Hồ sơ LinkedIn
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ProgramBoard({
  programs,
  currentProgramId,
}: {
  programs: ExpertProgram[];
  currentProgramId?: string;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return programs;
    return programs.filter((item) => {
      const haystack = `${item.name} ${item.code} ${item.roleInBoard}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [programs, query]);

  if (programs.length === 0) {
    return <EmptyNote>Chưa gán chương trình.</EmptyNote>;
  }

  return (
    <div className="space-y-3">
      {programs.length > 5 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Lọc theo tên, mã hoặc vai trò..."
            className="h-9 rounded-lg pl-9 text-sm"
          />
        </div>
      ) : null}
      {visible.length === 0 ? (
        <EmptyNote>Không có chương trình khớp.</EmptyNote>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {visible.map((item) => {
            const isCurrent = item.programId === currentProgramId;
            return (
              <li key={item.programId} className="py-2.5">
                <Link
                  href={`/programs/${item.programId}`}
                  className="group flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
                      {item.name}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {item.code || "—"}
                      {isCurrent ? " · đang xem" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {item.roleInBoard || "Chưa cập nhật vai trò"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ExpertProfileContent({
  expert,
  currentProgramId,
  className,
}: ExpertProfileContentProps) {
  const avatarUrl = getExpertAvatarUrl(expert.avatarUrl);
  const programs = sortExpertPrograms(expert.programs, currentProgramId);

  return (
    <div className={cn("space-y-8", className)}>
      <ExpertIdentityHeader
        fullName={expert.fullName}
        title={expert.title}
        organization={expert.organization}
        code={expert.code}
        avatarUrl={avatarUrl}
        linkedInUrl={expert.linkedInUrl}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.85fr)]">
        <div className="space-y-8">
          <DossierSection title="Giới thiệu">
            {expert.bio ? (
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
                {expert.bio}
              </p>
            ) : (
              <EmptyNote>Chưa cập nhật giới thiệu.</EmptyNote>
            )}
          </DossierSection>

          <DossierSection title="Thành tựu">
            {expert.achievements ? (
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
                {expert.achievements}
              </p>
            ) : (
              <EmptyNote>Chưa cập nhật thành tựu.</EmptyNote>
            )}
          </DossierSection>
        </div>

        <aside className="space-y-8">
          <DossierSection title="Chuyên môn">
            {expert.specialization.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-foreground/85">
                {expert.specialization.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            ) : (
              <EmptyNote>Chưa cập nhật chuyên môn.</EmptyNote>
            )}
          </DossierSection>
        </aside>
      </div>

      <DossierSection title="Học vấn">
        {expert.degrees.length > 0 ? (
          <ul className="space-y-2.5">
            {expert.degrees.map((degree) => (
              <li key={degree.id} className="text-sm leading-relaxed">
                <span className="font-medium text-foreground">{degree.title}</span>
                {degree.institution ? (
                  <span className="text-muted-foreground">
                    {`, ${degree.institution}`}
                  </span>
                ) : null}
                {degree.year ? (
                  <span className="tabular-nums text-muted-foreground">
                    {`, ${degree.year}`}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote>Chưa cập nhật bằng cấp hoặc chứng chỉ.</EmptyNote>
        )}
      </DossierSection>

      <DossierSection title="Công bố khoa học">
        {expert.publications.length > 0 ? (
          <ol className="space-y-3">
            {expert.publications.map((publication, index) => (
              <li key={publication.id} className="text-sm leading-relaxed">
                <span className="mr-2 tabular-nums text-muted-foreground">
                  {index + 1}.
                </span>
                {isUsableExternalUrl(publication.url) ? (
                  <a
                    href={publication.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                  >
                    {publication.title}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">
                    {publication.title}
                  </span>
                )}
                {(publication.venue || publication.year) && (
                  <span className="block pl-6 text-muted-foreground">
                    {[publication.venue, publication.year].filter(Boolean).join(", ")}
                  </span>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <EmptyNote>Chưa cập nhật bài báo hoặc hội nghị.</EmptyNote>
        )}
      </DossierSection>

      <DossierSection title="Hội đồng chương trình">
        <ProgramBoard programs={programs} currentProgramId={currentProgramId} />
      </DossierSection>
    </div>
  );
}

export function ExpertProfilePreview({
  fullName,
  title,
  organization,
  avatarUrl,
  code,
  className,
}: {
  fullName: string;
  title: string;
  organization: string;
  avatarUrl: string | null;
  code?: string;
  className?: string;
}) {
  return (
    <ExpertIdentityHeader
      fullName={fullName}
      title={title}
      organization={organization}
      code={code}
      avatarUrl={avatarUrl}
      className={className}
    />
  );
}

export function ExpertProfileSkeleton({
  hideIdentity = false,
}: {
  hideIdentity?: boolean;
}) {
  return (
    <div className="space-y-8">
      {hideIdentity ? null : (
        <div className="flex items-start gap-5">
          <div className="size-24 shrink-0 animate-pulse rounded-md bg-muted sm:size-28" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-6 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-[88%] animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
