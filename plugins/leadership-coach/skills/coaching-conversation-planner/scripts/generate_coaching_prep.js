#!/usr/bin/env node
/**
 * generate_coaching_prep.js
 *
 * Generates a 1:1 Coaching Prep Sheet (.docx) from structured JSON data
 * collected during the coaching-conversation-planner skill workflow.
 *
 * Usage:
 *   node generate_coaching_prep.js <input_json_path> <output_docx_path>
 *
 * Expected JSON shape:
 * {
 *   "leader_name": "Jordan Smith",        // optional, defaults to "Leader"
 *   "conversation_with": "Alex",          // who the 1:1 is with
 *   "date": "2026-03-06",                 // YYYY-MM-DD
 *   "context": "...",                     // brief description + current state
 *   "current_energy": "...",              // motivated, stuck, frustrated, etc.
 *   "coaching_questions": ["Q1", "Q2"],   // 3-5 prepared questions
 *   "advice_reframes": [                  // optional — advice impulses turned into questions
 *     { "impulse": "I want to tell them X", "reframe": "What if you asked: ...?" }
 *   ],
 *   "conversational_intention": "..."     // one sentence on how to show up
 * }
 */

const fs = require('fs');
const path = require('path');

// Install dependencies if not present
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

// ─── Parse args ───────────────────────────────────────────────────────────────

const [,, inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node generate_coaching_prep.js <input.json> <output.docx>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const {
  leader_name = 'Leader',
  conversation_with = 'Unknown',
  date = new Date().toISOString().slice(0, 10),
  context = '',
  current_energy = '',
  coaching_questions = [],
  advice_reframes = [],
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
const REFRAME_BG   = 'F0FFF4'; // soft green for reframe column
const REFRAME_RULE = 'C6F6D5';
const BODY_FONT    = 'Calibri';
const BODY_SIZE    = 22;       // 11pt
const LABEL_SIZE   = 18;       // 9pt
const HEADING_SIZE = 24;       // 12pt bold
const CONTENT_WIDTH = 9360;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 280, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR, space: 4 }
    },
    children: [
      new TextRun({ text, bold: true, font: BODY_FONT, size: HEADING_SIZE, color: ACCENT })
    ]
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

// Highlighted intention box — equivalent to "Walking In" in the difficult-conversation doc
function intentionBox(text) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR };
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: border, bottom: border, left: border, right: border },
            shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({ text: 'Conversational Intention', bold: true, font: BODY_FONT, size: HEADING_SIZE, color: ACCENT })
                ]
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: text.trim(), font: BODY_FONT, size: BODY_SIZE, italics: true })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

// Two-column reframes table: "What I wanted to say" | "Ask instead"
function reframesTable(reframes) {
  const cellBorder = { style: BorderStyle.SINGLE, size: 2, color: RULE_COLOR };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const colW1 = 4540;
  const colW2 = 4820;

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders,
        shading: { fill: 'DBEAFE', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: colW1, type: WidthType.DXA },
        children: [new Paragraph({
          children: [new TextRun({ text: 'What I wanted to say', bold: true, font: BODY_FONT, size: BODY_SIZE, color: ACCENT })]
        })]
      }),
      new TableCell({
        borders,
        shading: { fill: REFRAME_BG, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: colW2, type: WidthType.DXA },
        children: [new Paragraph({
          children: [new TextRun({ text: 'Ask instead', bold: true, font: BODY_FONT, size: BODY_SIZE, color: '276749' })]
        })]
      })
    ]
  });

  const dataRows = reframes.map(r =>
    new TableRow({
      children: [
        new TableCell({
          borders,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          width: { size: colW1, type: WidthType.DXA },
          children: [new Paragraph({
            children: [new TextRun({ text: (r.impulse || '').trim(), font: BODY_FONT, size: BODY_SIZE })]
          })]
        }),
        new TableCell({
          borders,
          shading: { fill: REFRAME_BG, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          width: { size: colW2, type: WidthType.DXA },
          children: [new Paragraph({
            children: [new TextRun({ text: (r.reframe || '').trim(), font: BODY_FONT, size: BODY_SIZE, italics: true })]
          })]
        })
      ]
    })
  );

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [colW1, colW2],
    rows: [headerRow, ...dataRows]
  });
}

// ─── Build document ───────────────────────────────────────────────────────────

const children = [];

// Title
children.push(
  new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: '1:1 Coaching Prep Sheet', bold: true, font: BODY_FONT, size: 36, color: ACCENT })]
  })
);

// Metadata
const metaParts = [
  `Conversation with: ${conversation_with}`,
  leader_name !== 'Leader' ? leader_name : null,
  formatDate(date),
].filter(Boolean);

children.push(
  new Paragraph({
    spacing: { before: 40, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 6 } },
    children: metaParts.map((part, i) => [
      new TextRun({ text: part, font: BODY_FONT, size: LABEL_SIZE, color: '4A5568' }),
      i < metaParts.length - 1
        ? new TextRun({ text: '   \u2022   ', font: BODY_FONT, size: LABEL_SIZE, color: 'A0AEC0' })
        : null,
    ]).flat().filter(Boolean)
  })
);

// ── About This Person ──
if (context || current_energy) {
  children.push(sectionHeading('About This Person'));
  children.push(spacer(60));
  if (context) children.push(bodyParagraph(context));
  if (current_energy) {
    if (context) children.push(spacer(80));
    children.push(bodyParagraph('Current energy: ' + current_energy, { italics: true }));
  }
}

// ── Coaching Questions ──
const validQuestions = coaching_questions.filter(q => q && q.trim());
if (validQuestions.length > 0) {
  children.push(spacer());
  children.push(sectionHeading('Coaching Questions'));
  children.push(spacer(60));
  validQuestions.forEach(() => {}); // placeholder — added below via numbering
  validQuestions.forEach(q => {
    children.push(new Paragraph({
      numbering: { reference: 'coaching-questions', level: 0 },
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: q.trim(), font: BODY_FONT, size: BODY_SIZE })]
    }));
  });
}

// ── Advice Reframes ──
const validReframes = advice_reframes.filter(r => r && (r.impulse || r.reframe));
if (validReframes.length > 0) {
  children.push(spacer());
  children.push(sectionHeading('Advice \u2192 Question Reframes'));
  children.push(spacer(60));
  children.push(reframesTable(validReframes));
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
    config: [
      {
        reference: 'coaching-questions',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 480, hanging: 300 } } }
        }]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: BODY_FONT, size: BODY_SIZE } } }
  },
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
  console.log(`Coaching prep saved to: ${outputPath}`);
}).catch(err => {
  console.error('Error generating document:', err.message);
  process.exit(1);
});
