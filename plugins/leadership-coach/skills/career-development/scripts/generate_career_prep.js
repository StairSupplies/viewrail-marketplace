#!/usr/bin/env node
/**
 * generate_career_prep.js
 *
 * Generates a Career Development Prep Sheet (.docx) from structured JSON data
 * collected during the career-development skill workflow.
 *
 * Usage:
 *   node generate_career_prep.js <input_json_path> <output_docx_path>
 *
 * Expected JSON shape:
 * {
 *   "leader_name": "Jordan Smith",          // optional, defaults to "Leader"
 *   "conversation_with": "Marcus Webb",     // who the conversation is with
 *   "date": "2026-03-06",                   // YYYY-MM-DD
 *   "context": "...",                       // who, role, what's prompting the convo
 *   "aspirations": "...",                   // what you know about what they want
 *   "strengths": "...",                     // their standout strengths
 *   "development_edge": "...",              // gap between now and where they want to go
 *   "opening_question": "...",             // the specific question they'll open with
 *   "stretch_opportunities": ["...", "..."], // available opportunities to offer
 *   "next_step": "...",                     // the concrete 30-day commitment they'll own
 *   "conversational_intention": "..."       // one sentence on how to show up
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
  console.error('Usage: node generate_career_prep.js <input.json> <output.docx>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const {
  leader_name = 'Leader',
  conversation_with = 'Unknown',
  date = new Date().toISOString().slice(0, 10),
  context = '',
  aspirations = '',
  strengths = '',
  development_edge = '',
  opening_question = '',
  stretch_opportunities = [],
  next_step = '',
  conversational_intention = ''
} = data;

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const ACCENT       = '2C5282';
const LIGHT_BG     = 'EBF4FF';
const RULE_COLOR   = 'BEE3F8';
const OPP_BG       = 'F0FFF4';
const OPP_RULE     = 'C6F6D5';
const BODY_FONT    = 'Calibri';
const BODY_SIZE    = 22;
const LABEL_SIZE   = 18;
const HEADING_SIZE = 24;
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

function labeledParagraph(label, text) {
  if (!text || !text.trim()) return null;
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: label + ': ', bold: true, font: BODY_FONT, size: BODY_SIZE }),
      new TextRun({ text: text.trim(), font: BODY_FONT, size: BODY_SIZE })
    ]
  });
}

function spacer(before = 120) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun('')] });
}

// Opening question — visually called out
function openingBox(text) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: OPP_RULE };
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: border, bottom: border, left: border, right: border },
        shading: { fill: OPP_BG, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: 'Opening Question', bold: true, font: BODY_FONT, size: HEADING_SIZE, color: '276749' })]
          }),
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: '\u201C' + text.trim() + '\u201D', font: BODY_FONT, size: BODY_SIZE, italics: true })]
          })
        ]
      })]
    })]
  });
}

// Conversational intention box
function intentionBox(text) {
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
            children: [new TextRun({ text: 'Conversational Intention', bold: true, font: BODY_FONT, size: HEADING_SIZE, color: ACCENT })]
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

// ─── Build document ───────────────────────────────────────────────────────────

const children = [];

// Title
children.push(new Paragraph({
  spacing: { before: 0, after: 60 },
  children: [new TextRun({ text: 'Career Development Prep Sheet', bold: true, font: BODY_FONT, size: 36, color: ACCENT })]
}));

// Metadata
const metaParts = [
  `Conversation with: ${conversation_with}`,
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

// ── Context & Aspirations ──
if (context || aspirations) {
  children.push(sectionHeading('Context & Aspirations'));
  children.push(spacer(60));
  if (context) children.push(bodyParagraph(context));
  if (aspirations) {
    if (context) children.push(spacer(80));
    children.push(bodyParagraph('What they want: ' + aspirations, { italics: !context }));
  }
}

// ── Strengths & Development Edge ──
if (strengths || development_edge) {
  children.push(spacer());
  children.push(sectionHeading('Strengths & Development Edge'));
  children.push(spacer(60));
  if (strengths) children.push(labeledParagraph('Strengths', strengths));
  if (development_edge) {
    if (strengths) children.push(spacer(60));
    children.push(labeledParagraph('Development edge', development_edge));
  }
}

// ── Opening Question ──
if (opening_question) {
  children.push(spacer());
  children.push(openingBox(opening_question));
}

// ── Stretch Opportunities & Next Step ──
const validOpps = stretch_opportunities.filter(o => o && o.trim());
if (validOpps.length > 0 || next_step) {
  children.push(spacer());
  children.push(sectionHeading('Opportunities & Next Step'));
  children.push(spacer(60));
  if (validOpps.length > 0) {
    children.push(bodyParagraph('Stretch opportunities:', { bold: true }));
    validOpps.forEach(opp => {
      children.push(new Paragraph({
        numbering: { reference: 'opportunities', level: 0 },
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: opp.trim(), font: BODY_FONT, size: BODY_SIZE })]
      }));
    });
  }
  if (next_step) {
    if (validOpps.length > 0) children.push(spacer(80));
    children.push(labeledParagraph('30-day commitment', next_step));
  }
}

// ── Conversational Intention ──
if (conversational_intention) {
  children.push(spacer(200));
  children.push(intentionBox(conversational_intention));
}

const filteredChildren = children.filter(Boolean);

// ─── Assemble ─────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [{
      reference: 'opportunities',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '\u2022',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 300 } } }
      }]
    }]
  },
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
  console.log(`Career prep saved to: ${outputPath}`);
}).catch(err => {
  console.error('Error generating document:', err.message);
  process.exit(1);
});
