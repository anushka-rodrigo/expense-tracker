import { createClient } from '@/lib/supabase/server'
import { currentMonth, lastDayOfMonth } from '@/lib/dates'
import { summarize } from '@/lib/summary'
import { buildReport } from '@/lib/report'
import type { Entry } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get('month') ?? ''
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return new Response('Invalid month', { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Please log in', { status: 401 })

  const first = `${month}-01`
  const last = lastDayOfMonth(first)

  const [exp, inc, ins] = await Promise.all([
    supabase.from('expenses').select('*').gte('start_date', first).lte('start_date', last),
    supabase.from('income').select('*').gte('start_date', first).lte('start_date', last),
    supabase
      .from('monthly_insights')
      .select('content, generated_at, income_total, expense_total')
      .eq('month', first)
      .maybeSingle(),
  ])
  if (exp.error || inc.error) return new Response('Could not load your data', { status: 500 })

  const entries: Entry[] = [
    ...(exp.data ?? []).map((r) => ({ ...r, kind: 'expense' as const, amount: Number(r.amount) })),
    ...(inc.data ?? []).map((r) => ({ ...r, kind: 'income' as const, description: null, amount: Number(r.amount) })),
  ]
  if (entries.length === 0) return new Response('Nothing recorded for this month', { status: 404 })

  const pdf = await buildReport({
    ym: month,
    email: user.email ?? '',
    entries,
    summary: summarize(entries),
    insight: ins.data ?? null,
    isCurrentMonth: month === currentMonth(),
  })

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Ultrix-Report-${month}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}