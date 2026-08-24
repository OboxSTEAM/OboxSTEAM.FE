"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AccountNavItem } from "@/lib/navigation/account-nav-items";
import { cn } from "@/lib/utils";

export const ACCOUNT_NAV_SHEET_ID = "account-nav-sheet";

type AccountNavSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  header: ReactNode;
  items: AccountNavItem[];
};

function groupMainItems(items: AccountNavItem[]) {
  const sections: Array<{ label: string; items: AccountNavItem[] }> = [];
  for (const item of items) {
    const label = item.group ?? "";
    const prev = sections[sections.length - 1];
    if (prev?.label === label) {
      prev.items.push(item);
    } else {
      sections.push({ label, items: [item] });
    }
  }
  return sections;
}

export function AccountNavSheet({
  open,
  onOpenChange,
  header,
  items,
}: AccountNavSheetProps) {
  const mainItems = items.filter((item) => !item.footer);
  const footerItems = items.filter((item) => item.footer);
  const sections = groupMainItems(mainItems);

  const close = () => onOpenChange(false);

  const handleActivate = (item: AccountNavItem) => {
    item.onClick?.();
    close();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup
        id={ACCOUNT_NAV_SHEET_ID}
        side="right"
        className={cn(
          "w-[min(22rem,92vw)] border-l border-[#D8D8D3] bg-white shadow-[-16px_0_48px_rgba(45,45,45,0.12)]",
          "dark:border-border dark:bg-popover",
        )}
        backdropClassName="bg-[#2D2D2D]/40"
      >
        <SheetHeader className="relative border-[#E5E5E0] px-5 pb-5 pt-6 dark:border-border">
          <SheetTitle className="sr-only">Menu tài khoản</SheetTitle>
          <SheetClose className="top-4 right-4" />
          {header}
        </SheetHeader>

        <SheetBody className="flex flex-col gap-6 px-3 py-4">
          {sections.map((section, sectionIdx) => (
            <section
              key={`${section.label}-${sectionIdx}`}
              aria-label={section.label || undefined}
            >
              {section.label ? (
                <h3 className="m-0 px-2.5 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">
                  {section.label}
                </h3>
              ) : null}
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0" role="list">
                {section.items.map((item) => (
                  <li key={`${item.label}-${item.link ?? "action"}`}>
                    <AccountNavRow item={item} onActivate={handleActivate} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </SheetBody>

        {footerItems.length > 0 ? (
          <div className="mt-auto shrink-0 border-t border-[#E5E5E0] px-3 py-4 dark:border-border">
            <ul className="m-0 flex list-none flex-col gap-2 p-0" role="list">
              {footerItems.map((item) => (
                <li key={item.label}>
                  <AccountNavRow
                    item={item}
                    onActivate={handleActivate}
                    variant="footer"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </SheetPopup>
    </Sheet>
  );
}

function AccountNavRow({
  item,
  onActivate,
  variant = "default",
}: {
  item: AccountNavItem;
  onActivate: (item: AccountNavItem) => void;
  variant?: "default" | "footer";
}) {
  const Icon = item.icon;
  const isFooter = variant === "footer";

  const className = cn(
    "flex w-full min-h-[48px] items-center gap-3 rounded-xl px-2.5 py-2.5 text-left no-underline transition-colors duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-[#E94B3C]/40 focus-visible:ring-offset-2",
    isFooter
      ? "border border-[#E94B3C]/25 bg-[#E94B3C]/8 font-semibold text-[#E94B3C] hover:border-[#E94B3C]/40 hover:bg-[#E94B3C]/14"
      : "bg-transparent font-semibold tracking-tight text-[#2D2D2D] hover:bg-[#F5F5F0] dark:text-foreground dark:hover:bg-muted",
  );

  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug">{item.label}</span>
        {item.description && !isFooter ? (
          <span className="mt-0.5 block text-sm font-normal leading-snug text-[#6B6B6B]">
            {item.description}
          </span>
        ) : null}
      </span>
      {Icon ? (
        <Icon
          className={cn(
            "size-5 shrink-0",
            isFooter ? "text-[#E94B3C]" : "text-[#E94B3C]",
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (item.onClick || !item.link) {
    return (
      <button
        type="button"
        className={className}
        aria-label={item.ariaLabel}
        onClick={() => onActivate(item)}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.link}
      className={className}
      aria-label={item.ariaLabel}
      onClick={() => onActivate(item)}
    >
      {content}
    </Link>
  );
}
