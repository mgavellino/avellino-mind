import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { saveAs } from "file-saver";

type DocNode = {
  type: string;
  content?: DocNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
};

/** Flatten Tiptap JSON into ordered blocks for export. */
function walk(node: DocNode | undefined, blocks: { kind: string; text: string }[] = []) {
  if (!node) return blocks;
  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      blocks.push({ kind: `h${Math.min(level, 3)}`, text: textOf(node) });
      break;
    }
    case "paragraph":
      blocks.push({ kind: "p", text: textOf(node) });
      break;
    case "bulletList":
    case "orderedList":
      (node.content ?? []).forEach((li) =>
        blocks.push({
          kind: node.type === "orderedList" ? "ol" : "ul",
          text: textOf(li),
        }),
      );
      break;
    case "blockquote":
      blocks.push({ kind: "quote", text: textOf(node) });
      break;
    case "horizontalRule":
      blocks.push({ kind: "hr", text: "" });
      break;
    default:
      (node.content ?? []).forEach((c) => walk(c, blocks));
  }
  return blocks;
}

function textOf(node: DocNode): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(textOf).join("");
}

type Meta = {
  title: string;
  patientName?: string;
  professionalName?: string;
  crp?: string;
  date?: Date;
};

export function exportRecordAsPDF(content: object, meta: Meta) {
  const blocks = walk(content as DocNode);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(meta.title || "Prontuário", margin, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  const metaLines = [
    meta.patientName ? `Paciente: ${meta.patientName}` : null,
    meta.professionalName ? `Profissional: ${meta.professionalName}${meta.crp ? ` — CRP ${meta.crp}` : ""}` : null,
    `Data: ${(meta.date ?? new Date()).toLocaleDateString("pt-BR")}`,
  ].filter(Boolean) as string[];
  metaLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 14;
  });
  y += 8;
  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 16;
  doc.setTextColor(20);

  for (const b of blocks) {
    if (b.kind === "hr") {
      ensureSpace(20);
      doc.setDrawColor(230);
      doc.line(margin, y + 6, pageW - margin, y + 6);
      y += 16;
      continue;
    }
    let size = 11;
    let font: "normal" | "bold" = "normal";
    let indent = 0;
    let prefix = "";
    if (b.kind === "h1") { size = 16; font = "bold"; }
    else if (b.kind === "h2") { size = 13; font = "bold"; }
    else if (b.kind === "h3") { size = 12; font = "bold"; }
    else if (b.kind === "ul") { prefix = "•  "; indent = 14; }
    else if (b.kind === "ol") { prefix = "•  "; indent = 14; }
    else if (b.kind === "quote") { indent = 14; }
    doc.setFont("helvetica", font);
    doc.setFontSize(size);
    const text = prefix + (b.text || " ");
    const lines = doc.splitTextToSize(text, maxW - indent);
    const lineH = size * 1.35;
    for (const ln of lines) {
      ensureSpace(lineH);
      doc.text(ln, margin + indent, y);
      y += lineH;
    }
    y += b.kind.startsWith("h") ? 6 : 4;
  }

  doc.save(`${slug(meta.title)}.pdf`);
}

export async function exportRecordAsDOCX(content: object, meta: Meta) {
  const blocks = walk(content as DocNode);
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: meta.title || "Prontuário", bold: true })],
    }),
  ];
  const metaParts = [
    meta.patientName ? `Paciente: ${meta.patientName}` : null,
    meta.professionalName
      ? `Profissional: ${meta.professionalName}${meta.crp ? ` — CRP ${meta.crp}` : ""}`
      : null,
    `Data: ${(meta.date ?? new Date()).toLocaleDateString("pt-BR")}`,
  ].filter(Boolean) as string[];
  metaParts.forEach((p) =>
    children.push(new Paragraph({ children: [new TextRun({ text: p, color: "666666", size: 20 })] })),
  );
  children.push(new Paragraph({ text: "" }));

  for (const b of blocks) {
    if (b.kind === "h1") {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(b.text)] }));
    } else if (b.kind === "h2") {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(b.text)] }));
    } else if (b.kind === "h3") {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(b.text)] }));
    } else if (b.kind === "ul" || b.kind === "ol") {
      children.push(new Paragraph({ text: `• ${b.text}` }));
    } else if (b.kind === "quote") {
      children.push(new Paragraph({ children: [new TextRun({ text: b.text, italics: true, color: "555555" })] }));
    } else if (b.kind === "hr") {
      children.push(new Paragraph({ text: "—".repeat(30) }));
    } else {
      children.push(new Paragraph({ children: [new TextRun(b.text || " ")] }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slug(meta.title)}.docx`);
}

function slug(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "prontuario"
  );
}
