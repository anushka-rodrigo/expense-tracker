import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'
import { currentMonth, shiftMonth, monthLabel, lastDayOfMonth } from '@/lib/dates'
import { summarize } from '@/lib/summary'
import type { Entry } from '@/lib/types'
import EntryForm from '@/components/EntryForm'
import Ledger from '@/components/Ledger'
import MonthSummary from '@/components/MonthSummary'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const ym = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : currentMonth()
  const first = `${ym}-01`
  const last = lastDayOfMonth(first)

  const supabase = await createClient()
  const [{ data: { user } }, exp, inc] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('expenses').select('*').gte('start_date', first).lte('start_date', last),
    supabase.from('income').select('*').gte('start_date', first).lte('start_date', last),
  ])

  const entries: Entry[] = [
    ...(exp.data ?? []).map((r) => ({ ...r, kind: 'expense' as const, amount: Number(r.amount) })),
    ...(inc.data ?? []).map((r) => ({ ...r, kind: 'income' as const, description: null, amount: Number(r.amount) })),
  ]
  const summary = summarize(entries)

  return (
    <main className="min-h-screen bg-[#131316] text-[#F2F1EE] px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between mb-8">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">Ultrix Expense Tracker</h1>
            <p className="text-xs text-[#86858C] truncate">{user?.email}</p>
          </div>
          <form action={logout}>
            <button className="text-sm text-[#86858C] hover:text-[#F2F1EE]">Sign out</button>
          </form>
        </header>

        <EntryForm />

        <div className="flex items-center justify-between mb-4">
          <Link href={`/?month=${shiftMonth(ym, -1)}`} className="px-3 py-1 text-[#86858C] hover:text-[#F2F1EE]" aria-label="Previous month">‹</Link>
          <h2 className="text-sm font-medium">{monthLabel(ym)}</h2>
          <Link href={`/?month=${shiftMonth(ym, 1)}`} className="px-3 py-1 text-[#86858C] hover:text-[#F2F1EE]" aria-label="Next month">›</Link>
        </div>

        <MonthSummary
          summary={summary}
          isCurrentMonth={ym === currentMonth()}
          hasEntries={entries.length > 0}
        />

        <Ledger entries={entries} />
      </div>
    </main>
  )
}