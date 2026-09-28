import type { Summary } from '@/lib/summary'

const fmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MonthSummary({
  summary,
  isCurrentMonth,
  hasEntries,
}: {
  summary: Summary
  isCurrentMonth: boolean
  hasEntries: boolean
}) {
  if (!hasEntries) return null

  const negative = summary.net < 0

  return (
    <section className="border border-[#2A2A30] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-[#86858C]">Net balance</p>
        <span className="text-[10px] uppercase tracking-wider text-[#5A5A62]">
          {isCurrentMonth ? 'So far' : 'Final'}
        </span>
      </div>
      <p className={`text-3xl font-semibold font-mono tracking-tight mb-4 ${negative ? 'text-[#C97B7B]' : 'text-[#F2F1EE]'}`}>
        {negative ? '−' : ''}Rs. {fmt(summary.net)}
      </p>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#2A2A30]">
        <div className="min-w-0">
          <p className="text-xs text-[#86858C] mb-0.5">Total income</p>
          <p className="text-sm font-mono text-[#7FB88F] break-words">Rs. {fmt(summary.income)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[#86858C] mb-0.5">Total expenses</p>
          <p className="text-sm font-mono text-[#C97B7B] break-words">Rs. {fmt(summary.expense)}</p>
        </div>
      </div>

      {summary.breakdown.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#2A2A30]">
          <p className="text-xs text-[#86858C] mb-3">Where it went</p>
          <ul className="space-y-3">
            {summary.breakdown.map((b) => (
              <li key={b.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
                  <span className="truncate">{b.name}</span>
                  <span className="font-mono text-xs text-[#86858C] whitespace-nowrap">
                    Rs. {fmt(b.total)} · {b.percent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#1C1C21]">
                  <div
                    className="h-1 rounded-full bg-[#D4B483]"
                    style={{ width: `${Math.max(b.percent, 2)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}