#!/usr/bin/env node
// KFI-style memo report generator.
// Usage: node generate-report.mjs --input <spec.json> --output <file.docx>
// See report-schema.md in this folder for the input JSON shape.

import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  VerticalAlign,
  Footer,
  PageNumber,
} from "docx";

const FONT = "맑은 고딕";
const TITLE_FILL = "CFF3EA";
const TITLE_BORDER_COLOR = "2FA98C";
const TABLE_HEADER_FILL = "E7E6E6";
const INFO_LABEL_FILL = "F2F2F2";

function readArgs() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const outputIdx = args.indexOf("--output");
  if (inputIdx === -1 || outputIdx === -1 || !args[inputIdx + 1] || !args[outputIdx + 1]) {
    console.error("Usage: node generate-report.mjs --input <spec.json> --output <file.docx>");
    process.exit(1);
  }
  const inputPath = args[inputIdx + 1];
  const outputPath = args[outputIdx + 1];
  const spec = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  return { spec, outputPath };
}

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, ...opts });
}

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return {
    top: none,
    bottom: none,
    left: none,
    right: none,
    insideHorizontal: none,
    insideVertical: none,
  };
}

function headerInfoTable(date, department) {
  const labelCell = (label) =>
    new TableCell({
      shading: { fill: INFO_LABEL_FILL, type: ShadingType.CLEAR, color: "auto" },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run(label, { bold: true, size: 18 })],
        }),
      ],
    });
  const valueCell = (value) =>
    new TableCell({
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run(value ?? "", { size: 18 })],
        }),
      ],
    });

  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [labelCell("보고일자"), valueCell(date)] }),
      new TableRow({ children: [labelCell("보고부서"), valueCell(department)] }),
    ],
  });

  // Wrap in a borderless outer table so the info table hugs the right margin.
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 62, type: WidthType.PERCENTAGE },
            borders: noBorders(),
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 38, type: WidthType.PERCENTAGE },
            borders: noBorders(),
            children: [infoTable],
          }),
        ],
      }),
    ],
  });
}

function titleBlock(subtitle, title) {
  const children = [];
  if (subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 60 },
        children: [run(`- ${subtitle}`, { size: 22 })],
      }),
    );
  }
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { fill: TITLE_FILL, type: ShadingType.CLEAR, color: "auto" },
      border: {
        top: { style: BorderStyle.SINGLE, size: 8, color: TITLE_BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: TITLE_BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 8, color: TITLE_BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 8, color: TITLE_BORDER_COLOR },
      },
      spacing: { before: 100, after: 300 },
      children: [run(title, { bold: true, size: 36 })],
    }),
  );
  return children;
}

const BULLET_CONFIG = {
  1: { indent: 360, marker: "○ ", size: 22 },
  2: { indent: 720, marker: "- ", size: 22 },
  3: { indent: 1080, marker: "* ", size: 18, color: "555555" },
};

function bulletParagraph(level, text, opts = {}) {
  const c = BULLET_CONFIG[level] ?? BULLET_CONFIG[2];
  return new Paragraph({
    indent: { left: c.indent },
    spacing: { after: 80 },
    children: [run(`${c.marker}${text}`, { size: c.size, color: c.color, bold: opts.bold })],
  });
}

function headingParagraph(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [run(`□ ${text}`, { bold: true, size: 26 })],
  });
}

function dataTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          shading: { fill: TABLE_HEADER_FILL, type: ShadingType.CLEAR, color: "auto" },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [run(String(h), { bold: true, size: 20 })],
            }),
          ],
        }),
    ),
  });
  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: r.map(
          (cell) =>
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [run(String(cell), { size: 20 })],
                }),
              ],
            }),
        ),
      }),
  );
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] });
}

function renderBlocks(blocks) {
  const out = [];
  for (const b of blocks ?? []) {
    if (b.type === "bullet") {
      out.push(bulletParagraph(b.level ?? 2, b.text, { bold: b.bold }));
    } else if (b.type === "table") {
      out.push(dataTable(b.headers, b.rows));
      out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    } else if (b.type === "text") {
      out.push(new Paragraph({ spacing: { after: 80 }, children: [run(b.text, { size: 22, bold: b.bold })] }));
    } else if (b.type === "spacer") {
      out.push(new Paragraph({ children: [] }));
    }
  }
  return out;
}

function renderSection(section) {
  return [headingParagraph(section.heading), ...renderBlocks(section.blocks)];
}

function footnotesBlock(footnotes) {
  if (!footnotes?.length) return [];
  return [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "999999" } },
      spacing: { before: 300 },
      children: [],
    }),
    ...footnotes.map(
      (f) =>
        new Paragraph({
          spacing: { after: 40 },
          children: [run(f, { size: 16, color: "555555" })],
        }),
    ),
  ];
}

function main() {
  const { spec, outputPath } = readArgs();
  const children = [];

  children.push(headerInfoTable(spec.date, spec.department));
  children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  children.push(...titleBlock(spec.subtitle, spec.title));

  for (const section of spec.sections ?? []) {
    children.push(...renderSection(section));
  }

  children.push(...footnotesBlock(spec.footnotes));

  for (const attachment of spec.attachments ?? []) {
    children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    children.push(headingParagraph(attachment.title));
    children.push(...renderBlocks(attachment.blocks));
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 1417 } },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [run("- "), new TextRun({ children: [PageNumber.CURRENT], font: FONT }), run(" -")],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  Packer.toBuffer(doc).then((buffer) => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    console.log(`Report generated: ${outputPath}`);
  });
}

main();
