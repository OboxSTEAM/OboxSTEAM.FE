"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MANAGER_NAV_GROUPS } from "@/lib/manager/nav";
import { ScrollArea } from "@/components/ui/scroll-area";

const LOGO_URL =
  "https://oboxsteam-bucket-main.s3.ap-southeast-1.amazonaws.com/Seed/Material/logo-obox.png";

export function ManagerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[#E5E5E0] bg-[#FAFAF5]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[#E5E5E0] px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src={LOGO_URL}
            alt="OboxSTEAM"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="font-heading text-base font-bold tracking-tight text-[#2D2D2D]">
            OboxSTEAM
          </span>
        </Link>
        <span className="ml-auto rounded-full bg-[#E94B3C]/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#E94B3C]">
          Manager
        </span>
      </div>

      {/* Nav groups */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-5">
          {MANAGER_NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B]">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/manager"
                      ? pathname === "/manager"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[#E94B3C]/10 text-[#E94B3C]"
                            : "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon
                          className={cn("size-4 shrink-0", isActive ? "text-[#E94B3C]" : "text-[#6B6B6B]")}
                          aria-hidden
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
