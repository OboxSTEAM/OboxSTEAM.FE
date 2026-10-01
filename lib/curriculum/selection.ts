/** Node selected in the manager curriculum tree; mirrors the `?node=&id=` query. */
export type SelectedNode =
  | { kind: "program" }
  | { kind: "module-new" }
  | { kind: "module"; id: string }
  | { kind: "course-new"; moduleId: string }
  | { kind: "course"; id: string; moduleId: string }
  | { kind: "activity-new"; courseId: string }
  | { kind: "activity"; id: string; courseId: string }
  | { kind: "assignment-new"; moduleId: string }
  | { kind: "assignment"; id: string; moduleId: string }
  | { kind: "milestone-new"; moduleId: string }
  | { kind: "milestone"; id: string; moduleId: string }
  | null;

export function selToQuery(sel: SelectedNode): string {
  if (!sel || sel.kind === "program") return "";
  const params = new URLSearchParams();
  if (sel.kind === "module-new") {
    params.set("node", "module-new");
  } else if (sel.kind === "module") {
    params.set("node", "module");
    params.set("id", sel.id);
  } else if (sel.kind === "course-new") {
    params.set("node", "course-new");
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "course") {
    params.set("node", "course");
    params.set("id", sel.id);
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "activity-new") {
    params.set("node", "activity-new");
    params.set("courseId", sel.courseId);
  } else if (sel.kind === "activity") {
    params.set("node", "activity");
    params.set("id", sel.id);
    params.set("courseId", sel.courseId);
  } else if (sel.kind === "assignment-new") {
    params.set("node", "assignment-new");
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "assignment") {
    params.set("node", "assignment");
    params.set("id", sel.id);
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "milestone-new") {
    params.set("node", "milestone-new");
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "milestone") {
    params.set("node", "milestone");
    params.set("id", sel.id);
    params.set("moduleId", sel.moduleId);
  }
  return params.toString();
}

export function selectionKey(sel: SelectedNode): string {
  if (!sel || sel.kind === "program") return "program";
  if ("id" in sel) return `${sel.kind}:${sel.id}`;
  return sel.kind;
}
