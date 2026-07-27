#!/usr/bin/env node
/**
 * generate_review_prep.js
 *
 * Generates a Performance Review Prep Sheet (.docx) from structured JSON data
 * collected during the performance-review skill workflow.
 *
 * Usage:
 *   node generate_review_prep.js <input_json_path> <output_docx_path>
 *
 * Expected JSON shape:
 * {
 *   "leader_name": "Jordan Smith",         // optional, defaults to "Leader"
 *   "review_for": "Alex Martinez",         // who the review is for
 *   "review_type": "Annual Review",        // Annual Review, Mid-Year, etc.
 *   "date": "2026-03-06",                  // YYYY-MM-DD
 *   "overall_picture": "...",              // 2-3 sentence summary of their year
 *   "driver_assessments": [               // one entry per driver discussed
 *     {
 *       "driver": "Drives Clarity & Purpose",
 *       "type": "strength",               // "strength", "edge", or "note"
 *       "evidence": "..."                  // specific example or observation
 *     }
 *   ],
 *   "key_development_message": "...",     // the single sharpened behavior focus
 *   "opening_plan": "...",               // how they'll open + anticipated reaction
 *   "success_definition": "..."          // what they want them to know/feel/commit to
 * }
 */

const fs = require('fs');
const path = require('path');

const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  const { execSync } = require('child_process');
  console.log('Installing dependencies...');
  execSync('npm install --silent', { cwd: __dirname, stdio: 'inherit' });
}

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat
} = require(path.join(__dirname, 'node_modules', 'docx'));

const [,, inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node generate_review_prep.js <input.json> <output.docx>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const {
  leader_name = 'Leader',
  review_for = 'Unknown',
  review_type = 'Performance Review',
  date = new Date().toISOString().slice(0, 10),
  overall_picture = '',
  driver_assessments = [],
  key_development_message = '',
  opening_plan = '',
  success_definition = ''
} = data;

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const ACCENT        = '2C5282';
const LIGHT_BG      = 'EBF4FF';
const RULE_COLOR    = 'BEE3F8';
const STRENGTH_BG   = 'F0FFF4';  // soft green for strength rows
const EDGE_BG       = 'FFFBEB';  // soft amber for edge rows
const STRENGTH_DOT  = '276749';
const EDGE_DOT      = '92400E';
const BODY_FONT     = 'Calibri';
const BODY_SIZE     = 22;
const LABEL_SIZE    = 18;
const HEADING_SIZE  = 24;
const CONTENT_WIDTH = 9360;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 280, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR, space: 4 } },
    children: [new TextRun({ text, bold: true, font: BODY_FONT, size: HEADING_SIZE, color: ACCENT })]
  });
}

function bodyParagraph(text, options = {}) {
  if (!text || !text.trim()) return null;
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text: text.trim(), font: BODY_FONT, size: BODY_SIZE, ...options })]
  });
}

function spacer(before = 120) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun('')] });
}

// Success definition box — same highlighted treatment as "Walking In"
function successBox(text) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR };
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: border, bottom: border, left: border, right: border },
        shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 200, right: 200 },
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 60 },
            children: [new TextRun({ text: 'Success Definition', bold: true, font: BODY_FONT, size: HEADING_SIZE, color: ACCENT })]
          }),
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: text.trim(), font: BODY_FONT, size: BODY_SIZE, italics: true })]
          })
        ]
      })]
    })]
  });
}

