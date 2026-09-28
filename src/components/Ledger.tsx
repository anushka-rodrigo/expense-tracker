import type { Entry } from '@/lib/types'
import { dayLabel } from '@/lib/dates'

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Ledger({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-[#86858C] text-center py-10">
        Nothing recorded this month yet. Add your first entry above.
      </p>
    )
  }

  const groups = new Map<string, Entry[]>()
  for (const e of entries) {
    const key = `${e.start_date}|${e.end_date ?? ''}`
    groups.set(key, [...(groups.get(key) ?? []), e])
  }
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))

  return (
    <section>
      <div className="grid grid-cols-[5rem_1fr_auto] gap-x-3 px-1 pb-2 text-[11px] uppercase tracking-wider text-[#5A5A62]">
        <span>Date</span>
        <span>Details</span>
        <span className="text-right">Amount</span>
      </div>

      {sorted.map(([key, rows]) => {
        const first = rows[0]
        rows.sort((a, b) =>
          a.kind === b.kind ? a.created_at.localeCompare(b.created_at) : a.kind === 'expense' ? -1 : 1
        )
        return (
          <div key={key} className="grid grid-cols-[5rem_1fr] gap-x-3 border-t border-[#2A2A30] px-1 py-3">
            <p className="text-xs font-mono text-[#D4B483] leading-5 pt-px">
              {dayLabel(first.start_date, first.end_date)}
            </p>
            <ul className="space-y-2.5">
              {rows.map((e) => (
                <li key={`${e.kind}-${e.id}`} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm leading-5 break-words">{e.name}</p>
                    {e.description && (
                      <p className="text-xs text-[#86858C] break-words">{e.description}</p>
                    )}
                  </div>
                  <p
                    className={`text-sm font-mono whitespace-nowrap leading-5 ${
                      e.kind === 'income' ? 'text-[#7FB88F]' : 'text-[#C97B7B]'
                    }`}
                  >
                    {e.kind === 'income' ? '+' : '−'} {fmt(e.amount)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}