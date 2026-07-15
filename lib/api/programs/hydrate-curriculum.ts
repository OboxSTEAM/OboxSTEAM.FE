import { getModuleById } from "@/lib/api/modules";
import type { ProgramWithModules } from "@/lib/api/entities/program";

/**
 * `GET /api/programs/{id}` often returns modules with empty `courses`.
 * Nested courses (+ activities) live on `GET /api/modules/{id}` — hydrate them here
 * so the manager curriculum tree stays in sync after program load / refresh.
 */
export async function hydrateProgramCurriculum(
  program: ProgramWithModules,
): Promise<ProgramWithModules> {
  const modules = program.modules ?? [];
  if (modules.length === 0) return program;

  const hydrated = await Promise.all(
    modules.map(async (mod) => {
      try {
        const result = await getModuleById(mod.id);
        const detail = result?.data;
        if (!detail) return mod;
        return {
          ...mod,
          ...detail,
          courses: detail.courses ?? [],
        };
      } catch {
        return mod;
      }
    }),
  );

  return { ...program, modules: hydrated };
}
