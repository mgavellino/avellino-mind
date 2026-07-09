import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Minus,
  FileText,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { TEMPLATES } from "@/lib/soap-templates";
import { AiSoapDraftDialog } from "@/components/app/AiSoapDraftDialog";

type Props = {
  content: object | null;
  onChange: (json: object, text: string) => void;
  editable?: boolean;
  patientName?: string;
};

export function RecordEditor({ content, onChange, editable = true, patientName }: Props) {
  const [tplOpen, setTplOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Comece a escrever o prontuário...",
      }),
    ],
    content: content ?? "",
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-content focus:outline-none min-h-[55vh] md:min-h-[60vh] text-base md:text-[15px] text-foreground break-words touch-manipulation",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getText());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getJSON();
    if (content && JSON.stringify(current) !== JSON.stringify(content)) {
      editor.commands.setContent(content as object, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, content === null]);

  if (!editor) return null;

  return (
    <div className="rounded-xl md:rounded-2xl border border-border/60 bg-surface/30 overflow-visible">
      <div className="flex flex-nowrap md:flex-wrap items-center gap-0.5 border-b border-border/60 bg-surface/95 px-2 py-1.5 sticky top-14 z-10 backdrop-blur overflow-x-auto md:overflow-visible [-webkit-overflow-scrolling:touch]">
        <ToolButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          icon={<Heading1 className="h-4 w-4" />}
          label="Título 1"
        />
        <ToolButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Heading2 className="h-4 w-4" />}
          label="Título 2"
        />
        <ToolButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={<Heading3 className="h-4 w-4" />}
          label="Título 3"
        />
        <Divider />
        <ToolButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<Bold className="h-4 w-4" />}
          label="Negrito"
        />
        <ToolButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<Italic className="h-4 w-4" />}
          label="Itálico"
        />
        <ToolButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon={<UnderlineIcon className="h-4 w-4" />}
          label="Sublinhado"
        />
        <Divider />
        <ToolButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<List className="h-4 w-4" />}
          label="Lista"
        />
        <ToolButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<ListOrdered className="h-4 w-4" />}
          label="Lista numerada"
        />
        <ToolButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={<Quote className="h-4 w-4" />}
          label="Citação"
        />
        <ToolButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={<Minus className="h-4 w-4" />}
          label="Divisor"
        />
        <Divider />
        <div className="relative">
          <button
            type="button"
            onClick={() => setTplOpen((v) => !v)}
            className="h-8 px-2 inline-flex items-center gap-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-surface"
            title="Inserir template"
          >
            <FileText className="h-3.5 w-3.5" /> Template
          </button>
          {tplOpen && (
            <div className="absolute z-20 top-9 left-0 w-64 rounded-lg border border-border/60 bg-background shadow-lg p-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    const doc = t.build();
                    editor.chain().focus().insertContent(doc.content as never).run();
                    setTplOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-surface text-sm"
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="h-8 px-2 inline-flex items-center gap-1 rounded-md text-xs text-brand hover:bg-brand/10"
          title="IA: gerar rascunho de evolução"
        >
          <Sparkles className="h-3.5 w-3.5" /> IA
        </button>
        <div className="flex-1" />
        <ToolButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          icon={<Undo2 className="h-4 w-4" />}
          label="Desfazer"
        />
        <ToolButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          icon={<Redo2 className="h-4 w-4" />}
          label="Refazer"
        />
      </div>

      <div className="px-3 py-4 pb-28 md:px-6 md:py-8 md:pb-8 max-h-none md:max-h-[70vh] overflow-visible md:overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <AiSoapDraftDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        patientName={patientName}
        onInsert={(md) => {
          // Convert markdown headings/paragraphs to simple TipTap content
          const lines = md.split("\n");
          const content: object[] = [];
          for (const raw of lines) {
            const line = raw.trim();
            if (!line) {
              content.push({ type: "paragraph" });
              continue;
            }
            const h2 = line.match(/^##\s+(.+)$/);
            const h3 = line.match(/^###\s+(.+)$/);
            if (h2) content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: h2[1] }] });
            else if (h3) content.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: h3[1] }] });
            else content.push({ type: "paragraph", content: [{ type: "text", text: line }] });
          }
          editor.chain().focus().insertContent(content as never).run();
        }}
      />
    </div>
  );
}

function ToolButton({
  onClick,
  active,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`h-8 w-8 grid place-items-center rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? "bg-surface-elevated text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-surface"
      }`}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border/60" />;
}
