"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Link2, List, ListOrdered, Strikethrough } from "lucide-react";

import { EditableFieldFrame } from "@/components/portfolio/editor/editable-frame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isEmptyPortfolioHtml, sanitizePortfolioHtml } from "@/lib/portfolio/sanitize-html";

type RichTextEditorProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  /** Compact chrome for canvas inline editing. */
  variant?: "panel" | "inline";
  isDark?: boolean;
};

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "size-9 rounded-md text-[#2D2D2D]",
        active && "bg-[#4FC3F7]/20 text-[#0f7cad]",
      )}
    >
      {children}
    </Button>
  );
}

/** Floating toolbar anchored above the editor field (escapes overflow:hidden parents). */
function FloatingToolbar({
  open,
  anchorRef,
  children,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left, width: Math.max(rect.width, 220) });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  if (!open || !pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-portfolio-rte-toolbar
      className="pointer-events-auto fixed z-[80]"
      style={{
        top: Math.max(8, pos.top - 8),
        left: pos.left,
        width: Math.min(pos.width, window.innerWidth - 16),
        transform: "translateY(-100%)",
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {children}
    </div>,
    document.body,
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Viết nội dung…",
  ariaLabel = "Trình soạn thảo văn bản",
  className,
  variant = "panel",
  isDark = false,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      // TipTap v3 StarterKit already registers Link — configure it here, don't add Link again.
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: sanitizePortfolioHtml(value) || "",
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
        class: cn(
          "min-h-[6.5rem] outline-none",
          // Contain list markers so they never spill outside the field.
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_.is-editor-empty:first-child::before]:text-[#5C5C5C] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          variant === "inline"
            ? "px-3 py-2.5 text-base leading-relaxed text-inherit [font:inherit]"
            : "rounded-xl border border-[#E5E5E0] bg-white px-3.5 py-3 text-[15px] text-[#2D2D2D]",
        ),
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML();
      onChange(isEmptyPortfolioHtml(html) ? "" : html);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const syncFocus = () => setIsFocused(editor.isFocused);
    editor.on("focus", syncFocus);
    editor.on("blur", syncFocus);
    syncFocus();
    return () => {
      editor.off("focus", syncFocus);
      editor.off("blur", syncFocus);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = sanitizePortfolioHtml(value) || "";
    if (isEmptyPortfolioHtml(current) && isEmptyPortfolioHtml(next)) return;
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL liên kết", previous ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-[#C9C9C2] bg-white p-1.5 shadow-[0_10px_28px_rgba(45,45,45,0.14)]">
      <ToolbarButton
        label="Đậm"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        label="Nghiêng"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        label="Gạch ngang"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        label="Danh sách"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        label="Danh sách số"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-[18px]" />
      </ToolbarButton>
      <ToolbarButton label="Liên kết" active={editor.isActive("link")} onClick={setLink}>
        <Link2 className="size-[18px]" />
      </ToolbarButton>
    </div>
  );

  if (variant === "inline") {
    return (
      <div ref={fieldRef} data-portfolio-rte className={cn("relative", className)}>
        <FloatingToolbar open={isFocused} anchorRef={fieldRef}>
          {toolbar}
        </FloatingToolbar>
        <EditableFieldFrame isDark={isDark}>
          <EditorContent editor={editor} />
        </EditableFieldFrame>
      </div>
    );
  }

  return (
    <div data-portfolio-rte className={cn("space-y-1.5", className)}>
      {toolbar}
      <EditorContent editor={editor} />
    </div>
  );
}
