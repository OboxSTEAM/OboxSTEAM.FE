import type { ClassSession } from "@/lib/api/entities/class-session";
import type { ClassSessionExpert } from "@/lib/api/entities/class-session-expert";
import { getClassSessionExperts } from "@/lib/api/class-session-experts";
import { getExpertAvatarUrl } from "@/lib/programs/format";

export type CoTeachExpertFace = {
  expertId: string;
  fullName: string;
  avatarUrl: string | null;
  code: string;
  classSessionId: string;
};

const PAGE_SIZE = 100;
/** Stop if hasNext never clears. 100 per page covers a class many times over. */
const MAX_PAGES = 20;

async function listAcceptedInvites(classId: string): Promise<ClassSessionExpert[]> {
  const invites: ClassSessionExpert[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= MAX_PAGES) {
    const result = await getClassSessionExperts({
      classId,
      status: "Accepted",
      page,
      pageSize: PAGE_SIZE,
    });
    const pageData = result?.data;
    invites.push(...(pageData?.items ?? []));
    hasNext = Boolean(pageData?.hasNext);
    page += 1;
  }

  return invites;
}

/** Accepted co-teachers for a class the student is actively enrolled in. */
export async function loadAcceptedCoTeachExperts(
  classId: string,
): Promise<CoTeachExpertFace[]> {
  const invites = await listAcceptedInvites(classId);

  return invites.map((invite) => ({
    classSessionId: invite.classSessionId,
    expertId: invite.expertId,
    fullName: invite.expertName.trim() || "Chuyên gia",
    avatarUrl: getExpertAvatarUrl(invite.expertAvatarUrl),
    code: invite.expertCode,
  }));
}

function dedupeFaces(faces: CoTeachExpertFace[]): CoTeachExpertFace[] {
  const seen = new Set<string>();
  const unique: CoTeachExpertFace[] = [];
  for (const face of faces) {
    if (seen.has(face.expertId)) continue;
    seen.add(face.expertId);
    unique.push(face);
  }
  return unique;
}

export function groupCoTeachExpertsByActivity(
  experts: CoTeachExpertFace[],
  sessions: ClassSession[],
): Record<string, CoTeachExpertFace[]> {
  const bySessionId = new Map<string, CoTeachExpertFace[]>();
  for (const expert of experts) {
    const bucket = bySessionId.get(expert.classSessionId) ?? [];
    bucket.push(expert);
    bySessionId.set(expert.classSessionId, bucket);
  }

  const byActivityId: Record<string, CoTeachExpertFace[]> = {};
  for (const session of sessions) {
    if (!session.activityId) continue;
    const faces = bySessionId.get(session.id);
    if (!faces?.length) continue;
    byActivityId[session.activityId] = dedupeFaces([
      ...(byActivityId[session.activityId] ?? []),
      ...faces,
    ]);
  }

  return byActivityId;
}
