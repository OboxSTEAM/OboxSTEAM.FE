import { z } from "zod";

import {
  bankQuestionSchema,
  type BankQuestion,
} from "@/lib/api/entities/bank-question";

const STORAGE_PREFIX = "obox:bank-questions:";

function storageKey(questionBankId: string): string {
  return `${STORAGE_PREFIX}${questionBankId}`;
}

/** Load questions cached after CSV import (BE has no list-questions API yet). */
export function loadCachedBankQuestions(questionBankId: string): BankQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(questionBankId));
    if (!raw) return [];
    const parsed = z.array(bankQuestionSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/**
 * Persist bank questions for reload. Returns false if quota/storage fails
 * (e.g. very large banks).
 */
export function saveCachedBankQuestions(
  questionBankId: string,
  questions: BankQuestion[],
): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(storageKey(questionBankId), JSON.stringify(questions));
    return true;
  } catch {
    return false;
  }
}

export function clearCachedBankQuestions(questionBankId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(questionBankId));
  } catch {
    /* ignore */
  }
}
