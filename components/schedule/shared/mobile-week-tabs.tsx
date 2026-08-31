import { Skeleton } from "@/components/ui/skeleton";
import { formatDayColumnLabel, isTodayDateOnly } from "@/lib/schedules/week";
import { cn } from "@/lib/utils";

import { ScheduleSessionCard } from "./session-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScheduleDayData, ScheduleDisplaySession } from "./types";

export function ScheduleWeekSkeleton({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-7 gap-0 overflow-hidden rounded-2xl border border-border">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-64 rounded-none",
            index > 0 && "border-l border-border",
          )}
        />
      ))}
    </div>
  );
}

export function ScheduleMobileWeekTabs<T extends ScheduleDisplaySession>({
  days,
  activeDay,
  onDayChange,
  onOpen,
  emptyLabel = "Không có buổi học",
  showTitle = false,
}: {
  days: ScheduleDayData<T>[];
  activeDay: string | null;
  onDayChange: (date: string) => void;
  onOpen: (session: T) => void;
  emptyLabel?: string;
  showTitle?: boolean;
}) {
  return (
    <Tabs
      value={activeDay ?? undefined}
      onValueChange={onDayChange}
      className="gap-4"
    >
      <TabsList className="flex h-auto w-full gap-0 overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white p-0 shadow-sm">
        {days.map((day, index) => {
          const { weekday } = formatDayColumnLabel(day.date);
          const today = isTodayDateOnly(day.date);
          return (
            <TabsTrigger
              key={day.date}
              value={day.date}
              className={cn(
                "h-auto flex-1 rounded-none border-0 px-1 py-2.5 text-[11px] shadow-none after:hidden",
                "data-active:bg-[#E94B3C] data-active:text-white data-active:shadow-none",
                index > 0 && "border-l border-[#E5E5E0]",
                today &&
                  "bg-[#FFF5F4] font-bold text-[#E94B3C] data-active:bg-[#E94B3C] data-active:text-white",
              )}
            >
              <span className="flex flex-col items-center gap-0.5">
                <span className="font-bold uppercase tracking-wide">
                  {weekday}
                </span>
                {day.sessions.length > 0 ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      "group-data-active:bg-white bg-[#E94B3C]",
                    )}
                    aria-label={`${day.sessions.length} buổi`}
                  />
                ) : (
                  <span className="h-1.5" aria-hidden />
                )}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {days.map((day) => (
        <TabsContent key={day.date} value={day.date} className="mt-0">
          <div className="space-y-2">
            {day.sessions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </p>
            ) : (
              day.sessions.map((session) => (
                <ScheduleSessionCard
                  key={session.id}
                  session={session}
                  showTitle={showTitle}
                  onOpen={onOpen}
                />
              ))
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
