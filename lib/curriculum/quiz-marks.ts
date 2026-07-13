const STORAGE_PREFIX = "obox-quiz-marks:";

function readMarks(submissionId: string): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${submissionId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return new Set();
  }
}

function writeMarks(submissionId: string, marks: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${submissionId}`, JSON.stringify([...marks]));
}

export function getQuizMarks(submissionId: string): Set<string> {
  return readMarks(submissionId);
}

export function setQuizMark(
  submissionId: string,
  questionId: string,
  marked: boolean,
): void {
  const marks = readMarks(submissionId);
  if (marked) {
    marks.add(questionId);
  } else {
    marks.delete(questionId);
  }
  writeMarks(submissionId, marks);
}

export function toggleQuizMark(submissionId: string, questionId: string): boolean {
  const marks = readMarks(submissionId);
  const next = !marks.has(questionId);
  setQuizMark(submissionId, questionId, next);
  return next;
}
