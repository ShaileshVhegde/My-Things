const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, LevelFormat, Header, Footer, PageNumber, TabStopType,
  TabStopPosition
} = require('docx');
const fs = require('fs');

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  primary:   '6C47FF',  // Electric Indigo
  accent:    '00D4AA',  // Teal
  warn:      'FF6B35',  // Amber-Orange
  danger:    'FF3B5C',  // Red
  success:   '00C896',  // Green
  dark:      '0A0B14',  // Near Black
  surface:   '12141F',  // Card BG
  border:    '1E2235',  // Border
  muted:     '6B7499',  // Muted text
  white:     'FFFFFF',
  lightBg:   'F4F5FB',  // Light mode BG
  lightCard: 'FFFFFF',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const b = (style) => ({ style: BorderStyle.SINGLE, size: 1, color: style || C.border });
const borders = { top: b(), bottom: b(), left: b(), right: b() };
const noBorders = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 44, bold: true, color: C.primary })],
  });
}

function h2(text, color) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 34, bold: true, color: color || C.dark })],
  });
}

function h3(text, color) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: color || C.dark })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: 'Arial', size: opts.size || 22, color: opts.color || '2C2C3E', bold: opts.bold || false, italics: opts.italic || false })],
  });
}

function bullet(text, level = 0, color) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: 'Arial', size: 21, color: color || '2C2C3E' })],
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: 'Arial', size: 21, color: '2C2C3E' })],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C.border } },
    children: [],
  });
}

function accent_block(label, value) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 7160],
    borders: { ...noBorders },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 2200, type: WidthType.DXA },
            shading: { fill: C.primary, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 200, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 19, bold: true, color: C.white })] })],
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 7160, type: WidthType.DXA },
            shading: { fill: 'EEF0FF', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 200, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: value, font: 'Arial', size: 19, color: '2C2C3E' })] })],
          }),
        ],
      }),
    ],
  });
}

function twoCol(left, right) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    borders: { ...noBorders },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 4680, type: WidthType.DXA },
            shading: { fill: 'F8F9FF', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: left,
          }),
          new TableCell({
            borders,
            width: { size: 4680, type: WidthType.DXA },
            shading: { fill: 'F8F9FF', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: right,
          }),
        ],
      }),
    ],
  });
}

function colorCard(title, items, fillColor) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: fillColor || 'F4F5FB', type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            children: [
              new Paragraph({ children: [new TextRun({ text: title, font: 'Arial', size: 24, bold: true, color: C.primary })] }),
              ...items.map(i => new Paragraph({ spacing: { before: 40, after: 0 }, children: [new TextRun({ text: i, font: 'Arial', size: 20, color: '2C2C3E' })] })),
            ],
          }),
        ],
      }),
    ],
  });
}

function headerRow(cells, widths) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((cell, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: C.primary, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, font: 'Arial', size: 20, bold: true, color: C.white })] })],
    })),
  });
}

function dataRow(cells, widths, shade) {
  return new TableRow({
    children: cells.map((cell, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: shade || C.white, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, font: 'Arial', size: 19, color: '2C2C3E' })] })],
    })),
  });
}

// ─── WIREFRAME ASCII TABLE ─────────────────────────────────────────────────────
function wireframe(title, lines) {
  const allLines = [`┌${'─'.repeat(58)}┐`, `│  ${title.padEnd(56)}│`, `├${'─'.repeat(58)}┤`, ...lines.map(l => `│  ${l.padEnd(56)}│`), `└${'─'.repeat(58)}┘`];
  return [
    new Paragraph({ spacing: { before: 120, after: 0 }, children: [new TextRun({ text: title.toUpperCase() + ' — WIREFRAME', font: 'Courier New', size: 20, bold: true, color: C.primary })] }),
    ...allLines.map(line => new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: line, font: 'Courier New', size: 17, color: '3A3A5C' })],
    })),
    new Paragraph({ spacing: { before: 120, after: 60 }, children: [] }),
  ];
}

// ─── PAGE BREAK ───────────────────────────────────────────────────────────────
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ══════════════════════════════════════════════════════════════════════════════
//  DOCUMENT CONTENT
// ══════════════════════════════════════════════════════════════════════════════

