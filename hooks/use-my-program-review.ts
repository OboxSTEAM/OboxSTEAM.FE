"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getMyProgramReview, type MyProgramReview } from "@/lib/api/programs";
import { isStudentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown } from "@/lib/errors";

type UseMyProgramReviewOptions = {
  /** Extra gate on top of "authenticated student" (e.g. enrollment Completed). */
  enabled?: boolean;
};

type UseMyProgramReviewResult = {
  data: MyProgramReview | null;
  isStudent: boolean;
  isLoading: boolean;
  refresh: () => void;
  mutate: (
    updater:
      | MyProgramReview
      | null
      | ((prev: MyProgramReview | null) => MyProgramReview | null),
  ) => void;
};

/** Student's review state for one program (`GET /reviews/me`). Null for non-students. */
export function useMyProgramReview(
  programId: string,
  { enabled = true }: UseMyProgramReviewOptions = {},
): UseMyProgramReviewResult {
  const { isAuthenticated, isHydrated, isLoading, profile } = useCurrentUser();
  const isStudent =
    isHydrated && !isLoading && isAuthenticated && isStudentRole(profile?.role);
  const canFetch = isStudent && enabled;

  const { data, isLoading: isFetching, retry, mutate } = useClientFetch({
    enabled: canFetch,
    minSkeletonMs: 0,
    fetcher: async () => {
      const result = await getMyProgramReview(programId);
      return result?.data ?? null;
    },
    deps: [programId, canFetch],
    onError: (error) => showAppErrorFromUnknown(error, "programs.reviews.mine"),
  });

  return {
    data: canFetch ? data : null,
    isStudent,
    isLoading: canFetch && isFetching,
    refresh: retry,
    mutate,
  };
}
