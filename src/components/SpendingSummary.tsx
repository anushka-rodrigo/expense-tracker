'use client'

import { useState } from 'react'

type Summary = {
  period: string
  income: number
  expense: number
  net: number
  byCategory: Record<string, number>
  topCategory: { name: string; amount: number } | null
  transactionCount: number
}

export default function SpendingSummary() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchSummary(p: 'daily' | 'weekly') {
    setPeriod(p)
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/spending-summary?period=${p}`
      )
      setSummary(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-10 border-t border-[#2A2A30] pt-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => fetchSummary('daily')}
          className={`text-sm px-3 py-1.5 rounded-md border ${
            period === 'daily' && summary ? 'border-[#D4B483] text-[#D4B483]' : 'border-[#2A2A30] text-[#86858C]'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => fetchSummary('weekly')}
          className={`text-sm px-3 py-1.5 rounded-md border ${
            period === 'weekly' && summary ? 'border-[#D4B483] text-[#D4B483]' : 'border-[#2A2A30] text-[#86858C]'
          }`}
        >
          This week
        </button>
      </div>

      {loading && <p className="text-sm text-[#5A5A62]">Loading...</p>}

      {summary && !loading && (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#86858C]">Net</span>
            <span className="font-mono">Rs. {summary.net.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#86858C]">Transactions</span>
            <span className="font-mono">{summary.transactionCount}</span>
          </div>
          {summary.topCategory && (
            <div className="flex justify-between">
              <span className="text-[#86858C]">Top category</span>
              <span className="font-mono">
                {summary.topCategory.name} — Rs. {summary.topCategory.amount.toFixed(2)}
              </span>
            </div>
          )}
          {Object.keys(summary.byCategory).length > 0 && (
            <div className="pt-2 border-t border-[#2A2A30] space-y-1.5">
              {Object.entries(summary.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-[#86858C]">
                    <span>{cat}</span>
                    <span className="font-mono">Rs. {amt.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}