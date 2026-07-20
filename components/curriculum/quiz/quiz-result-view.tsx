"use client";

import type { QuizResult } from "@/lib/api";
import { buildQuizResultOutcome } from "@/lib/curriculum/build-assignment-outcome";

import { AssignmentResultCard } from "../assignment-outcome";

type QuizResultViewProps = {
  result: QuizResult;
};

export function QuizResultView({ result }: QuizResultViewProps) {
  return <AssignmentResultCard {...buildQuizResultOutcome(result)} />;
}
