export type Entry = {
  id: string
  kind: 'expense' | 'income'
  start_date: string
  end_date: string | null
  name: string
  description: string | null
  amount: number
  created_at: string
}