// Driver assessments table: Type indicator | Driver | Evidence
function driverTable(assessments) {
  const cellBorder = { style: BorderStyle.SINGLE, size: 2, color: RULE_COLOR };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const colType = 1000;
  const colDriver = 2800;
  const colEvidence = CONTENT_WIDTH - colType - colDriver; // 5560

  const typeLabel = { strength: '★ Strength', edge: '▲ Edge', note: '— Note' };
  const typeBg    = { strength: STRENGTH_BG, edge: EDGE_BG, note: 'FFFFFF' };
  const typeColor = { strength: STRENGTH_DOT, edge: EDGE_DOT, note: '4A5568' };

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders, width: { size: colType, type: WidthType.DXA },
        shading: { fill: 'DBEAFE', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: '', font: BODY_FONT, size: BODY_SIZE })] })]
      }),
      new TableCell({
        borders, width: { size: colDriver, type: WidthType.DXA },
        shading: { fill: 'DBEAFE', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: 'Driver', bold: true, font: BODY_FONT, size: BODY_SIZE, color: ACCENT })] })]
      }),
      new TableCell({
        borders, width: { size: colEvidence, type: WidthType.DXA },
        shading: { fill: 'DBEAFE', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: 'Evidence / Observation', bold: true, font: BODY_FONT, size: BODY_SIZE, color: ACCENT })] })]
      })
    ]
  });

  const dataRows = assessments.map(a => {
    const t = (a.type || 'note').toLowerCase();
    const bg = typeBg[t] || 'FFFFFF';
    const color = typeColor[t] || '4A5568';
    const label = typeLabel[t] || '— Note';
    return new TableRow({
      children: [
        new TableCell({
          borders, width: { size: colType, type: WidthType.DXA },
          shading: { fill: bg, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: BODY_FONT, size: LABEL_SIZE, color })] })]
        }),
        new TableCell({
          borders, width: { size: colDriver, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: (a.driver || '').trim(), bold: true, font: BODY_FONT, size: BODY_SIZE })] })]
        }),
        new TableCell({
          borders, width: { size: colEvidence, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: (a.evidence || '').trim(), font: BODY_FONT, size: BODY_SIZE })] })]
        })
      ]
    });
  });

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [colType, colDriver, colEvidence],
    rows: [headerRow, ...dataRows]
  });
}

// ─── Build document ───────────────────────────────────────────────────────────

const children = [];

// Title
children.push(new Paragraph({
  spacing: { before: 0, after: 60 },
  children: [new TextRun({ text: 'Performance Review Prep Sheet', bold: true, font: BODY_FONT, size: 36, color: ACCENT })]
}));

// Metadata
const metaParts = [
  `Review for: ${review_for}`,
  review_type,
  leader_name !== 'Leader' ? leader_name : null,
  formatDate(date),
].filter(Boolean);

children.push(new Paragraph({
  spacing: { before: 40, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 6 } },
  children: metaParts.map((part, i) => [
    new TextRun({ text: part, font: BODY_FONT, size: LABEL_SIZE, color: '4A5568' }),
    i < metaParts.length - 1
      ? new TextRun({ text: '   \u2022   ', font: BODY_FONT, size: LABEL_SIZE, color: 'A0AEC0' })
      : null,
  ]).flat().filter(Boolean)
}));

// ── Overall Picture ──
if (overall_picture) {
  children.push(sectionHeading('Overall Picture'));
  children.push(spacer(60));
  children.push(bodyParagraph(overall_picture));
}

// ── Driver Assessments ──
const validAssessments = driver_assessments.filter(a => a && a.driver);
if (validAssessments.length > 0) {
  children.push(spacer());
  children.push(sectionHeading('Driver Assessment'));
  children.push(spacer(60));
  children.push(driverTable(validAssessments));
}

// ── Key Development Message ──
if (key_development_message) {
  children.push(spacer());
  children.push(sectionHeading('Key Development Message'));
  children.push(spacer(60));
  children.push(bodyParagraph(key_development_message));
}

// ── Opening Plan ──
if (opening_plan) {
  children.push(spacer());
  children.push(sectionHeading('Opening Plan'));
  children.push(spacer(60));
  children.push(bodyParagraph(opening_plan));
}

// ── Success Definition ──
if (success_definition) {
  children.push(spacer(200));
  children.push(successBox(success_definition));
}

const filteredChildren = children.filter(Boolean);

// ─── Assemble ─────────────────────────────────────────────────────────────────

const doc = new Document({
  styles: { default: { document: { run: { font: BODY_FONT, size: BODY_SIZE } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: filteredChildren
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  console.log(`Review prep saved to: ${outputPath}`);
}).catch(err => {
  console.error('Error generating document:', err.message);
  process.exit(1);
});