const sections_content = [

  // ──── COVER PAGE ────────────────────────────────────────────────────────────
  new Paragraph({ spacing: { before: 1440 }, children: [] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'My Things ', font: 'Arial', size: 72, bold: true, color: C.primary })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: 'Smart Warranty & Product Tracker Platform', font: 'Arial', size: 36, color: C.muted })] }),
  divider(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 80 }, children: [new TextRun({ text: 'UI/UX BLUEPRINT & FRONTEND DESIGN SYSTEM', font: 'Arial', size: 28, bold: true, color: '2C2C3E' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 480 }, children: [new TextRun({ text: 'Deliverables 5 & 6  ·  Wireframes · Design System · Component Library · Animation Spec', font: 'Arial', size: 22, color: C.muted, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480 }, children: [new TextRun({ text: 'v1.0  ·  Production Blueprint  ·  React + Tailwind + Framer Motion + Stitch', font: 'Arial', size: 20, color: C.muted })] }),
  pageBreak(),

  // ──── TABLE OF CONTENTS ─────────────────────────────────────────────────────
  h1('Table of Contents'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [7200, 2160],
    rows: [
      ['1.  Design Philosophy & Direction', '3'],
      ['2.  Design System — Tokens & Variables', '4'],
      ['3.  Typography System', '5'],
      ['4.  Color Palette — Dark & Light Modes', '6'],
      ['5.  Spacing & Grid System', '7'],
      ['6.  Icon Strategy', '8'],
      ['7.  Animation & Motion Spec', '9'],
      ['8.  Component Library', '10'],
      ['9.  Screen Wireframes — All 14 Screens', '13'],
      ['10. Navigation Architecture', '22'],
      ['11. Responsive Breakpoint Rules', '23'],
      ['12. Tech Stack & Tooling', '24'],
      ['13. Folder Structure — Frontend', '25'],
      ['14. Implementation Checklist', '26'],
    ].map(([label, pg], i) => new TableRow({
      children: [
        new TableCell({ borders: noBorders, width: { size: 7200, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 0, right: 0 }, children: [new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 21, color: '2C2C3E' })] })] }),
        new TableCell({ borders: noBorders, width: { size: 2160, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 0, right: 0 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: pg, font: 'Arial', size: 21, color: C.muted })] })] }),
      ],
    }))
  }),
  pageBreak(),

  // ──── 1. DESIGN PHILOSOPHY ──────────────────────────────────────────────────
  h1('1. Design Philosophy & Direction'),
  body('My Things  adopts a "Dark Intelligence" aesthetic — the same visual language trusted by premium fintech and AI productivity tools. The design communicates safety, precision, and calm authority. Users should feel like they have a smart assistant watching their warranties, not a filing cabinet.'),
  new Paragraph({ spacing: { before: 120, after: 80 }, children: [new TextRun({ text: 'Guiding Principles', font: 'Arial', size: 26, bold: true, color: C.primary })] }),

  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      ['Precision', 'Every pixel is intentional. No decorative clutter. Whitespace is a feature.'],
      ['Intelligence', 'The UI should communicate that AI is doing work — subtle animated states, smart feedback.'],
      ['Trust', 'Dark palettes with electric accents project confidence and security.'],
      ['Speed', 'Interactions respond within 150ms. Transitions are snappy (200–350ms), never sluggish.'],
      ['Accessibility', 'Minimum 4.5:1 contrast ratio on all text. Keyboard-navigable. ARIA labels throughout.'],
    ].map(([label, desc], i) => new TableRow({
      children: [
        new TableCell({ borders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'EEF0FF' : C.white, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, children: [new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 20, bold: true, color: C.primary })] })] }),
        new TableCell({ borders, width: { size: 6960, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'EEF0FF' : C.white, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, children: [new Paragraph({ children: [new TextRun({ text: desc, font: 'Arial', size: 20, color: '2C2C3E' })] })] }),
      ],
    }))
  }),
  pageBreak(),

  // ──── 2. DESIGN SYSTEM — TOKENS ─────────────────────────────────────────────
  h1('2. Design System — Tokens & CSS Variables'),
  body('All design values are tokenised. The implementation uses CSS custom properties on :root and [data-theme="dark"]. Never hardcode raw hex values in components — always reference tokens.'),
  h3('CSS Variable Reference (Tailwind config + globals.css)', C.primary),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 2400, 3760],
    rows: [
      headerRow(['Token Name', 'Value', 'Usage'], [3200, 2400, 3760]),
      dataRow(['--color-bg-base', '#0A0B14', 'Page background (dark)'], [3200, 2400, 3760]),
      dataRow(['--color-bg-surface', '#12141F', 'Card / panel background'], [3200, 2400, 3760], 'F8F9FF'),
      dataRow(['--color-bg-elevated', '#1A1D2E', 'Dropdown, modal, tooltip'], [3200, 2400, 3760]),
      dataRow(['--color-border', '#1E2235', 'Dividers, card borders'], [3200, 2400, 3760], 'F8F9FF'),
      dataRow(['--color-border-strong', '#2E3354', 'Focused inputs, active states'], [3200, 2400, 3760]),
      dataRow(['--color-primary', '#6C47FF', 'CTA buttons, links, brand'], [3200, 2400, 3760], 'F8F9FF'),
      dataRow(['--color-primary-hover', '#7D5EFF', 'Button hover'], [3200, 2400, 3760]),
      dataRow(['--color-primary-subtle', '#6C47FF1A', 'Chip backgrounds, highlights'], [3200, 2400, 3760], 'F8F9FF'),
      dataRow(['--color-accent', '#00D4AA', 'Active status, success CTAs'], [3200, 2400, 3760]),
      dataRow(['--color-warn', '#FF6B35', 'Expiring soon badges'], [3200, 2400, 3760], 'F8F9FF'),
      dataRow(['--color-danger', '#FF3B5C', 'Expired status, errors'], [3200, 2400, 3760]),
      dataRow(['--color-success', '#00C896', 'Confirmation toasts'], [3200, 2400, 3760], 'F8F9FF'),
      dataRow(['--color-text-primary', '#F0F0FF', 'Headings, primary text (dark)'], [3200, 2400, 3760]),
      dataRow(['--color-text-secondary', '#A0A8CC', 'Labels, captions'], [3200, 2400, 3760], 'F8F9FF'),
      dataRow(['--color-text-muted', '#6B7499', 'Placeholders, disabled'], [3200, 2400, 3760]),
    ]
  }),
  new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'Light Mode Overrides', font: 'Arial', size: 22, bold: true, color: C.muted })] }),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 2400, 3760],
    rows: [
      headerRow(['Token Name', 'Light Value', 'Notes'], [3200, 2400, 3760]),
      dataRow(['--color-bg-base', '#F4F5FB', 'Soft off-white, never pure white'], [3200, 2400, 3760]),
      dataRow(['--color-bg-surface', '#FFFFFF', 'Card BG'], [3200, 2400, 3760], 'F8F9FF'),
      dataRow(['--color-text-primary', '#0A0B14', 'Near-black for legibility'], [3200, 2400, 3760]),
      dataRow(['--color-text-secondary', '#4A5078', 'Readable on light BG'], [3200, 2400, 3760], 'F8F9FF'),
      dataRow(['--color-border', '#E0E3F0', 'Subtle borders'], [3200, 2400, 3760]),
    ]
  }),
  pageBreak(),

  // ──── 3. TYPOGRAPHY ─────────────────────────────────────────────────────────
  h1('3. Typography System'),
  body('Two-font pairing: Display headlines use "Plus Jakarta Sans" (distinctive, geometric humanist). Body text uses "DM Sans" (neutral, highly legible at small sizes). Both are Google Fonts — zero licensing cost.'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 1600, 1400, 1400, 2960],
    rows: [
      headerRow(['Scale', 'Font', 'Size', 'Weight', 'Usage'], [2000, 1600, 1400, 1400, 2960]),
      dataRow(['display-xl', 'Plus Jakarta Sans', '48px / 3rem', '800', 'Splash headline'], [2000, 1600, 1400, 1400, 2960]),
      dataRow(['display-lg', 'Plus Jakarta Sans', '36px / 2.25rem', '700', 'Page titles'], [2000, 1600, 1400, 1400, 2960], 'F8F9FF'),
      dataRow(['display-md', 'Plus Jakarta Sans', '28px / 1.75rem', '700', 'Section headers'], [2000, 1600, 1400, 1400, 2960]),
      dataRow(['heading-sm', 'Plus Jakarta Sans', '22px / 1.375rem', '600', 'Card titles, modal h'], [2000, 1600, 1400, 1400, 2960], 'F8F9FF'),
      dataRow(['body-lg', 'DM Sans', '16px / 1rem', '400', 'Primary body text'], [2000, 1600, 1400, 1400, 2960]),
      dataRow(['body-md', 'DM Sans', '14px / 0.875rem', '400', 'Labels, descriptions'], [2000, 1600, 1400, 1400, 2960], 'F8F9FF'),
      dataRow(['body-sm', 'DM Sans', '12px / 0.75rem', '400', 'Captions, timestamps'], [2000, 1600, 1400, 1400, 2960]),
      dataRow(['label', 'DM Sans', '11px / 0.6875rem', '600', 'ALL CAPS category tags'], [2000, 1600, 1400, 1400, 2960], 'F8F9FF'),
      dataRow(['mono', 'JetBrains Mono', '13px / 0.8125rem', '400', 'Dates, codes, IDs'], [2000, 1600, 1400, 1400, 2960]),
    ]
  }),
  new Paragraph({ spacing: { before: 160, after: 80 }, children: [new TextRun({ text: 'Tailwind Config Extension', font: 'Arial', size: 22, bold: true, color: C.primary })] }),
  new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "fontFamily: { display: ['Plus Jakarta Sans', 'sans-serif'], body: ['DM Sans', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }", font: 'Courier New', size: 18, color: '3A3A5C' })] }),
  pageBreak(),

  // ──── 4. COLOR PALETTE ─────────────────────────────────────────────────────
  h1('4. Color Palette — Status & Semantic Colors'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 1600, 1800, 3560],
    rows: [
      headerRow(['Semantic Role', 'Hex', 'RGB', 'Application'], [2400, 1600, 1800, 3560]),
      dataRow(['Brand / Primary', '#6C47FF', '108, 71, 255', 'CTAs, active nav, links, focus rings'], [2400, 1600, 1800, 3560]),
      dataRow(['Brand Accent', '#00D4AA', '0, 212, 170', 'Active warranty badge, confirmations'], [2400, 1600, 1800, 3560], 'F8F9FF'),
      dataRow(['Warning (Expiring)', '#FF6B35', '255, 107, 53', '"Expiring Soon" badge, alert cards'], [2400, 1600, 1800, 3560]),
      dataRow(['Danger (Expired)', '#FF3B5C', '255, 59, 92', '"Expired" badge, destructive actions'], [2400, 1600, 1800, 3560], 'F8F9FF'),
      dataRow(['Success', '#00C896', '0, 200, 150', 'Toast notifications, save confirmation'], [2400, 1600, 1800, 3560]),
      dataRow(['Info', '#4DA6FF', '77, 166, 255', 'Informational tooltips, hints'], [2400, 1600, 1800, 3560], 'F8F9FF'),
      dataRow(['Neutral 900', '#0A0B14', '10, 11, 20', 'Page background'], [2400, 1600, 1800, 3560]),
      dataRow(['Neutral 800', '#12141F', '18, 20, 31', 'Card surface'], [2400, 1600, 1800, 3560], 'F8F9FF'),
      dataRow(['Neutral 700', '#1A1D2E', '26, 29, 46', 'Modal / elevated surface'], [2400, 1600, 1800, 3560]),
      dataRow(['Neutral 600', '#1E2235', '30, 34, 53', 'Card borders'], [2400, 1600, 1800, 3560], 'F8F9FF'),
      dataRow(['Neutral 400', '#6B7499', '107, 116, 153', 'Muted text, disabled'], [2400, 1600, 1800, 3560]),
      dataRow(['Neutral 200', '#A0A8CC', '160, 168, 204', 'Secondary text (dark mode)'], [2400, 1600, 1800, 3560], 'F8F9FF'),
      dataRow(['Neutral 50', '#F0F0FF', '240, 240, 255', 'Primary text (dark mode)'], [2400, 1600, 1800, 3560]),
    ]
  }),
  pageBreak(),

  // ──── 5. SPACING & GRID ──────────────────────────────────────────────────────
  h1('5. Spacing & Grid System'),
  body('Base unit is 4px. All spacing values are multiples of 4px. Tailwind spacing scale is left at default (0.25rem = 4px base) with the following semantic aliases added to the config.'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 1600, 5360],
    rows: [
      headerRow(['Alias', 'Value', 'Typical Usage'], [2400, 1600, 5360]),
      dataRow(['space-1 / p-1', '4px', 'Icon padding'], [2400, 1600, 5360]),
      dataRow(['space-2 / p-2', '8px', 'Chip padding'], [2400, 1600, 5360], 'F8F9FF'),
      dataRow(['space-3 / p-3', '12px', 'Badge padding, compact list items'], [2400, 1600, 5360]),
      dataRow(['space-4 / p-4', '16px', 'Card inner padding (mobile)'], [2400, 1600, 5360], 'F8F9FF'),
      dataRow(['space-6 / p-6', '24px', 'Card inner padding (desktop)'], [2400, 1600, 5360]),
      dataRow(['space-8 / p-8', '32px', 'Section vertical padding'], [2400, 1600, 5360], 'F8F9FF'),
      dataRow(['space-12 / p-12', '48px', 'Page horizontal gutter (desktop)'], [2400, 1600, 5360]),
      dataRow(['space-16 / p-16', '64px', 'Large section breaks'], [2400, 1600, 5360], 'F8F9FF'),
      dataRow(['gap-card', '16px', 'Between product cards in grid'], [2400, 1600, 5360]),
      dataRow(['gap-section', '32px', 'Between dashboard sections'], [2400, 1600, 5360], 'F8F9FF'),
    ]
  }),
  new Paragraph({ spacing: { before: 160, after: 80 }, children: [new TextRun({ text: 'Grid Layout Rules', font: 'Arial', size: 24, bold: true, color: C.primary })] }),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 2400, 2480, 2480],
    rows: [
      headerRow(['Area', 'Mobile', 'Tablet', 'Desktop'], [2000, 2400, 2480, 2480]),
      dataRow(['Product Cards', '1 col (100%)', '2 col (50%)', '3–4 col (25–33%)'], [2000, 2400, 2480, 2480]),
      dataRow(['Stat Cards', '2 col', '2 col', '4 col'], [2000, 2400, 2480, 2480], 'F8F9FF'),
      dataRow(['Alert List', '1 col', '1 col', '2 col'], [2000, 2400, 2480, 2480]),
      dataRow(['Charts Section', '1 col stack', '1 col stack', '2 col side-by-side'], [2000, 2400, 2480, 2480], 'F8F9FF'),
      dataRow(['Nav', 'Bottom tab bar', 'Bottom tab bar', 'Left sidebar (240px)'], [2000, 2400, 2480, 2480]),
      dataRow(['Max Content Width', '100%', '768px', '1280px centered'], [2000, 2400, 2480, 2480], 'F8F9FF'),
    ]
  }),
  pageBreak(),

  // ──── 6. ICON STRATEGY ──────────────────────────────────────────────────────
  h1('6. Icon Strategy'),
  body('All icons come from the Lucide React library (open-source, consistent stroke style). Category icons for products use a custom SVG icon set — one icon per product category, rendered in the brand color with subtle gradient fill.'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 2400, 4160],
    rows: [
      headerRow(['Product Category', 'Lucide Icon', 'Tailwind Color Class'], [2800, 2400, 4160]),
      dataRow(['Television / Monitor', 'Monitor', 'text-blue-400'], [2800, 2400, 4160]),
      dataRow(['Smartphone / Tablet', 'Smartphone', 'text-violet-400'], [2800, 2400, 4160], 'F8F9FF'),
      dataRow(['Laptop / Desktop', 'Laptop', 'text-indigo-400'], [2800, 2400, 4160]),
      dataRow(['Refrigerator', 'Thermometer', 'text-cyan-400'], [2800, 2400, 4160], 'F8F9FF'),
      dataRow(['Washing Machine', 'Wind', 'text-teal-400'], [2800, 2400, 4160]),
      dataRow(['Air Conditioner', 'Snowflake', 'text-sky-400'], [2800, 2400, 4160], 'F8F9FF'),
      dataRow(['Microwave / Oven', 'Flame', 'text-orange-400'], [2800, 2400, 4160]),
      dataRow(['Camera', 'Camera', 'text-rose-400'], [2800, 2400, 4160], 'F8F9FF'),
      dataRow(['Audio / Headphones', 'Headphones', 'text-pink-400'], [2800, 2400, 4160]),
      dataRow(['Power Tools', 'Wrench', 'text-yellow-400'], [2800, 2400, 4160], 'F8F9FF'),
      dataRow(['Furniture', 'Sofa (custom SVG)', 'text-amber-400'], [2800, 2400, 4160]),
      dataRow(['Other / Generic', 'Package', 'text-slate-400'], [2800, 2400, 4160], 'F8F9FF'),
    ]
  }),
  body('Icon sizing: 16px (chip), 20px (list item, nav), 24px (card), 32px (page header), 48px (empty state illustration).', { italic: true }),
  body('Install command: npm install lucide-react', { bold: true }),
  pageBreak(),

  // ──── 7. ANIMATION & MOTION ─────────────────────────────────────────────────
  h1('7. Animation & Motion Specification'),
  body('All animations are built with Framer Motion. Never use CSS transition for interactive state changes — use motion.div with variants for predictable behavior and hardware acceleration.'),
  body('Install command: npm install framer-motion', { bold: true }),
  new Paragraph({ spacing: { before: 120, after: 80 }, children: [new TextRun({ text: 'Global Animation Tokens', font: 'Arial', size: 24, bold: true, color: C.primary })] }),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2600, 2200, 4560],
    rows: [
      headerRow(['Token', 'Value', 'Usage'], [2600, 2200, 4560]),
      dataRow(['duration.fast', '150ms', 'Hover states, focus rings, checkbox toggle'], [2600, 2200, 4560]),
      dataRow(['duration.base', '200ms', 'Button press, chip select, badge change'], [2600, 2200, 4560], 'F8F9FF'),
      dataRow(['duration.slow', '350ms', 'Card enter/exit, modal open/close'], [2600, 2200, 4560]),
      dataRow(['duration.page', '500ms', 'Page route transitions (staggered)'], [2600, 2200, 4560], 'F8F9FF'),
      dataRow(['ease.snappy', '[0.25, 0.46, 0.45, 0.94]', 'UI element entry animations'], [2600, 2200, 4560]),
      dataRow(['ease.bounce', '[0.34, 1.56, 0.64, 1.00]', 'FAB, toast pop-in'], [2600, 2200, 4560], 'F8F9FF'),
      dataRow(['ease.smooth', '[0.4, 0, 0.2, 1]', 'Drawer slide, modal fade'], [2600, 2200, 4560]),
    ]
  }),
  new Paragraph({ spacing: { before: 160, after: 80 }, children: [new TextRun({ text: 'Framer Motion Variants — Reusable Presets', font: 'Arial', size: 24, bold: true, color: C.primary })] }),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      headerRow(['Variant Name', 'Framer Motion Config'], [2400, 6960]),
      dataRow(['fadeInUp', 'initial: {opacity:0, y:20}  animate: {opacity:1, y:0}  transition: {duration:0.35, ease:"easeOut"}'], [2400, 6960]),
      dataRow(['staggerContainer', 'variants: { animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }'], [2400, 6960], 'F8F9FF'),
      dataRow(['scaleIn', 'initial: {opacity:0, scale:0.92}  animate: {opacity:1, scale:1}  transition: {duration:0.25}'], [2400, 6960]),
      dataRow(['slideInRight', 'initial: {opacity:0, x:40}  animate: {opacity:1, x:0}  exit: {opacity:0, x:40}'], [2400, 6960], 'F8F9FF'),
      dataRow(['cardHover', 'whileHover: {y:-4, boxShadow:"0 16px 40px rgba(108,71,255,0.18)"}  whileTap: {scale:0.98}'], [2400, 6960]),
      dataRow(['pulseGlow', 'animate: {boxShadow: ["0 0 0 0 rgba(108,71,255,0.4)", "0 0 0 8px rgba(108,71,255,0)"]}  transition: {repeat:Infinity, duration:2}'], [2400, 6960], 'F8F9FF'),
      dataRow(['modalOverlay', 'initial: {opacity:0}  animate: {opacity:1}  exit: {opacity:0}  transition: {duration:0.2}'], [2400, 6960]),
    ]
  }),
  new Paragraph({ spacing: { before: 160, after: 80 }, children: [new TextRun({ text: 'Page Transition Strategy', font: 'Arial', size: 22, bold: true, color: C.muted })] }),
  body('Wrap all route content in <AnimatePresence mode="wait">. Each page exports a const pageVariants = { initial, animate, exit } and applies to a top-level <motion.div> inside the route component. Use "fadeInUp" for standard page loads and "slideInRight" for drill-down navigation (e.g. Dashboard → Product Detail).'),
  pageBreak(),

  // ──── 8. COMPONENT LIBRARY ──────────────────────────────────────────────────
  h1('8. Component Library'),
  body('All components are built as reusable React functional components with TypeScript props interfaces. Styling is Tailwind utility classes + CSS variable tokens. No inline style objects except for dynamic animation values.'),

  h2('8.1  Button Component', C.primary),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 3200, 2160, 2000],
    rows: [
      headerRow(['Variant', 'Classes', 'Icon', 'State'], [2000, 3200, 2160, 2000]),
      dataRow(['primary', 'bg-[--color-primary] text-white rounded-xl px-5 py-2.5 font-semibold', 'Optional left', 'hover:bg-[--color-primary-hover]'], [2000, 3200, 2160, 2000]),
      dataRow(['ghost', 'bg-transparent border border-[--color-border] text-[--color-text-secondary]', 'Optional', 'hover:bg-[--color-bg-elevated]'], [2000, 3200, 2160, 2000], 'F8F9FF'),
      dataRow(['danger', 'bg-[--color-danger]/10 text-[--color-danger] border border-[--color-danger]/30', 'Optional', 'hover:bg-[--color-danger]/20'], [2000, 3200, 2160, 2000]),
      dataRow(['icon-only', 'p-2.5 rounded-lg bg-[--color-bg-elevated]', 'Required center', 'hover:bg-[--color-border]'], [2000, 3200, 2160, 2000], 'F8F9FF'),
      dataRow(['loading', 'Same as primary + disabled + spinner (Loader2 from Lucide, animate-spin)', 'Spinner', 'disabled:opacity-50'], [2000, 3200, 2160, 2000]),
    ]
  }),

  h2('8.2  Status Badge Component', C.primary),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 2400, 4560],
    rows: [
      headerRow(['Status', 'Visual Treatment', 'Props'], [2400, 2400, 4560]),
      dataRow(['Active', 'bg-[--color-accent]/15 text-[--color-accent] + green dot pulse', 'status="active"'], [2400, 2400, 4560]),
      dataRow(['Expiring Soon', 'bg-[--color-warn]/15 text-[--color-warn] + warning icon', 'status="expiring"'], [2400, 2400, 4560], 'F8F9FF'),
      dataRow(['Expired', 'bg-[--color-danger]/15 text-[--color-danger] + X icon', 'status="expired"'], [2400, 2400, 4560]),
      dataRow(['Pending OCR', 'bg-[--color-primary]/15 text-[--color-primary] + animated dots', 'status="processing"'], [2400, 2400, 4560], 'F8F9FF'),
    ]
  }),

  h2('8.3  Product Card Component', C.primary),
  body('Small-to-medium cards in grid layout. No product image is ever displayed. Category icon centered in a gradient blob container. Uses cardHover animation variant.'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      headerRow(['Section', 'Content & Styling'], [2400, 6960]),
      dataRow(['Card Container', 'bg-[--color-bg-surface] border border-[--color-border] rounded-2xl p-4 cursor-pointer overflow-hidden'], [2400, 6960]),
      dataRow(['Icon Area', '48×48 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3'], [2400, 6960], 'F8F9FF'),
      dataRow(['Product Name', 'font-display text-[--color-text-primary] font-semibold text-sm truncate'], [2400, 6960]),
      dataRow(['Category Label', 'text-[--color-text-muted] text-xs uppercase tracking-wide font-semibold'], [2400, 6960], 'F8F9FF'),
      dataRow(['Status Badge', '<StatusBadge> component, right-aligned or below name'], [2400, 6960]),
      dataRow(['Expiry Date', 'font-mono text-xs text-[--color-text-secondary] mt-1'], [2400, 6960], 'F8F9FF'),
      dataRow(['Countdown', 'Only if < 30 days: "X days left" in warn/danger color, bold'], [2400, 6960]),
    ]
  }),

  h2('8.4  Stat Card (Dashboard)', C.primary),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      headerRow(['Element', 'Spec'], [2400, 6960]),
      dataRow(['Container', 'bg-[--color-bg-surface] rounded-2xl p-5 border border-[--color-border]'], [2400, 6960]),
      dataRow(['Value', 'font-display text-4xl font-bold text-[--color-text-primary] — animated count-up on mount'], [2400, 6960], 'F8F9FF'),
      dataRow(['Label', 'text-[--color-text-secondary] text-sm mt-1'], [2400, 6960]),
      dataRow(['Icon', '24px Lucide icon in top-right, colored per status'], [2400, 6960], 'F8F9FF'),
      dataRow(['Trend', 'Optional: small +N% chip (green/red) below value'], [2400, 6960]),
    ]
  }),

  h2('8.5  Alert Card (Dashboard)', C.primary),
  body('Alert cards in the "Expiring Soon" section. Uses left-border color accent instead of full background fill.'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      headerRow(['Element', 'Spec'], [2400, 6960]),
      dataRow(['Container', 'bg-[--color-bg-surface] rounded-xl border-l-4 border-l-[--color-warn] pl-4 pr-4 py-3'], [2400, 6960]),
      dataRow(['Product Icon', '20px category icon, muted color'], [2400, 6960], 'F8F9FF'),
      dataRow(['Product Name', 'font-semibold text-sm text-[--color-text-primary]'], [2400, 6960]),
      dataRow(['Days Remaining', '"7 days left" in bold warn color'], [2400, 6960], 'F8F9FF'),
      dataRow(['CTA Link', '"View Details →" in primary color, text-sm'], [2400, 6960]),
    ]
  }),

  h2('8.6  Form Input Component', C.primary),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      headerRow(['State', 'Styling Spec'], [2400, 6960]),
      dataRow(['Default', 'bg-[--color-bg-elevated] border border-[--color-border] rounded-xl px-4 py-3 text-[--color-text-primary]'], [2400, 6960]),
      dataRow(['Focus', 'border-[--color-primary] ring-2 ring-[--color-primary]/20 outline-none'], [2400, 6960], 'F8F9FF'),
      dataRow(['Error', 'border-[--color-danger] ring-2 ring-[--color-danger]/20'], [2400, 6960]),
      dataRow(['Filled / Valid', 'border-[--color-accent]/40'], [2400, 6960], 'F8F9FF'),
      dataRow(['Disabled', 'opacity-40 cursor-not-allowed'], [2400, 6960]),
    ]
  }),

  h2('8.7  Toast / Notification Component', C.primary),
  body('Built with react-hot-toast (npm install react-hot-toast). Custom renderer returns styled divs matching the design system. Position: top-right on desktop, top-center on mobile. Duration: 3500ms default.'),

  h2('8.8  Modal Component', C.primary),
  body('Built with Framer Motion AnimatePresence. Backdrop: fixed inset-0 bg-black/60 backdrop-blur-sm. Panel: centered card with max-w-md on mobile, max-w-lg on desktop. Entry animation: scaleIn variant. Always portal-rendered via React.createPortal to document.body.'),
  pageBreak(),

  // ──── 9. SCREEN WIREFRAMES ─────────────────────────────────────────────────
  h1('9. Screen Wireframes — All 14 Screens'),
  body('Each wireframe below uses ASCII art to communicate layout structure. Dimensions reflect mobile-first (375px) base. Desktop variations are noted. Measurements are in Tailwind spacing units.'),

  // SCREEN 1: SPLASH
  ...wireframe('Screen 1 — Splash Screen', [
    '                                              ',
    '                                              ',
    '   ┌──────────────────────────────────────┐  ',
    '   │                                      │  ',
    '   │         [ANIMATED LOGO MARK]         │  ',
    '   │         ── shield + shield ──        │  ',
    '   │                                      │  ',
    '   │      My Things                   │  ',
    '   │      Smart. Secure. Tracked.         │  ',
    '   │                                      │  ',
    '   │         [progress bar ████░░]        │  ',
    '   │                                      │  ',
    '   └──────────────────────────────────────┘  ',
    '                                              ',
    'NOTES: Full-screen dark bg (#0A0B14). Logo    ',
    'animates in with scaleIn + glow pulse.        ',
    'Progress bar fills over 2s then routes to    ',
    'Onboarding or Auth if returning user.         ',
  ]),

  // SCREEN 2: ONBOARDING
  ...wireframe('Screen 2 — Onboarding Carousel (3 slides)', [
    '┌────────────────────────────────────────────┐',
    '│  [Skip]                                    │',
    '├────────────────────────────────────────────┤',
    '│                                            │',
    '│     [Lottie / SVG Illustration 200×200]    │',
    '│                                            │',
    '│  ● ○ ○   (dot indicators, slide 1 of 3)   │',
    '│                                            │',
    '│     Never Lose a Warranty Again            │',
    '│     Store all your product warranties in   │',
    '│     one secure, intelligent vault.         │',
    '│                                            │',
    '├────────────────────────────────────────────┤',
    '│       [     Next →     ]  (full-width btn) │',
    '└────────────────────────────────────────────┘',
    'Slide 2: "AI Extracts Details Instantly"       ',
    'Slide 3: "Smart Alerts Save You Money"         ',
    'Swipe gesture supported. AnimatePresence exit/enter.',
  ]),

  // SCREEN 3: AUTH
  ...wireframe('Screen 3 — Authentication (Login / Register)', [
    '┌────────────────────────────────────────────┐',
    '│   ← Back       My Things  logo         │',
    '├────────────────────────────────────────────┤',
    '│   Welcome Back                             │',
    '│   Sign in to your account                 │',
    '│                                            │',
    '│   [G] Continue with Google                 │',
    '│   [f] Continue with Facebook               │',
    '│                                            │',
    '│   ──────────── or ────────────             │',
    '│                                            │',
    '│   Email ______________________________     │',
    '│   Password ___________________________     │',
    '│                       [Forgot Password?]   │',
    '│                                            │',
    '│   [         Sign In          ]             │',
    '│                                            │',
    '│   Don\'t have an account? [Sign Up]         │',
    '└────────────────────────────────────────────┘',
    'Google btn: official G logo (SVG inline),       ',
    'Facebook btn: official f logo. Both white/dark.  ',
    'Tab toggle: "Sign In" | "Sign Up" at top.        ',
  ]),

  // SCREEN 4: OTP
  ...wireframe('Screen 4 — OTP Verification', [
    '┌────────────────────────────────────────────┐',
    '│   ← Back                                   │',
    '│                                            │',
    '│   [Mail icon 48px]                         │',
    '│   Verify Your Email                        │',
    '│   Code sent to john@example.com            │',
    '│                                            │',
    '│   [_] [_] [_] [_] [_] [_]  6-digit OTP   │',
    '│                                            │',
    '│   [     Verify & Continue     ]            │',
    '│                                            │',
    '│   Didn\'t receive it? [Resend in 0:45]      │',
    '└────────────────────────────────────────────┘',
    'Each digit box: 52×64px, focus jumps auto.      ',
    'Paste support: splits across boxes.             ',
    'Resend countdown timer, disabled until 0.       ',
  ]),

  // SCREEN 5: DASHBOARD
  ...wireframe('Screen 5 — Dashboard (Main)', [
    '┌────────────────────────────────────────────┐',
    '│  ☰  My Things           [🔔] [Avatar]  │',
    '├────────────────────────────────────────────┤',
    '│  Good morning, Shailesh 👋                 │',
    '│                                            │',
    '│  ┌──────────┐ ┌──────────┐                 │',
    '│  │ 24 Total │ │ 18 Active│                 │',
    '│  └──────────┘ └──────────┘                 │',
    '│  ┌──────────┐ ┌──────────┐                 │',
    '│  │ 4 Expired│ │ 2 Expirng│                 │',
    '│  └──────────┘ └──────────┘                 │',
    '│                                            │',
    '│  Expiring Soon ───────────────────         │',
    '│  ⚠ Samsung TV — 7 days left [View →]      │',
    '│  ⚠ LG Fridge  — 14 days left [View →]     │',
    '│                                            │',
    '│  Warranty Status Distribution              │',
    '│  [Donut Chart — Active/Expired/Expiring]   │',
    '│                                            │',
    '│  Monthly Expiry Trends                     │',
    '│  [Bar Chart — Jan through Dec]             │',
    '├────────────────────────────────────────────┤',
    '│  [Home] [Products] [+Add] [Alerts] [Profile]│',
    '└────────────────────────────────────────────┘',
  ]),
  body('Dashboard uses Recharts (npm install recharts) for DonutChart and BarChart. No product cards here — only statistics and alerts. The + Add button is a FAB-style highlighted action.', { italic: true }),

  // SCREEN 6: PRODUCTS
  ...wireframe('Screen 6 — Products List Page', [
    '┌────────────────────────────────────────────┐',
    '│  ← Products            [Search] [Filter ▼] │',
    '├────────────────────────────────────────────┤',
    '│  All (24) │ Active │ Expiring │ Expired     │',
    '│  ─────────────────────────────────────────  │',
    '│                                            │',
    '│  ┌──────────────┐ ┌──────────────┐         │',
    '│  │ [Monitor ico]│ │[SmartPhoneico│         │',
    '│  │ Samsung TV   │ │ iPhone 14    │         │',
    '│  │ Electronics  │ │ Smartphone   │         │',
    '│  │ ● ACTIVE     │ │ ⚠ EXPIRING  │         │',
    '│  │ Exp: Dec 25  │ │ 7 days left │         │',
    '│  └──────────────┘ └──────────────┘         │',
    '│                                            │',
    '│  ┌──────────────┐ ┌──────────────┐         │',
    '│  │  [Wind ico]  │ │ [Flame ico]  │         │',
    '│  │ LG Washer    │ │ IFB Microwave│         │',
    '│  │ Appliance    │ │ Appliance    │         │',
    '│  │ ● ACTIVE     │ │ ✕ EXPIRED   │         │',
    '│  │ Exp: Mar 26  │ │ Expired      │         │',
    '│  └──────────────┘ └──────────────┘         │',
    '│                                            │',
    '│  [+ Add New Product]  (floating CTA)       │',
    '└────────────────────────────────────────────┘',
  ]),

  // SCREEN 7: ADD PRODUCT (Step 1)
  ...wireframe('Screen 7 — Add Product Flow — Step 1: Upload', [
    '┌────────────────────────────────────────────┐',
    '│  ← Add Product          Step 1 of 3  ●○○  │',
    '├────────────────────────────────────────────┤',
    '│                                            │',
    '│  Upload Documents                          │',
    '│  Upload your warranty card, bill, manual   │',
    '│                                            │',
    '│  ┌──────────────────────────────────────┐  │',
    '│  │         [ Upload Icon 40px ]         │  │',
    '│  │    Drag & drop or tap to upload      │  │',
    '│  │  Warranty Card  Bill  Manual         │  │',
    '│  │  Accepted: JPG, PNG, PDF (max 10MB)  │  │',
    '│  └──────────────────────────────────────┘  │',
    '│                                            │',
    '│  Uploaded Files (2)                        │',
    '│  [PDF icon] warranty_card.jpg  [×]         │',
    '│  [IMG icon] receipt_scan.png   [×]         │',
    '│                                            │',
    '│  [      Continue to AI Extract →     ]     │',
    '└────────────────────────────────────────────┘',
  ]),

  // SCREEN 8: ADD PRODUCT (Step 2 - AI Processing)
  ...wireframe('Screen 8 — Add Product Step 2: AI Extraction', [
    '┌────────────────────────────────────────────┐',
    '│  ← Add Product          Step 2 of 3  ●●○  │',
    '├────────────────────────────────────────────┤',
    '│                                            │',
    '│  AI is reading your documents...           │',
    '│  [animated progress bar with glow pulse]   │',
    '│  Analyzing • Extracting • Verifying        │',
    '│                                            │',
    '│  ── Extracted Details ────────────────     │',
    '│                                            │',
    '│  Product Name  [ Samsung 55" QLED TV     ] │',
    '│  Purchase Date [ 2023-12-15              ] │',
    '│  Warranty (mo) [ 24                      ] │',
    '│  Expiry Date   [ 2025-12-15   (auto-calc)]│',
    '│  Store Name    [ Reliance Digital, MYS   ] │',
    '│  Category      [ Television            ▼ ] │',
    '│                                            │',
    '│  All fields are editable. Tap to correct.  │',
    '│                                            │',
    '│  [   ← Re-upload   ] [  Confirm & Next →  ]│',
    '└────────────────────────────────────────────┘',
  ]),

  // SCREEN 9: ADD PRODUCT (Step 3)
  ...wireframe('Screen 9 — Add Product Step 3: Review & Save', [
    '┌────────────────────────────────────────────┐',
    '│  ← Add Product          Step 3 of 3  ●●●  │',
    '├────────────────────────────────────────────┤',
    '│  Review & Save                             │',
    '│                                            │',
    '│  ┌────────────────────────────────────┐    │',
    '│  │  [Monitor icon — large gradient]   │    │',
    '│  │  Samsung 55" QLED TV               │    │',
    '│  │  ● ACTIVE  · Expires Dec 15, 2025  │    │',
    '│  │  Store: Reliance Digital, Mysuru   │    │',
    '│  └────────────────────────────────────┘    │',
    '│                                            │',
    '│  Uploaded Files                            │',
    '│  [📄] warranty_card.jpg  [↓ Download]      │',
    '│  [📄] receipt_scan.png   [↓ Download]      │',
    '│                                            │',
    '│  Add Notes (optional)                      │',
    '│  [ __________________________________ ]    │',
    '│                                            │',
    '│  [     Save to My Things  ✓     ]      │',
    '└────────────────────────────────────────────┘',
  ]),

  // SCREEN 10: PRODUCT DETAIL
  ...wireframe('Screen 10 — Product Detail Page', [
    '┌────────────────────────────────────────────┐',
    '│  ← Back                  [Edit] [Delete]   │',
    '├────────────────────────────────────────────┤',
    '│  [Category Icon — 64px gradient blob]      │',
    '│  Samsung 55" QLED TV                       │',
    '│  Television  ·  ● ACTIVE                   │',
    '│                                            │',
    '│  ── WARRANTY INFO ──────────────────────   │',
    '│  Purchase Date    2023-12-15               │',
    '│  Expiry Date      2025-12-15               │',
    '│  Duration         24 months                │',
    '│  Time Remaining   [Progress bar  68%]      │',
    '│                   8 months remaining       │',
    '│                                            │',
    '│  ── STORE DETAILS ──────────────────────   │',
    '│  Reliance Digital, Mysuru                  │',
    '│  [Phone] 080-XXXX  [Map] View location     │',
    '│                                            │',
    '│  ── DOCUMENTS ──────────────────────────   │',
    '│  [📄] Warranty Card    [↓ Download]        │',
    '│  [📄] Purchase Receipt [↓ Download]        │',
    '│                                            │',
    '│  ── NOTES ──────────────────────────────   │',
    '│  "Keep original box in storage room"       │',
    '└────────────────────────────────────────────┘',
  ]),

  // SCREEN 11: ALERTS
  ...wireframe('Screen 11 — Alerts & Notifications', [
    '┌────────────────────────────────────────────┐',
    '│  Alerts                        [Mark All ✓]│',
    '├────────────────────────────────────────────┤',
    '│  Today                                     │',
    '│  ┌────────────────────────────────────┐    │',
    '│  │ 🟡 Samsung TV — expires in 7 days  │    │',
    '│  │    Warranty ends Dec 15, 2025      │    │',
    '│  │                    [View Product →]│    │',
    '│  └────────────────────────────────────┘    │',
    '│                                            │',
    '│  This Week                                 │',
    '│  ┌────────────────────────────────────┐    │',
    '│  │ 🟡 LG Refrigerator — 14 days left  │    │',
    '│  │                    [View Product →]│    │',
    '│  └────────────────────────────────────┘    │',
    '│                                            │',
    '│  This Month                                │',
    '│  ┌────────────────────────────────────┐    │',
    '│  │ 🔴 IFB Microwave — EXPIRED today   │    │',
    '│  │                    [View Product →]│    │',
    '│  └────────────────────────────────────┘    │',
    '│                                            │',
    '│  No more alerts. You\'re all caught up ✓   │',
    '└────────────────────────────────────────────┘',
  ]),

  // SCREEN 12: PROFILE
  ...wireframe('Screen 12 — User Profile', [
    '┌────────────────────────────────────────────┐',
    '│  Profile                        [Settings] │',
    '├────────────────────────────────────────────┤',
    '│  [Avatar 72px]  Shailesh Kumar             │',
    '│                 shailesh@example.com       │',
    '│                 Member since Jan 2024      │',
    '│                                            │',
    '│  ── Stats ────────────────────────────     │',
    '│  24 products  ·  18 active  ·  6 expired  │',
    '│                                            │',
    '│  ── Preferences ──────────────────────     │',
    '│  [Toggle] Dark Mode          ● ON          │',
    '│  [Toggle] Email Notifications ● ON         │',
    '│  [Toggle] Expiry Reminders   ● ON          │',
    '│  Reminder Lead Time          [7 days ▼]    │',
    '│                                            │',
    '│  ── Account ──────────────────────────     │',
    '│  Change Password                    >      │',
    '│  Linked Accounts (Google)           >      │',
    '│  Export My Data                     >      │',
    '│  Delete Account                     >      │',
    '│                                            │',
    '│  [       Sign Out        ]                 │',
    '└────────────────────────────────────────────┘',
  ]),

  // SCREEN 13: ADMIN
  ...wireframe('Screen 13 — Admin Panel (Web Only, Desktop)', [
    '┌──────────────────────────────────────────────────────────┐',
    '│ My Things  ADMIN     [Shailesh — Admin] [Sign Out]   │',
    '├──────────┬───────────────────────────────────────────────┤',
    '│ Dashboard│  System Overview                              │',
    '│ Users    │  ┌───────────┐ ┌───────────┐ ┌───────────┐   │',
    '│ Products │  │ 1,243     │ │  8,921    │ │  99.2%    │   │',
    '│ Reports  │  │ Total     │ │ Products  │ │ Uptime    │   │',
    '│ Settings │  │ Users     │ │ Tracked   │ │           │   │',
    '│          │  └───────────┘ └───────────┘ └───────────┘   │',
    '│          │                                               │',
    '│          │  Recent Registrations ─────────────────────   │',
    '│          │  Name          Email         Joined   Status  │',
    '│          │  Ravi Kumar    r@k.com       Today    Active  │',
    '│          │  Priya S.      p@s.com       Today    Pending │',
    '│          │  Amit M.       a@m.com       Today    Active  │',
    '│          │                                               │',
    '│          │  [View All Users →]                          │',
    '└──────────┴───────────────────────────────────────────────┘',
  ]),

  // SCREEN 14: EMPTY STATE
  ...wireframe('Screen 14 — Empty State (No Products)', [
    '┌────────────────────────────────────────────┐',
    '│  Products                                  │',
    '├────────────────────────────────────────────┤',
    '│                                            │',
    '│                                            │',
    '│      [SVG Illustration — empty vault]      │',
    '│                                            │',
    '│      No products yet                       │',
    '│      Start by adding your first product.   │',
    '│      We\'ll help extract all the details.   │',
    '│                                            │',
    '│      [   + Add Your First Product   ]      │',
    '│                                            │',
    '│                                            │',
    '└────────────────────────────────────────────┘',
    'Empty state illustration: SVG of open vault    ',
    'with floating warranty cards. Subtle float     ',
    'animation on the cards (loop, ease-in-out).    ',
  ]),
  pageBreak(),

  // ──── 10. NAVIGATION ────────────────────────────────────────────────────────
  h1('10. Navigation Architecture'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 2400, 4560],
    rows: [
      headerRow(['Route Path', 'Screen', 'Auth Required'], [2400, 2400, 4560]),
      dataRow(['/splash', 'Splash Screen', 'No'], [2400, 2400, 4560]),
      dataRow(['/onboarding', 'Onboarding Carousel', 'No'], [2400, 2400, 4560], 'F8F9FF'),
      dataRow(['/auth/login', 'Login / Register', 'No'], [2400, 2400, 4560]),
      dataRow(['/auth/verify', 'OTP Verification', 'No'], [2400, 2400, 4560], 'F8F9FF'),
      dataRow(['/dashboard', 'Dashboard (Home)', 'Yes'], [2400, 2400, 4560]),
      dataRow(['/products', 'Products List', 'Yes'], [2400, 2400, 4560], 'F8F9FF'),
      dataRow(['/products/:id', 'Product Detail', 'Yes'], [2400, 2400, 4560]),
      dataRow(['/products/add', 'Add Product (3 steps)', 'Yes'], [2400, 2400, 4560], 'F8F9FF'),
      dataRow(['/products/:id/edit', 'Edit Product', 'Yes'], [2400, 2400, 4560]),
      dataRow(['/alerts', 'Alerts Page', 'Yes'], [2400, 2400, 4560], 'F8F9FF'),
      dataRow(['/profile', 'User Profile', 'Yes'], [2400, 2400, 4560]),
      dataRow(['/admin/*', 'Admin Panel (protected)', 'Yes + Admin Role'], [2400, 2400, 4560], 'F8F9FF'),
    ]
  }),
  body('Router: React Router v6. Use <Outlet> for nested layouts. ProtectedRoute HOC wraps all authenticated pages. AdminRoute adds role check.'),
  pageBreak(),

  // ──── 11. RESPONSIVE RULES ──────────────────────────────────────────────────
  h1('11. Responsive Breakpoint Rules'),
  body('Tailwind default breakpoints are used. Mobile-first approach — all base styles are mobile, breakpoints add desktop enhancements.'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1600, 2000, 5760],
    rows: [
      headerRow(['Breakpoint', 'Min Width', 'Key Layout Changes'], [1600, 2000, 5760]),
      dataRow(['(base)', '0px', 'Bottom tab nav, 1-col grid, full-width inputs, stacked charts'], [1600, 2000, 5760]),
      dataRow(['sm:', '640px', 'Product cards go 2-col, side-by-side stat cards'], [1600, 2000, 5760], 'F8F9FF'),
      dataRow(['md:', '768px', 'Product grid 2-3 col, charts side-by-side'], [1600, 2000, 5760]),
      dataRow(['lg:', '1024px', 'Left sidebar nav (240px), product grid 3-4 col, modal wider'], [1600, 2000, 5760], 'F8F9FF'),
      dataRow(['xl:', '1280px', 'Max content width capped at 1280px, centered'], [1600, 2000, 5760]),
      dataRow(['2xl:', '1536px', 'Admin panel unlocks, product grid 4-5 col'], [1600, 2000, 5760], 'F8F9FF'),
    ]
  }),
  pageBreak(),

  // ──── 12. TECH STACK ────────────────────────────────────────────────────────
  h1('12. Tech Stack & Tooling — Frontend'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 2000, 4560],
    rows: [
      headerRow(['Library', 'Version', 'Purpose'], [2800, 2000, 4560]),
      dataRow(['react', '18.x', 'Core UI framework'], [2800, 2000, 4560]),
      dataRow(['react-router-dom', 'v6', 'Client-side routing'], [2800, 2000, 4560], 'F8F9FF'),
      dataRow(['tailwindcss', '3.x', 'Utility-first styling, design tokens'], [2800, 2000, 4560]),
      dataRow(['framer-motion', '11.x', 'All animations, transitions, gestures'], [2800, 2000, 4560], 'F8F9FF'),
      dataRow(['lucide-react', 'latest', 'All UI icons + category icons'], [2800, 2000, 4560]),
      dataRow(['recharts', '2.x', 'Dashboard DonutChart + BarChart'], [2800, 2000, 4560], 'F8F9FF'),
      dataRow(['react-hot-toast', '2.x', 'Toast notification system'], [2800, 2000, 4560]),
      dataRow(['react-dropzone', '14.x', 'File upload drag-and-drop zone'], [2800, 2000, 4560], 'F8F9FF'),
      dataRow(['react-hook-form', '7.x', 'Form state + validation'], [2800, 2000, 4560]),
      dataRow(['zod', '3.x', 'Schema validation (paired with rhf)'], [2800, 2000, 4560], 'F8F9FF'),
      dataRow(['axios', '1.x', 'HTTP client for API calls'], [2800, 2000, 4560]),
      dataRow(['zustand', '4.x', 'Global state (auth, user, products)'], [2800, 2000, 4560], 'F8F9FF'),
      dataRow(['date-fns', '3.x', 'Date formatting, expiry calculations'], [2800, 2000, 4560]),
      dataRow(['clsx + tw-merge', 'latest', 'Conditional Tailwind class merging'], [2800, 2000, 4560], 'F8F9FF'),
      dataRow(['@headlessui/react', '2.x', 'Accessible dropdowns, toggles, dialogs'], [2800, 2000, 4560]),
      dataRow(['vite', '5.x', 'Build tool, fast HMR'], [2800, 2000, 4560], 'F8F9FF'),
      dataRow(['typescript', '5.x', 'Type safety across all components'], [2800, 2000, 4560]),
    ]
  }),
  new Paragraph({ spacing: { before: 120, after: 80 }, children: [new TextRun({ text: 'Single Install Command:', font: 'Arial', size: 22, bold: true, color: C.primary })] }),
  new Paragraph({ spacing: { before: 60, after: 120 }, children: [new TextRun({ text: 'npm install react-router-dom framer-motion lucide-react recharts react-hot-toast react-dropzone react-hook-form zod axios zustand date-fns clsx tailwind-merge @headlessui/react', font: 'Courier New', size: 17, color: '3A3A5C' })] }),
  pageBreak(),

  // ──── 13. FOLDER STRUCTURE ──────────────────────────────────────────────────
  h1('13. Folder Structure — Frontend'),
  new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: 'src/', font: 'Courier New', size: 20, bold: true, color: C.primary })] }),
  ...[
    'src/',
    '├── assets/',
    '│   ├── icons/            # Custom SVG category icons',
    '│   ├── illustrations/    # Onboarding + empty state SVGs',
    '│   └── brand/            # Logo variants (SVG)',
    '├── components/',
    '│   ├── ui/               # Primitive: Button, Input, Badge, Modal',
    '│   ├── layout/           # AppShell, Sidebar, BottomNav, Header',
    '│   ├── dashboard/        # StatCard, AlertCard, DonutChart, BarChart',
    '│   ├── products/         # ProductCard, ProductGrid, ProductDetail',
    '│   ├── forms/            # AddProductStepper, UploadZone, OTPInput',
    '│   └── shared/           # StatusBadge, EmptyState, PageTransition',
    '├── hooks/',
    '│   ├── useAuth.ts        # Auth state + actions',
    '│   ├── useProducts.ts    # Product CRUD hooks',
    '│   ├── useWarrantyStatus.ts  # Expiry calculation logic',
    '│   └── useTheme.ts       # Dark/light toggle + system detect',
    '├── pages/',
    '│   ├── splash/           # SplashPage.tsx',
    '│   ├── onboarding/       # OnboardingPage.tsx',
    '│   ├── auth/             # LoginPage.tsx, RegisterPage.tsx, OTPPage.tsx',
    '│   ├── dashboard/        # DashboardPage.tsx',
    '│   ├── products/         # ProductsPage.tsx, ProductDetailPage.tsx',
    '│   ├── add-product/      # AddProductPage.tsx (3-step wizard)',
    '│   ├── alerts/           # AlertsPage.tsx',
    '│   ├── profile/          # ProfilePage.tsx',
    '│   └── admin/            # AdminDashboard.tsx, AdminUsers.tsx',
    '├── store/',
    '│   ├── authStore.ts      # Zustand: user session',
    '│   ├── productStore.ts   # Zustand: products cache',
    '│   └── uiStore.ts        # Zustand: theme, modals, toasts',
    '├── services/',
    '│   ├── api.ts            # Axios instance + interceptors',
    '│   ├── authService.ts',
    '│   ├── productService.ts',
    '│   └── uploadService.ts',
    '├── utils/',
    '│   ├── warrantyUtils.ts  # Expiry date calc, countdown, status logic',
    '│   ├── formatters.ts     # Date, currency, string formatters',
    '│   └── cn.ts             # clsx + twMerge helper',
    '├── types/',
    '│   ├── product.types.ts',
    '│   ├── user.types.ts',
    '│   └── api.types.ts',
    '├── styles/',
    '│   └── globals.css       # CSS variables, @font-face, base resets',
    '├── App.tsx               # Router setup, theme provider, toast provider',
    '└── main.tsx              # Vite entry point',
  ].map(line => new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: line, font: 'Courier New', size: 17, color: '3A3A5C' })] })),
  pageBreak(),

  // ──── 14. IMPLEMENTATION CHECKLIST ─────────────────────────────────────────
  h1('14. Implementation Checklist — Phase Order'),
  body('Follow this order strictly. Do not skip phases. Each phase produces a working deliverable before moving to the next.'),

  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1200, 3600, 4560],
    rows: [
      headerRow(['Phase', 'Task', 'Output / Acceptance Criteria'], [1200, 3600, 4560]),
      dataRow(['P1', 'Vite + TS + Tailwind setup', 'Blank app runs, CSS vars active, fonts loaded'], [1200, 3600, 4560]),
      dataRow(['P1', 'CSS variable theme system', 'Dark mode toggles via data-theme attr'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P1', 'Base component library', 'Button, Input, Badge, Modal render correctly'], [1200, 3600, 4560]),
      dataRow(['P2', 'Router + page shells', 'All routes navigate, protected routes redirect'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P2', 'Splash + Onboarding screens', 'Animations play, carousel works, skip routes'], [1200, 3600, 4560]),
      dataRow(['P2', 'Auth pages (Login/Register)', 'Forms validate, Google/FB OAuth icons render'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P2', 'OTP screen', 'Auto-focus, paste support, resend timer works'], [1200, 3600, 4560]),
      dataRow(['P3', 'Dashboard page — static', 'Stat cards, alert cards, chart placeholders'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P3', 'Recharts integration', 'DonutChart + BarChart render with mock data'], [1200, 3600, 4560]),
      dataRow(['P4', 'Products page + grid', 'Category icons, status badges, responsive grid'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P4', 'Product detail page', 'All sections, download buttons, progress bar'], [1200, 3600, 4560]),
      dataRow(['P4', 'Empty state screen', 'Shows when 0 products, correct illustration'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P5', 'Add Product wizard — Step 1', 'Dropzone accepts files, shows preview list'], [1200, 3600, 4560]),
      dataRow(['P5', 'Add Product wizard — Step 2', 'Sends to API, shows loading state, populates form'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P5', 'Add Product wizard — Step 3', 'Review + save, routes to product detail'], [1200, 3600, 4560]),
      dataRow(['P6', 'Alerts page', 'Grouped by timeline, links to product detail'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P6', 'Profile page', 'Theme toggle works, preferences save'], [1200, 3600, 4560]),
      dataRow(['P7', 'Page transition animations', 'AnimatePresence wraps routes, no flicker'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P7', 'Toast notifications', 'Success/error/info toasts on all key actions'], [1200, 3600, 4560]),
      dataRow(['P8', 'Backend API integration', 'All static data replaced with real API calls'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P8', 'Admin panel', 'Desktop-only, role-gated, user/product tables'], [1200, 3600, 4560]),
      dataRow(['P9', 'Responsive QA pass', 'All screens tested at 375, 768, 1280, 1440px'], [1200, 3600, 4560], 'F8F9FF'),
      dataRow(['P9', 'Accessibility audit', 'Axe DevTools: 0 critical violations, ARIA ok'], [1200, 3600, 4560]),
    ]
  }),

  pageBreak(),

  // ──── FINAL NOTES ────────────────────────────────────────────────────────────
  h1('Coding Agent Quick Reference'),
  body('This section is your execution cheat-sheet. Copy these values directly into code.'),

  h3('Tailwind Config — Key Additions', C.primary),
  new Paragraph({ spacing: { before: 60, after: 120 }, children: [new TextRun({ text: "theme: { extend: { colors: { primary: 'var(--color-primary)', accent: 'var(--color-accent)', surface: 'var(--color-bg-surface)', warn: 'var(--color-warn)', danger: 'var(--color-danger)', success: 'var(--color-success)' }, fontFamily: { display: ['Plus Jakarta Sans'], body: ['DM Sans'], mono: ['JetBrains Mono'] }, borderRadius: { card: '1rem', chip: '0.5rem', btn: '0.75rem' } } }", font: 'Courier New', size: 16, color: '3A3A5C' })] }),

  h3('Google Fonts Import (globals.css)', C.primary),
  new Paragraph({ spacing: { before: 60, after: 120 }, children: [new TextRun({ text: "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');", font: 'Courier New', size: 16, color: '3A3A5C' })] }),

  h3('Warranty Status Logic (warrantyUtils.ts)', C.primary),
  new Paragraph({ spacing: { before: 60, after: 120 }, children: [new TextRun({ text: "getWarrantyStatus(expiryDate): 'active' | 'expiring' | 'expired'  — expired if past, expiring if < 30 days, else active. getCountdown(expiryDate): string — '7 days left' or 'Expires in 2 months'. getProgressPercent(purchaseDate, expiryDate): number (0-100).", font: 'Courier New', size: 16, color: '3A3A5C' })] }),

  h3('Key Design Rules — Do NOT Violate', C.danger),
  bullet('Never show product images in cards, lists, or dashboard', 0, C.danger),
  bullet('Never add emoji to the UI — use Lucide icons only', 0, C.danger),
  bullet('Never hardcode hex values — always use CSS variables', 0, C.danger),
  bullet('Dashboard must NEVER show product cards — stats and alerts ONLY', 0, C.danger),
  bullet('All animations via Framer Motion — no raw CSS transitions for interactions', 0, C.danger),
  bullet('Mobile-first always — base styles for 375px, enhance upward', 0, C.danger),
  bullet('Google + Facebook OAuth buttons must use OFFICIAL brand SVG logos', 0, C.danger),

  divider(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: 'My Things  — UI/UX Blueprint v1.0', font: 'Arial', size: 24, bold: true, color: C.primary })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Production-ready frontend design system for coding agents', font: 'Arial', size: 20, color: C.muted, italics: true })] }),
];

// ══════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } },
    },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 44, bold: true, font: 'Arial', color: C.primary },
        paragraph: { spacing: { before: 480, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 34, bold: true, font: 'Arial', color: C.dark },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]},
      { reference: 'numbers', levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C.primary } },
          children: [new TextRun({ text: 'My Things   ·  UI/UX Blueprint & Design System', font: 'Arial', size: 18, color: C.muted })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: C.border } },
          children: [
            new TextRun({ text: 'Page ', font: 'Arial', size: 18, color: C.muted }),
            new PageNumber(),
            new TextRun({ text: '  ·  Confidential — Internal Use', font: 'Arial', size: 18, color: C.muted }),
          ]
        })]
      })
    },
    children: sections_content,
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/My Things _UIBlueprint.docx', buf);
  console.log('Done');
});
