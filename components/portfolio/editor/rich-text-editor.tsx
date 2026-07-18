"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react";

import { EditableFieldFrame } from "@/components/portfolio/editor/editable-frame";
import { PortfolioColorPicker } from "@/components/portfolio/editor/portfolio-color-picker";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { normalizeHexColor } from "@/lib/portfolio/color-utils";
import {
  isEmptyPortfolioHtml,
  sanitizePortfolioHtml,
} from "@/lib/portfolio/sanitize-html";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  /** Compact chrome for canvas inline editing. */
  variant?: "panel" | "inline";
  /**
   * `compact` — titles / one-liners (marks + color + align, no lists).
   * `full` — detail body text (lists, link, headings marks).
   */
  mode?: "compact" | "full";
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
        "size-8 rounded-md text-[#2D2D2D]",
        active && "bg-[#2D2D2D]/12 text-[#2D2D2D]",
      )}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-[#E5E5E0]" aria-hidden />;
}

function ColorSwatchControl({ editor }: { editor: Editor }) {
  const activeColor =
    (editor.getAttributes("textStyle").color as string | undefined) ?? "";
  const color = normalizeHexColor(activeColor, "#2D2D2D");

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Màu chữ"
            onMouseDown={(event) => event.preventDefault()}
            className="mx-0.5 flex size-7 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50"
          />
        }
      >
        <span
          className="size-5 rounded-full border-2 border-white shadow-[0_0_0_1.5px_#4FC3F7]"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-[min(17.5rem,calc(100vw-2rem))] rounded-2xl border border-[#E5E5E0] bg-white p-3 shadow-lg"
        onMouseDown={(event) => event.preventDefault()}
      >
        <PortfolioColorPicker
          value={color}
          onChange={(next) => {
            editor.chain().setColor(next).run();
          }}
          label="Màu chữ"
          compact
        />
      </PopoverContent>
    </Popover>
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
      setPos({ top: rect.top, left: rect.left, width: Math.max(rect.width, 280) });
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

function buildExtensions(mode: "compact" | "full", placeholder: string) {
  const isCompact = mode === "compact";

  return [
    StarterKit.configure({
      heading: isCompact ? false : { levels: [2, 3] },
      bulletList: isCompact ? false : undefined,
      orderedList: isCompact ? false : undefined,
      blockquote: isCompact ? false : undefined,
      codeBlock: false,
      horizontalRule: false,
      link: {
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      },
    }),
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({
      types: isCompact ? ["paragraph"] : ["heading", "paragraph"],
    }),
    Placeholder.configure({ placeholder }),
  ];
}

function EditorToolbar({
  editor,
  mode,
}: {
  editor: Editor;
  mode: "compact" | "full";
}) {
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

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-[#C9C9C2] bg-white p-1 shadow-[0_10px_28px_rgba(45,45,45,0.14)]">
      <ColorSwatchControl editor={editor} />
      <ToolbarDivider />
      <ToolbarButton
        label="Đậm"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-[16px]" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        label="Nghiêng"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-[16px]" />
      </ToolbarButton>
      <ToolbarButton
        label="Gạch dưới"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-[16px]" />
      </ToolbarButton>
      {mode === "full" ? (
        <>
          <ToolbarDivider />
          <ToolbarButton
            label="Danh sách số"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            label="Danh sách"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            label="Liên kết"
            active={editor.isActive("link")}
            onClick={setLink}
          >
            <Link2 className="size-[16px]" />
          </ToolbarButton>
        </>
      ) : null}
      <ToolbarDivider />
      <ToolbarButton
        label="Căn trái"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="size-[16px]" />
      </ToolbarButton>
      <ToolbarButton
        label="Căn giữa"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="size-[16px]" />
      </ToolbarButton>
      <ToolbarButton
        label="Căn phải"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="size-[16px]" />
      </ToolbarButton>
      {mode === "full" ? (
        <ToolbarButton
          label="Căn đều"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify className="size-[16px]" />
        </ToolbarButton>
      ) : null}
    </div>
  );
}

function toEditorContent(value: string): string {
  const cleaned = sanitizePortfolioHtml(value);
  if (!cleaned) return "";
  if (/<[^>]+>/.test(cleaned)) return cleaned;
  return `<p>${cleaned}</p>`;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Viết nội dung…",
  ariaLabel = "Trình soạn thảo văn bản",
  className,
  variant = "panel",
  mode = "full",
  isDark = false,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const isCompact = mode === "compact";

  const editor = useEditor({
    extensions: buildExtensions(mode, placeholder),
    content: toEditorContent(value),
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
        class: cn(
          "outline-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_p]:m-0",
          "[&_.is-editor-empty:first-child::before]:text-[#5C5C5C] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          isCompact
            ? "min-h-[1.5em] px-1.5 py-0.5 leading-inherit text-inherit [font:inherit]"
            : variant === "inline"
              ? "min-h-[6.5rem] px-3 py-2.5 text-base leading-relaxed text-inherit [font:inherit]"
              : "min-h-[6.5rem] rounded-xl border border-[#E5E5E0] bg-white px-3.5 py-3 text-[15px] text-[#2D2D2D]",
        ),
      },
      handleKeyDown: (_view, event) => {
        if (isCompact && event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          return true;
        }
        return false;
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
    const next = toEditorContent(value);
    if (isEmptyPortfolioHtml(current) && isEmptyPortfolioHtml(next)) return;
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const toolbar = <EditorToolbar editor={editor} mode={mode} />;

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
