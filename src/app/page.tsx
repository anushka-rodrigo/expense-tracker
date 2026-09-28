import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'
import { currentMonth, shiftMonth, monthLabel, lastDayOfMonth } from '@/lib/dates'
import { summarize } from '@/lib/summary'
import type { Entry } from '@/lib/types'
import EntryPanel from '@/components/EntryPanel'
import Ledger from '@/components/Ledger'
import MonthSummary from '@/components/MonthSummary'
import InsightsCard from '@/components/InsightsCard'
import Image from 'next/image'

const arrow =
  'flex h-9 w-9 items-center justify-center rounded-md border border-[#2A2A30] text-[#86858C] hover:text-[#F2F1EE]'

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
  const [{ data: { user } }, exp, inc, ins] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('expenses').select('*').gte('start_date', first).lte('start_date', last),
    supabase.from('income').select('*').gte('start_date', first).lte('start_date', last),
    supabase
      .from('monthly_insights')
      .select('content, generated_at, income_total, expense_total')
      .eq('month', first)
      .maybeSingle(),
  ])

  const entries: Entry[] = [
    ...(exp.data ?? []).map((r) => ({ ...r, kind: 'expense' as const, amount: Number(r.amount) })),
    ...(inc.data ?? []).map((r) => ({ ...r, kind: 'income' as const, description: null, amount: Number(r.amount) })),
  ]
  const summary = summarize(entries)

  return (
    <main className="min-h-screen bg-[#131316] text-[#F2F1EE] px-5 py-8 pb-28 sm:px-10 lg:pb-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <Image src="/logo/ultrix-icon.svg" alt="" width={28} height={28} className="rounded-[6px]" />
              <h1 className="text-lg font-semibold tracking-tight">Ultrix Expense Tracker</h1>
            </div>
            <p className="text-xs text-[#86858C] truncate">{user?.email}</p>
          </div>
          <form action={logout}>
            <button className="text-sm text-[#86858C] hover:text-[#F2F1EE]">Sign out</button>
          </form>
        </header>

        <div className="lg:grid lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-8 lg:items-start">
          <EntryPanel />

          <div className="min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl font-semibold tracking-tight">{monthLabel(ym)}</h2>
                {ym !== currentMonth() && (
                  <Link href="/" className="text-xs text-[#D4B483]">This month</Link>
                )}
              </div>
              <div className="flex gap-1.5">
                <Link href={`/?month=${shiftMonth(ym, -1)}`} className={arrow} aria-label="Previous month">‹</Link>
                <Link href={`/?month=${shiftMonth(ym, 1)}`} className={arrow} aria-label="Next month">›</Link>
              </div>
            </div>

            <MonthSummary
              summary={summary}
              isCurrentMonth={ym === currentMonth()}
              hasEntries={entries.length > 0}
              reportHref={`/report?month=${ym}`}
            />

            {entries.length > 0 && (
              <InsightsCard
                key={ym}
                month={ym}
                initial={ins.data ?? null}
                income={summary.income}
                expense={summary.expense}
              />
            )}

            <Ledger entries={entries} />
          </div>
        </div>
      </div>
    </main>
  )
}