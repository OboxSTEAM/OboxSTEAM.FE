import { ArrowRight } from "lucide-react";

import { TextChange } from "@/components/advisory-chat/changes/text-change";
import {
  changeFieldLabel,
  formatChangeValue,
  isLongTextField,
  toPlainText,
  toStringList,
} from "@/lib/advisory/change-format";
import type { CurriculumChangeField, CurriculumChangeItem, CurriculumTargetType } from "@/lib/api";

type FieldChangeProps = {
  field: CurriculumChangeField;
  targetType: CurriculumTargetType;
  changeKind: CurriculumChangeItem["changeKind"];
};

/** One changed field: word diff for long text, item diff for lists, before → after otherwise. */
export function FieldChange({ field, targetType, changeKind }: FieldChangeProps) {
  const label = changeFieldLabel(field, targetType);

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <FieldValue field={field} changeKind={changeKind} />
    </div>
  );
}

function FieldValue({
  field,
  changeKind,
}: {
  field: CurriculumChangeField;
  changeKind: CurriculumChangeItem["changeKind"];
}) {
  if (changeKind === "Created" || changeKind === "Deleted") {
    const value = changeKind === "Created" ? field.after : field.before;
    const text = formatChangeValue(field, value);
    return (
      <p className="line-clamp-4 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
        {text ?? <EmptyValue />}
      </p>
    );
  }

  if (isLongTextField(field)) {
    return <TextChange before={toPlainText(field.before)} after={toPlainText(field.after)} />;
  }

  if (field.valueType === "List") {
    return <ListChange before={toStringList(field.before)} after={toStringList(field.after)} />;
  }

  const before = formatChangeValue(field, field.before);
  const after = formatChangeValue(field, field.after);
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs">
      {before ? (
        <del className="rounded-sm bg-destructive/10 px-1 text-destructive line-through decoration-destructive/60">
          {before}
        </del>
      ) : (
        <EmptyValue />
      )}
      <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-label="thành" />
      {after ? (
        <ins className="rounded-sm bg-emerald-500/15 px-1 text-emerald-800 no-underline dark:text-emerald-300">
          {after}
        </ins>
      ) : (
        <EmptyValue />
      )}
    </p>
  );
}

function ListChange({ before, after }: { before: string[]; after: string[] }) {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const removed = before.filter((item) => !afterSet.has(item));
  const added = after.filter((item) => !beforeSet.has(item));

  if (removed.length === 0 && added.length === 0) {
    return <p className="text-xs text-muted-foreground">Thay đổi thứ tự</p>;
  }

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Thay đổi danh sách">
      {added.map((item) => (
        <li key={`+${item}`}>
          <ins className="inline-block rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-800 no-underline dark:text-emerald-300">
            + {item}
          </ins>
        </li>
      ))}
      {removed.map((item) => (
        <li key={`-${item}`}>
          <del className="inline-block rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] text-destructive line-through decoration-destructive/60">
            − {item}
          </del>
        </li>
      ))}
    </ul>
  );
}

function EmptyValue() {
  return <span className="text-xs text-muted-foreground italic">Trống</span>;
}
