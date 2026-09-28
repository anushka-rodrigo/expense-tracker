'use client'
import { useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export type Insight = {
  content: { summary: string; highlights: string[]; suggestions: string[] }
  generated_at: string
  income_total: number | string
  expense_total: number | string
}

const cents = (n: number | string) => Math.round(Number(n) * 100)

const fmt = (n: number | string) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Colombo',
  })

export default function InsightsCard({
  month,
  initial,
  income,
  expense,
}: {
  month: string
  initial: Insight | null
  income: number
  expense: number
}) {
  const [insight, setInsight] = useState<Insight | null>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const changes: { label: string; from: number; to: number }[] = []
  if (insight) {
    if (cents(insight.income_total) !== cents(income))
      changes.push({ label: 'Income', from: Number(insight.income_total), to: income })
    if (cents(insight.expense_total) !== cents(expense))
      changes.push({ label: 'Expenses', from: Number(insight.expense_total), to: expense })
  }
  const stale = changes.length > 0

  async function generate() {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke('monthly-insights', {
      body: { month },
    })
    setLoading(false)

    if (error) {
      let msg = 'Could not generate insights. Please try again.'
      if (error instanceof FunctionsHttpError) {
        try {
          const body = await error.context.json()
          if (body?.error) msg = body.error
        } catch {
          /* keep the default message */
        }
      }
      return setError(msg)
    }
    if (data?.insight) setInsight(data.insight)
  }

  return (
    <section
      className={`rounded-lg border p-4 mb-6 ${stale ? 'border-[#D4B483]/60' : 'border-[#2A2A30]'}`}
      style={
        stale
          ? { boxShadow: '0 0 0 1px rgba(212,180,131,0.35), 0 0 28px rgba(212,180,131,0.14)' }
          : undefined
      }
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">AI insights</h3>
        {stale ? (
          <span className="flex items-center gap-1.5 rounded-full bg-[#D4B483] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#131316]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#131316] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#131316]" />
            </span>
            Outdated
          </span>
        ) : (
          insight && (
            <span className="text-[10px] uppercase tracking-wider text-[#5A5A62]">
              {when(insight.generated_at)}
            </span>
          )
        )}
      </div>

      {stale && (
        <div className="mb-4 rounded-md border border-[#D4B483]/40 bg-[#D4B483]/10 p-3">
          <p className="text-sm font-medium text-[#F2D9A8]">
            Your numbers changed after this was written
          </p>
          <ul className="mt-2">
            {changes.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3 py-0.5 text-xs font-mono">
                <span className="text-[#C9BBA0]">{c.label}</span>
                <span>
                  <span className="text-[#86858C] line-through">Rs. {fmt(c.from)}</span>
                  <span className="text-[#F2D9A8]"> → Rs. {fmt(c.to)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!insight && (
        <p className="text-sm text-[#86858C] mb-4">
          Get a short summary of this month and practical tips to improve your spending habits.
        </p>
      )}

      {insight && (
        <div className={stale ? 'opacity-50' : ''}>
          <p className="text-sm leading-6">{insight.content.summary}</p>

          {insight.content.highlights.length > 0 && (
            <ul className="mt-3">
              {insight.content.highlights.map((h, i) => (
                <li key={i} className="flex gap-2 py-0.5 text-sm text-[#86858C]">
                  <span className="text-[#D4B483]">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 mb-2 text-xs text-[#86858C]">Suggestions</p>
          <ol>
            {insight.content.suggestions.map((s, i) => (
              <li key={i} className="flex gap-3 py-1 text-sm">
                <span className="pt-0.5 font-mono text-xs text-[#D4B483]">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[#C97B7B]">{error}</p>}

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className={`mt-4 w-full rounded-md py-2 text-sm disabled:opacity-50 ${
          stale
            ? 'bg-[#D4B483] font-medium text-[#131316] hover:opacity-90'
            : 'border border-[#2A2A30] text-[#D4B483] hover:border-[#D4B483]'
        }`}
      >
        {loading ? 'Thinking…' : stale ? 'Update insights' : insight ? 'Regenerate' : 'Generate insights'}
      </button>

      <p className="mt-3 text-[11px] text-[#5A5A62]">
        AI-generated from your totals and category names. General guidance, not financial advice.
      </p>
    </section>
  )
}