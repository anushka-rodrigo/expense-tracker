'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isValidISODate, sameMonth } from '@/lib/dates'

export type EntryInput = {
  kind: 'expense' | 'income'
  startDate: string
  endDate: string | null
  name: string
  description: string
  amount: string
}

export async function addEntry(input: EntryInput): Promise<{ error?: string }> {
  const name = input.name.trim()
  const amount = Math.round(Number(input.amount) * 100) / 100
  const endDate = input.endDate || null

  if (!name) return { error: 'Please enter a name.' }
  if (name.length > 100) return { error: 'Name is too long (max 100 characters).' }
  if (input.description.length > 300) return { error: 'Description is too long (max 300 characters).' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Amount must be greater than 0.' }
  if (amount >= 1e10) return { error: 'Amount is too large.' }
  if (!isValidISODate(input.startDate)) return { error: 'Please pick a valid date.' }

  if (endDate) {
    if (!isValidISODate(endDate)) return { error: 'Please pick a valid end date.' }
    if (endDate < input.startDate) return { error: 'End date cannot be before the start date.' }
    if (!sameMonth(input.startDate, endDate))
      return { error: 'A date range must stay within one month. Split it at the month end.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session has expired. Please log in again.' }

  const row = { start_date: input.startDate, end_date: endDate, name, amount }
  const { error } =
    input.kind === 'expense'
      ? await supabase.from('expenses').insert({ ...row, description: input.description.trim() || null })
      : await supabase.from('income').insert(row)

  if (error) return { error: 'Could not save. Please try again.' }
  revalidatePath('/')
  return {}
}