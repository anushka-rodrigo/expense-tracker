'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validateEntry, type EntryInput } from '@/lib/validate'

type Result = { error?: string }

async function getUserClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

const SESSION_ERROR = 'Your session has expired. Please log in again.'

export async function addEntry(input: EntryInput): Promise<Result> {
  const v = validateEntry(input)
  if (!v.ok) return { error: v.error }

  const supabase = await getUserClient()
  if (!supabase) return { error: SESSION_ERROR }

  const { description, ...base } = v.row
  const { error } =
    input.kind === 'expense'
      ? await supabase.from('expenses').insert({ ...base, description })
      : await supabase.from('income').insert(base)

  if (error) return { error: 'Could not save. Please try again.' }
  revalidatePath('/')
  return {}
}

export async function updateEntry(id: string, input: EntryInput): Promise<Result> {
  const v = validateEntry(input)
  if (!v.ok) return { error: v.error }

  const supabase = await getUserClient()
  if (!supabase) return { error: SESSION_ERROR }

  const { description, ...base } = v.row
  const { data, error } =
    input.kind === 'expense'
      ? await supabase.from('expenses').update({ ...base, description }).eq('id', id).select('id')
      : await supabase.from('income').update(base).eq('id', id).select('id')

  if (error) return { error: 'Could not save changes. Please try again.' }
  if (!data || data.length === 0) return { error: 'This entry no longer exists. Refresh the page.' }
  revalidatePath('/')
  return {}
}

export async function deleteEntry(kind: 'expense' | 'income', id: string): Promise<Result> {
  if (kind !== 'expense' && kind !== 'income') return { error: 'Invalid entry type.' }

  const supabase = await getUserClient()
  if (!supabase) return { error: SESSION_ERROR }

  const { data, error } = await supabase
    .from(kind === 'expense' ? 'expenses' : 'income')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) return { error: 'Could not delete. Please try again.' }
  if (!data || data.length === 0) return { error: 'This entry was already deleted. Refresh the page.' }
  revalidatePath('/')
  return {}
}