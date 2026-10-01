"use client";

import { useState, type ReactNode } from "react";
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  FRAMEWORK_RULE_GROUPS,
  type BooleanRuleKey,
  type FrameworkRuleGroup,
  type FrameworkRuleItem,
  type NumericRuleKey,
} from "@/lib/frameworks/rule-fields";
import type { FrameworkEditorFormValues } from "@/lib/validations/program-frameworks";
import { cn } from "@/lib/utils";

type FrameworkRulesSectionProps = {
  control: Control<FrameworkEditorFormValues>;
  register: UseFormRegister<FrameworkEditorFormValues>;
  errors: FieldErrors<FrameworkEditorFormValues>;
  disabled: boolean;
};

type RowProps<K extends FrameworkRuleItem["kind"]> = {
  item: Extract<FrameworkRuleItem, { kind: K }>;
  control: Control<FrameworkEditorFormValues>;
  register: UseFormRegister<FrameworkEditorFormValues>;
  errors: FieldErrors<FrameworkEditorFormValues>;
  disabled: boolean;
};

const ROW_CLASS =
  "grid gap-x-6 gap-y-2.5 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center";
const NUMBER_INPUT_CLASS = "h-9 w-24 rounded-lg text-right tabular-nums";

/** Settings-style list of automatic curriculum rules; a blank number switches that rule off. */
export function FrameworkRulesSection(props: FrameworkRulesSectionProps) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
      {FRAMEWORK_RULE_GROUPS.map((group) => (
        <RuleGroup key={group.id} group={group} {...props} />
      ))}
    </div>
  );
}

function RuleGroup({
  group,
  ...props
}: FrameworkRulesSectionProps & { group: FrameworkRuleGroup }) {
  const [isOpen, setIsOpen] = useState(false);
  const keys = group.items.flatMap(itemKeys);
  const values = useWatch({ control: props.control, name: keys });
  const valueByKey = new Map(keys.map((key, index) => [key, values[index]]));
  const activeCount = group.items.filter((item) =>
    itemKeys(item).some((key) => isRuleValueActive(valueByKey.get(key))),
  ).length;
  // A collapsed group would hide its validation message.
  const hasError = keys.some((key) => props.errors[key] != null);
  const headingId = `fw-rule-group-${group.id}`;

  return (
    <Collapsible
      open={isOpen || hasError}
      onOpenChange={setIsOpen}
      className="border-t border-border first:border-t-0"
    >
      <h3 id={headingId}>
        <CollapsibleTrigger className="group/trigger flex w-full items-center gap-3 px-4 py-3.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 motion-reduce:transition-none">
          <span className="min-w-0 flex-1 font-heading text-base font-bold text-foreground">
            {group.title}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums",
              activeCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {activeCount > 0
              ? `${activeCount}/${group.items.length} đang bật`
              : "Chưa bật"}
          </span>
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-data-[panel-open]/trigger:rotate-180 motion-reduce:transition-none"
          />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent
        keepMounted
        role="group"
        aria-labelledby={headingId}
        className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none"
      >
        <ul className="divide-y divide-border border-t border-border">
          {group.items.map((item) => (
            <li key={itemKeys(item)[0]}>
              {item.kind === "number" ? (
                <NumberRuleRow {...props} item={item} />
              ) : item.kind === "range" ? (
                <RangeRuleRow {...props} item={item} />
              ) : (
                <BooleanRuleRow {...props} item={item} />
              )}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NumberRuleRow({ item, control, register, errors }: RowProps<"number">) {
  const value = useWatch({ control, name: item.key });
  const id = `fw-rule-${item.key}`;
  const error = errors[item.key]?.message;
  return (
    <div className={ROW_CLASS}>
      <RuleText
        label={item.label}
        hint={item.hint}
        isActive={value.trim() !== ""}
        htmlFor={id}
      />
      <div className="flex items-center gap-2 sm:justify-self-end">
        <Input
          id={id}
          inputMode="numeric"
          placeholder="Tắt"
          aria-invalid={error ? true : undefined}
          {...register(item.key)}
          className={NUMBER_INPUT_CLASS}
        />
        <Unit>{item.unit}</Unit>
      </div>
      <RuleError message={error} />
    </div>
  );
}

function RangeRuleRow({ item, control, register, errors }: RowProps<"range">) {
  const [min, max] = useWatch({ control, name: [item.minKey, item.maxKey] });
  const minError = errors[item.minKey]?.message;
  const maxError = errors[item.maxKey]?.message;
  return (
    <div className={ROW_CLASS}>
      <RuleText
        label={item.label}
        hint={item.hint}
        isActive={min.trim() !== "" || max.trim() !== ""}
      />
      <div className="flex items-center gap-2 sm:justify-self-end">
        <Input
          inputMode="numeric"
          placeholder="Tối thiểu"
          aria-label={`${item.label} tối thiểu`}
          aria-invalid={minError ? true : undefined}
          {...register(item.minKey)}
          className={NUMBER_INPUT_CLASS}
        />
        <span aria-hidden className="text-muted-foreground">
          –
        </span>
        <Input
          inputMode="numeric"
          placeholder="Tối đa"
          aria-label={`${item.label} tối đa`}
          aria-invalid={maxError ? true : undefined}
          {...register(item.maxKey)}
          className={NUMBER_INPUT_CLASS}
        />
        <Unit>{item.unit}</Unit>
      </div>
      <RuleError message={minError ?? maxError} />
    </div>
  );
}

function BooleanRuleRow({ item, control, disabled }: RowProps<"boolean">) {
  return (
    <Controller
      control={control}
      name={item.key}
      render={({ field }) => (
        <label className={cn(ROW_CLASS, disabled ? "cursor-default" : "cursor-pointer")}>
          <RuleText label={item.label} hint={item.hint} isActive={field.value} />
          <div className="flex items-center gap-2 sm:justify-self-end">
            <Switch
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
              disabled={disabled}
            />
            <Unit>{field.value ? "Bật" : "Tắt"}</Unit>
          </div>
        </label>
      )}
    />
  );
}

function RuleText({
  label,
  hint,
  isActive,
  htmlFor,
}: {
  label: string;
  hint: string;
  isActive: boolean;
  htmlFor?: string;
}) {
  const labelClass = cn(
    "block text-sm font-semibold transition-colors motion-reduce:transition-none",
    isActive ? "text-foreground" : "text-muted-foreground",
  );
  return (
    <div className="flex min-w-0 gap-2.5">
      <span
        aria-hidden
        className={cn(
          "mt-[7px] size-1.5 shrink-0 rounded-full transition-colors motion-reduce:transition-none",
          isActive ? "bg-primary" : "bg-border",
        )}
      />
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={labelClass}>
            {label}
          </label>
        ) : (
          <span className={labelClass}>{label}</span>
        )}
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function Unit({ children }: { children: ReactNode }) {
  return <span className="w-16 shrink-0 text-xs text-muted-foreground">{children}</span>;
}

function itemKeys(item: FrameworkRuleItem): (NumericRuleKey | BooleanRuleKey)[] {
  return item.kind === "range" ? [item.minKey, item.maxKey] : [item.key];
}

function isRuleValueActive(value: string | boolean | undefined): boolean {
  return typeof value === "string" ? value.trim() !== "" : value === true;
}

function RuleError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs leading-5 text-primary sm:col-span-2 sm:text-right">
      {message}
    </p>
  );
}
