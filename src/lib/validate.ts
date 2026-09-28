import { isValidISODate, sameMonth } from './dates'

export type EntryInput = {
  kind: 'expense' | 'income'
  startDate: string
  endDate: string | null
  name: string
  description: string
  amount: string
}

type Result =
  | { ok: false; error: string }
  | {
      ok: true
      row: {
        start_date: string
        end_date: string | null
        name: string
        amount: number
        description: string | null
      }
    }

export function validateEntry(input: EntryInput): Result {
  const name = input.name.trim()
  const amount = Math.round(Number(input.amount) * 100) / 100
  const endDate = input.endDate || null

  if (!name) return { ok: false, error: 'Please enter a name.' }
  if (name.length > 100) return { ok: false, error: 'Name is too long (max 100 characters).' }
  if (input.description.length > 300)
    return { ok: false, error: 'Description is too long (max 300 characters).' }
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false, error: 'Amount must be greater than 0.' }
  if (amount >= 1e10) return { ok: false, error: 'Amount is too large.' }
  if (!isValidISODate(input.startDate)) return { ok: false, error: 'Please pick a valid date.' }

  if (endDate) {
    if (!isValidISODate(endDate)) return { ok: false, error: 'Please pick a valid end date.' }
    if (endDate < input.startDate)
      return { ok: false, error: 'End date cannot be before the start date.' }
    if (!sameMonth(input.startDate, endDate))
      return { ok: false, error: 'A date range must stay within one month. Split it at the month end.' }
  }

  return {
    ok: true,
    row: {
      start_date: input.startDate,
      end_date: endDate,
      name,
      amount,
      description: input.kind === 'expense' ? input.description.trim() || null : null,
    },
  }
}