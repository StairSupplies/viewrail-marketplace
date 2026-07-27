#!/usr/bin/env node
/**
 * generate_prep_doc.js
 *
 * Generates a Conversation Prep Sheet (.docx) from structured JSON data
 * collected during the difficult-conversation skill workflow.
 *
 * Usage:
 *   node generate_prep_doc.js <input_json_path> <output_docx_path>
 *
 * Expected JSON shape:
 * {
 *   "leader_name": "Jordan Smith",        // optional, defaults to "Leader"
 *   "conversation_with": "Alex",          // who the conversation is with
 *   "date": "2026-03-06",                 // YYYY-MM-DD
 *   "situation": "...",                   // 2-3 sentence summary
 *   "core_message": "...",               // the essential thing to say
 *   "their_reality": "...",              // what's going on for the other person
 *   "story_check": "...",               // the story being told + is it helping?
 *   "intent": "...",                     // what the leader really wants
 *   "talking_points": ["...", "...", "..."],
 *   "one_thing_to_remember": "..."
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
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat
} = require(path.join(__dirname, 'node_modules', 'docx'));

// ─── Parse args ──────────────────────────────────────────────────────────────

const [,, inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node generate_prep_doc.js <input.json> <output.docx>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const {
  leader_name = 'Leader',
  conversation_with = 'Unknown',
  date = new Date().toISOString().slice(0, 10),
  situation = '',
  core_message = '',
  their_reality = '',
  story_check = '',
  intent = '',
  talking_points = [],
  one_thing_to_remember = ''
} = data;

// Format date nicely: "March 6, 2026"
function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const ACCENT     = '2C5282'; // deep blue — calm, professional
const LIGHT_BG   = 'EBF4FF'; // very light blue tint for "walking in" box
const RULE_COLOR = 'BEE3F8'; // soft blue for section dividers
const BODY_FONT  = 'Calibri';
const BODY_SIZE  = 22;        // 11pt in half-points
const LABEL_SIZE = 18;        // 9pt — used for metadata row
const HEADING_SIZE = 24;      // 12pt bold for section headings
const CONTENT_WIDTH = 9360;   // US Letter, 1" margins

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 280, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR, space: 4 }
    },
    children: [
      new TextRun({
        text,
        bold: true,
        font: BODY_FONT,
        size: HEADING_SIZE,
        color: ACCENT,
      })
    ]
  });
}

function bodyParagraph(text, options = {}) {
  if (!text || !text.trim()) return null;
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({
        text: text.trim(),
        font: BODY_FONT,
        size: BODY_SIZE,
        ...options
      })
    ]
  });
}

function spacer(before = 120) {
  return new Paragraph({
    spacing: { before, after: 0 },
    children: [new TextRun({ text: '' })]
  });
}

function numberedPoint(text, index) {
  return new Paragraph({
    numbering: { reference: 'talking-points', level: 0 },
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text: text.trim(),
        font: BODY_FONT,
        size: BODY_SIZE,
      })
    ]
  });
}

// The "walking in" anchor — visually distinct shaded box
function walkingInBox(text) {
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
                  new TextRun({
                    text: 'Walking In',
                    bold: true,
                    font: BODY_FONT,
                    size: HEADING_SIZE,
                    color: ACCENT,
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: text.trim(),
                    font: BODY_FONT,
                    size: BODY_SIZE,
                    italics: true,
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

// ─── Build document ───────────────────────────────────────────────────────────

const children = [];

// Title
children.push(
  new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [
      new TextRun({
        text: 'Conversation Prep Sheet',
        bold: true,
        font: BODY_FONT,
        size: 36,       // 18pt
        color: ACCENT,
      })
    ]
  })
);

// Metadata row: "Conversation with Alex  |  Jordan Smith  |  March 6, 2026"
const metaParts = [
  `Conversation with: ${conversation_with}`,
  leader_name !== 'Leader' ? leader_name : null,
  formatDate(date),
].filter(Boolean);

children.push(
  new Paragraph({
    spacing: { before: 40, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 6 }
    },
    children: metaParts.map((part, i) => [
      new TextRun({
        text: part,
        font: BODY_FONT,
        size: LABEL_SIZE,
        color: '4A5568',
      }),
      i < metaParts.length - 1
        ? new TextRun({ text: '   \u2022   ', font: BODY_FONT, size: LABEL_SIZE, color: 'A0AEC0' })
        : null,
    ]).flat().filter(Boolean)
  })
);

// ── The Situation ──
if (situation) {
  children.push(sectionHeading('The Situation'));
  children.push(spacer(60));
  children.push(bodyParagraph(situation));
}

// ── Core Message ──
if (core_message) {
  children.push(spacer());
  children.push(sectionHeading('Core Message'));
  children.push(spacer(60));
  children.push(bodyParagraph(core_message));
}

// ── Their Reality ──
if (their_reality || story_check) {
  children.push(spacer());
  children.push(sectionHeading('Their Reality'));
  children.push(spacer(60));
  if (their_reality) children.push(bodyParagraph(their_reality));
  if (story_check) {
    if (their_reality) children.push(spacer(80));
    children.push(bodyParagraph('Story check: ' + story_check, { italics: true }));
  }
}

// ── Your Intent ──
if (intent) {
  children.push(spacer());
  children.push(sectionHeading('Your Intent'));
  children.push(spacer(60));
  children.push(bodyParagraph(intent));
}

// ── Talking Points ──
const validPoints = talking_points.filter(p => p && p.trim());
if (validPoints.length > 0) {
  children.push(spacer());
  children.push(sectionHeading('Talking Points'));
  children.push(spacer(60));
  validPoints.forEach((pt, i) => children.push(numberedPoint(pt, i)));
}

// ── Walking In ──
if (one_thing_to_remember) {
  children.push(spacer(200));
  children.push(walkingInBox(one_thing_to_remember));
}

// Push any nulls out
const filteredChildren = children.filter(Boolean);

// ─── Assemble ─────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'talking-points',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 480, hanging: 300 } }
            }
          }
        ]
      }
    ]
  },
  styles: {
    default: {
      document: {
        run: { font: BODY_FONT, size: BODY_SIZE }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: filteredChildren
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  console.log(`Prep document saved to: ${outputPath}`);
}).catch(err => {
  console.error('Error generating document:', err.message);
  process.exit(1);
});
