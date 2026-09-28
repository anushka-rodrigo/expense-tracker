import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Entry } from './types'
import type { Summary } from './summary'
import { dayLabel, monthLabel } from './dates'

export type ReportInsight = {
  content: { summary: string; highlights: string[]; suggestions: string[] }
  generated_at: string
  income_total: number | string
  expense_total: number | string
}

export type ReportInput = {
  ym: string
  email: string
  entries: Entry[]
  summary: Summary
  insight: ReportInsight | null
  isCurrentMonth: boolean
}

const INK = rgb(0.106, 0.106, 0.122)
const MUTED = rgb(0.42, 0.42, 0.46)
const GOLD = rgb(0.604, 0.482, 0.247)
const GREEN = rgb(0.184, 0.49, 0.31)
const RED = rgb(0.698, 0.29, 0.29)
const RULE = rgb(0.85, 0.84, 0.81)
const TINT = rgb(0.973, 0.965, 0.945)

const num = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money = (n: number) => `${n < 0 ? '-' : ''}Rs. ${num(n)}`
const cents = (n: number | string) => Math.round(Number(n) * 100)

// PDF standard fonts only cover basic Latin. Map common typographic characters
// (AI text uses them a lot) to plain ones, and replace anything else with "?".
const REPLACEMENTS: [RegExp, string][] = [
  [/[\u2018\u2019\u201B]/g, "'"],
  [/[\u201C\u201D]/g, '"'],
  [/[\u2013\u2014\u2212]/g, '-'],
  [/\u2026/g, '...'],
  [/[\u2022\u25CF]/g, '-'],
  [/\u2192/g, '->'],
  [/\u2248/g, '~'],
  [/[\u00A0\u202F\u2009]/g, ' '],
]
function safe(s: string) {
  let out = String(s ?? '')
  for (const [re, rep] of REPLACEMENTS) out = out.replace(re, rep)
  return out.replace(/[\r\n\t]+/g, ' ').replace(/[^\x20-\x7E\xA1-\xFF]/gu, '?')
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(text).split(' ').filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    let word = w
    while (font.widthOfTextAtSize(word, size) > maxWidth && word.length > 1) {
      let cut = word.length - 1
      while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > maxWidth) cut--
      if (line) {
        lines.push(line)
        line = ''
      }
      lines.push(word.slice(0, cut))
      word = word.slice(cut)
    }
    const test = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test
    else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function fit(s: string, font: PDFFont, size: number, max: number) {
  let t = safe(s)
  if (font.widthOfTextAtSize(t, size) <= max) return t
  while (t.length > 1 && font.widthOfTextAtSize(t + '...', size) > max) t = t.slice(0, -1)
  return t + '...'
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' })

export async function buildReport(input: ReportInput): Promise<Uint8Array> {
  const { ym, email, entries, summary, insight, isCurrentMonth } = input

  const pdf = await PDFDocument.create()
  pdf.setTitle(`Ultrix Expense Tracker - ${monthLabel(ym)}`)
  pdf.setAuthor('Ultrix Expense Tracker')
  pdf.setCreator('Ultrix Expense Tracker')
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const PW = 595.28
  const PH = 841.89
  const M = 48
  const W = PW - M * 2
  const BOTTOM = M + 22

  let page: PDFPage = pdf.addPage([PW, PH])
  let y = PH - M // y is always the baseline of the line being written

  // returns true if a new page was started
  function ensure(h: number) {
    if (y - h < BOTTOM) {
      page = pdf.addPage([PW, PH])
      y = PH - M
      return true
    }
    return false
  }
  function put(s: string, x: number, size: number, f: PDFFont = font, color = INK, yy = y) {
    page.drawText(safe(s), { x, y: yy, size, font: f, color })
  }
  function putRight(s: string, xRight: number, size: number, f: PDFFont = font, color = INK) {
    const t = safe(s)
    page.drawText(t, { x: xRight - f.widthOfTextAtSize(t, size), y, size, font: f, color })
  }
  function hr(color = RULE, thickness = 0.6) {
    page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness, color })
  }
  function heading(title: string) {
    put(title, M, 12, bold)
    y -= 8
    hr()
    y -= 16
  }
  function paragraph(text: string, x: number, width: number, size: number, lh: number, color = INK) {
    for (const ln of wrap(text, font, size, width)) {
      ensure(lh)
      put(ln, x, size, font, color)
      y -= lh
    }
  }

  // ---------- Header ----------
  put('ULTRIX EXPENSE TRACKER', M, 9, bold, GOLD)
  putRight(fit(`Prepared for ${email}`, font, 8.5, 300), M + W, 8.5, font, MUTED)
  y -= 26
  put('Monthly Report', M, 24, bold)
  putRight(`Generated ${fmtDate(new Date())}`, M + W, 8.5, font, MUTED)
  y -= 20
  put(monthLabel(ym), M, 13, font, MUTED)
  putRight(isCurrentMonth ? 'Month in progress - figures so far' : 'Final figures', M + W, 8.5, font, MUTED)
  y -= 14
  hr()
  y -= 22

  // ---------- Summary boxes ----------
  const gap = 10
  const bw = (W - gap * 2) / 3
  const bh = 56
  const boxes = [
    { label: 'Total income', value: money(summary.income), color: GREEN },
    { label: 'Total expenses', value: money(summary.expense), color: RED },
    { label: 'Net balance', value: money(summary.net), color: summary.net < 0 ? RED : INK },
  ]
  boxes.forEach((b, i) => {
    const x = M + i * (bw + gap)
    page.drawRectangle({ x, y: y - bh, width: bw, height: bh, color: TINT, borderColor: RULE, borderWidth: 0.6 })
    put(b.label, x + 12, 8.5, font, MUTED, y - 18)
    let size = 15
    while (size > 9 && bold.widthOfTextAtSize(safe(b.value), size) > bw - 24) size -= 0.5
    put(b.value, x + 12, size, bold, b.color, y - 40)
  })
  y -= bh + 28

  // ---------- Where the money went ----------
  if (summary.breakdown.length > 0) {
    ensure(70)
    heading('Where the money went')
    const top = summary.breakdown.slice(0, 10)
    const rest = summary.breakdown.slice(10)
    const rows = [...top]
    if (rest.length > 0) {
      rows.push({
        name: `Other (${rest.length} more)`,
        total: rest.reduce((s, r) => s + r.total, 0),
        percent: rest.reduce((s, r) => s + r.percent, 0),
      })
    }
    for (const b of rows) {
      ensure(32)
      put(fit(b.name, font, 10, W - 170), M, 10)
      putRight(`${money(b.total)}   ${b.percent.toFixed(0)}%`, M + W, 9.5, font, MUTED)
      y -= 10
      page.drawRectangle({ x: M, y: y - 4, width: W, height: 4, color: TINT })
      page.drawRectangle({ x: M, y: y - 4, width: Math.max((W * b.percent) / 100, 2), height: 4, color: GOLD })
      y -= 20
    }
    y -= 8
  }

  // ---------- Transactions (notebook style) ----------
  const COL_DATE = M
  const COL_DETAIL = M + 76
  const R_EXP = M + W - 100
  const R_INC = M + W
  const DETAIL_W = R_EXP - 92 - COL_DETAIL - 8
  let justHeader = false

  function tableHeader() {
    put('DATE', COL_DATE, 7.5, bold, MUTED)
    put('DETAILS', COL_DETAIL, 7.5, bold, MUTED)
    putRight('EXPENSE (-)', R_EXP, 7.5, bold, MUTED)
    putRight('INCOME (+)', R_INC, 7.5, bold, MUTED)
    y -= 7
    hr(INK, 0.8)
    y -= 16
    justHeader = true
  }

  ensure(110)
  heading('Transactions')
  tableHeader()

  const groups = new Map<string, Entry[]>()
  for (const e of entries) {
    const key = `${e.start_date}|${e.end_date ?? ''}`
    groups.set(key, [...(groups.get(key) ?? []), e])
  }
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))

  for (const [, rows] of sorted) {
    rows.sort((a, b) =>
      a.kind === b.kind ? a.created_at.localeCompare(b.created_at) : a.kind === 'expense' ? -1 : 1,
    )
    const label = dayLabel(rows[0].start_date, rows[0].end_date)
    let labelPending = true

    for (let i = 0; i < rows.length; i++) {
      const e = rows[i]
      const nameLines = wrap(e.name, font, 9.5, DETAIL_W)
      const descLines = e.description ? wrap(e.description, font, 8.5, DETAIL_W) : []
      const h = (nameLines.length - 1) * 12 + (descLines.length ? 11 + (descLines.length - 1) * 10.5 : 0) + 16

      if (ensure(h + 8)) {
        tableHeader()
        labelPending = true
      }
      if (i === 0 && !justHeader) {
        page.drawLine({
          start: { x: M, y: y + 12 },
          end: { x: M + W, y: y + 12 },
          thickness: 0.4,
          color: RULE,
        })
      }
      justHeader = false

      if (labelPending) {
        put(label, COL_DATE, 9, bold, GOLD)
        labelPending = false
      }
      nameLines.forEach((ln, k) => put(ln, COL_DETAIL, 9.5, font, INK, y - k * 12))
      putRight(num(e.amount), e.kind === 'expense' ? R_EXP : R_INC, 9.5, font, e.kind === 'expense' ? RED : GREEN)

      let base = y - (nameLines.length - 1) * 12
      descLines.forEach((ln, k) => {
        base = y - (nameLines.length - 1) * 12 - 11 - k * 10.5
        put(ln, COL_DETAIL, 8.5, font, MUTED, base)
      })
      y = (descLines.length ? base : y - (nameLines.length - 1) * 12) - 16
    }
  }

  // totals
  ensure(60)
  y += 8
  hr(INK, 0.8)
  y -= 16
  put('Total', COL_DETAIL, 10, bold)
  putRight(num(summary.expense), R_EXP, 10, bold, RED)
  putRight(num(summary.income), R_INC, 10, bold, GREEN)
  y -= 18
  put('Net balance (income - expenses)', COL_DETAIL, 10, bold)
  putRight(money(summary.net), R_INC, 10, bold, summary.net < 0 ? RED : INK)
  y -= 34

  // ---------- AI insights ----------
  if (insight) {
    ensure(130)
    heading('AI insights')
    const changed =
      cents(insight.income_total) !== cents(summary.income) ||
      cents(insight.expense_total) !== cents(summary.expense)
    put(
      `Generated ${fmtDate(new Date(insight.generated_at))}${
        changed ? ' - entries changed since then, so this may be out of date' : ''
      }`,
      M,
      8.5,
      font,
      changed ? RED : MUTED,
    )
    y -= 18

    paragraph(insight.content.summary, M, W, 10, 14.5)
    y -= 6

    for (const h of insight.content.highlights) {
      const lines = wrap(h, font, 9.5, W - 16)
      ensure(lines.length * 13 + 4)
      page.drawCircle({ x: M + 4, y: y + 3, size: 1.6, color: GOLD })
      for (const ln of lines) {
        put(ln, M + 16, 9.5, font, MUTED)
        y -= 13
      }
      y -= 2
    }

    y -= 6
    ensure(30)
    put('Suggestions', M, 10, bold)
    y -= 16
    insight.content.suggestions.forEach((s, i) => {
      const lines = wrap(s, font, 9.5, W - 20)
      ensure(lines.length * 13 + 6)
      put(`${i + 1}.`, M, 9.5, bold, GOLD)
      for (const ln of lines) {
        put(ln, M + 20, 9.5)
        y -= 13
      }
      y -= 4
    })

    y -= 6
    ensure(14)
    put('AI-generated from totals and category names. General guidance, not financial advice.', M, 8, font, MUTED)
  }

  // ---------- Footer on every page ----------
  const pages = pdf.getPages()
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 42 }, end: { x: M + W, y: 42 }, thickness: 0.4, color: RULE })
    p.drawText('Ultrix Expense Tracker - Monthly Report', { x: M, y: 29, size: 8, font, color: MUTED })
    const t = `Page ${i + 1} of ${pages.length}`
    p.drawText(t, { x: M + W - font.widthOfTextAtSize(t, 8), y: 29, size: 8, font, color: MUTED })
  })

  return await pdf.save()
}