"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ease-out",
        "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        "motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function SheetPopup({
  className,
  children,
  side = "left",
  ...props
}: DialogPrimitive.Popup.Props & { side?: "left" | "right" }) {
  return (
    <SheetPortal>
      <SheetBackdrop />
      <DialogPrimitive.Viewport
        data-slot="sheet-viewport"
        className={cn(
          "fixed inset-0 z-50 flex",
          side === "left" ? "justify-start" : "justify-end",
        )}
      >
        <DialogPrimitive.Popup
          data-slot="sheet-popup"
          className={cn(
            "relative z-50 flex h-full w-[min(20rem,88vw)] flex-col border-[#E5E5E0] bg-white shadow-xl outline-none",
            "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            side === "left" ? "border-r" : "border-l",
            side === "left"
              ? "data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full"
              : "data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
            "motion-reduce:transition-none motion-reduce:data-[ending-style]:translate-x-0 motion-reduce:data-[starting-style]:translate-x-0",
            className,
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 border-b border-[#E5E5E0] px-4 py-3", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-heading text-base font-semibold text-[#2D2D2D]", className)}
      {...props}
    />
  );
}

function SheetClose({ className, ...props }: DialogPrimitive.Close.Props) {
  return (
    <DialogPrimitive.Close
      data-slot="sheet-close"
      className={cn(
        "absolute top-3 right-3 rounded-lg p-1.5 text-[#6B6B6B] opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[#2D2D2D]/20 outline-none",
        className,
      )}
      {...props}
    >
      <XIcon className="size-4" />
      <span className="sr-only">Đóng</span>
    </DialogPrimitive.Close>
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("min-h-0 flex-1 overflow-y-auto", className)}
      {...props}
    />
  );
}

export { Sheet, SheetBackdrop, SheetBody, SheetClose, SheetHeader, SheetPopup, SheetPortal, SheetTitle };
