'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function addTransaction(formData: FormData) {
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as string
  const category = formData.get('category') as string
  const note = formData.get('note') as string

  if (!amount || amount <= 0) return

  await supabase.from('transactions').insert({
    amount,
    type,
    category: category || null,
    note: note || null,
  })

  revalidatePath('/')
}

export async function deleteTransaction(id: string) {
  await supabase.from('transactions').delete().eq('id', id)
  revalidatePath('/')
}