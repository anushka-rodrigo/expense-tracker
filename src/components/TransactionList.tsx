'use client'

import type { Transaction } from '@/lib/supabase'

export default function TransactionList({
  transactions,
  onDelete,
}: {
  transactions: Transaction[]
  onDelete: (id: string) => void
}) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-[#5A5A62]">
        No transactions yet. Add your first one above.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-[#2A2A30]">
      {transactions.map((t) => (
        <li key={t.id} className="flex items-center justify-between py-3 group">
          <div>
            <p className="text-sm">{t.category || 'Uncategorized'}</p>
            {t.note && (
              <p className="text-xs text-[#5A5A62] mt-0.5">{t.note}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`font-mono text-sm ${
                t.type === 'income' ? 'text-[#7FB88F]' : 'text-[#C97B7B]'
              }`}
            >
              {t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
            </span>
            <button
              onClick={() => onDelete(t.id)}
              aria-label="Delete transaction"
              className="text-[#5A5A62] hover:text-[#C97B7B] text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}