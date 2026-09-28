import type { Entry } from './types'

export type Breakdown = { name: string; total: number; percent: number }

export type Summary = {
  income: number
  expense: number
  net: number
  breakdown: Breakdown[]
}

const toCents = (n: number) => Math.round(n * 100)

export function summarize(entries: Entry[]): Summary {
  let incomeC = 0
  let expenseC = 0
  const byName = new Map<string, { label: string; cents: number }>()

  for (const e of entries) {
    const cents = toCents(e.amount)
    if (e.kind === 'income') {
      incomeC += cents
      continue
    }
    expenseC += cents
    // "Food", "food " and "FOOD" count as the same thing
    const key = e.name.trim().toLowerCase()
    const label = e.name.trim().charAt(0).toUpperCase() + e.name.trim().slice(1)
    const prev = byName.get(key)
    byName.set(key, { label: prev?.label ?? label, cents: (prev?.cents ?? 0) + cents })
  }

  const breakdown = [...byName.values()]
    .sort((a, b) => b.cents - a.cents)
    .map((x) => ({
      name: x.label,
      total: x.cents / 100,
      percent: expenseC > 0 ? (x.cents / expenseC) * 100 : 0,
    }))

  return {
    income: incomeC / 100,
    expense: expenseC / 100,
    net: (incomeC - expenseC) / 100,
    breakdown,
  }
}