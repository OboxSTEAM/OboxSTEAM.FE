"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogPrimitive.Viewport
        data-slot="dialog-viewport"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <DialogPrimitive.Popup
          data-slot="dialog-popup"
          className={cn(
            "relative z-50 grid w-full max-w-lg gap-4 rounded-2xl border border-border bg-popover p-6 shadow-lg outline-none",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-xl font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function DialogClose({
  className,
  ...props
}: DialogPrimitive.Close.Props) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      className={cn(
        "absolute top-4 right-4 rounded-lg p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-foreground/20 outline-none",
        className,
      )}
      {...props}
    >
      <XIcon className="size-4" />
      <span className="sr-only">Đóng</span>
    </DialogPrimitive.Close>
  );
}

/**
 * Rounded dialog shell that keeps the scrollbar off the curved corners:
 * fixed header/footer + scrollable body (see mentor skill dialogs).
 */
function DialogScrollPopup({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPopup
      className={cn(
        "flex max-h-[min(90dvh,44rem)] flex-col gap-0 overflow-hidden p-0",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPopup>
  );
}

function DialogScrollHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-scroll-header"
      className={cn(
        "relative shrink-0 border-b border-border px-6 pt-5 pb-4 pr-14 text-left",
        className,
      )}
      {...props}
    />
  );
}

function DialogScrollBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-scroll-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-gutter:stable]",
        className,
      )}
      {...props}
    />
  );
}

function DialogScrollFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-scroll-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-popover/95 px-6 py-4 backdrop-blur-sm sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

/** Put on `<form>` inside DialogScrollPopup so header/body/footer flex correctly. */
const dialogScrollFormClassName =
  "flex min-h-0 flex-1 flex-col overflow-hidden";

export {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogScrollBody,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollPopup,
  DialogTitle,
  dialogScrollFormClassName,
};
