"use client";

import { useEffect, useState } from "react";
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
  /** Compact bubble-style chrome for canvas inline editing. */
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
        "size-7 rounded-md text-[#6B6B6B]",
        active && "bg-[#4FC3F7]/15 text-[#0f7cad]",
      )}
    >
      {children}
    </Button>
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
          "min-h-[4.5rem] outline-none",
          variant === "inline"
            ? "px-1.5 py-1 text-inherit [font:inherit]"
            : "rounded-xl border border-[#E5E5E0] bg-white px-3 py-2.5 text-sm text-[#2D2D2D]",
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
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 rounded-lg border border-[#E5E5E0] bg-white p-1 shadow-sm",
        variant === "inline" && "w-full",
      )}
      onMouseDown={(event) => event.preventDefault()}
    >
      <ToolbarButton
        label="Đậm"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Nghiêng"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Gạch ngang"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Danh sách"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Danh sách số"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Liên kết" active={editor.isActive("link")} onClick={setLink}>
        <Link2 className="size-3.5" />
      </ToolbarButton>
    </div>
  );

  if (variant === "inline") {
    return (
      <EditableFieldFrame isDark={isDark} className={className}>
        <div data-portfolio-rte className="space-y-1.5">
          {isFocused ? (
            <div className="sticky top-0 z-[2]">{toolbar}</div>
          ) : null}
          <EditorContent editor={editor} />
        </div>
      </EditableFieldFrame>
    );
  }

  return (
    <div data-portfolio-rte className={cn("space-y-1.5", className)}>
      {toolbar}
      <EditorContent editor={editor} />
    </div>
  );
}
