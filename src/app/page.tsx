import { supabase } from '@/lib/supabase'
import { addTransaction, deleteTransaction } from './actions'
import TransactionList from '@/components/TransactionList'

export default async function Home() {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  const list = transactions ?? []
  const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense

  return (
    <main className="min-h-screen bg-[#131316] text-[#F2F1EE] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <p className="text-sm text-[#86858C] mb-1">Balance</p>
        <p className="text-5xl font-semibold tracking-tight mb-2 font-mono">
          ${balance.toFixed(2)}
        </p>
        <div className="flex gap-4 text-sm text-[#86858C] mb-8">
          <span>In <span className="text-[#7FB88F] font-mono">${income.toFixed(2)}</span></span>
          <span>Out <span className="text-[#C97B7B] font-mono">${expense.toFixed(2)}</span></span>
        </div>

        <form action={addTransaction} className="space-y-3 mb-10 border border-[#2A2A30] rounded-lg p-4">
          <div className="flex gap-2">
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              className="flex-1 bg-[#1C1C21] border border-[#2A2A30] rounded-md px-3 py-2 text-sm font-mono placeholder:text-[#5A5A62] focus:outline-none focus:border-[#D4B483]"
            />
            <select
              name="type"
              defaultValue="expense"
              className="bg-[#1C1C21] border border-[#2A2A30] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#D4B483]"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <input
            name="category"
            type="text"
            placeholder="Category (optional)"
            className="w-full bg-[#1C1C21] border border-[#2A2A30] rounded-md px-3 py-2 text-sm placeholder:text-[#5A5A62] focus:outline-none focus:border-[#D4B483]"
          />
          <input
            name="note"
            type="text"
            placeholder="Note (optional)"
            className="w-full bg-[#1C1C21] border border-[#2A2A30] rounded-md px-3 py-2 text-sm placeholder:text-[#5A5A62] focus:outline-none focus:border-[#D4B483]"
          />
          <button
            type="submit"
            className="w-full bg-[#D4B483] text-[#131316] font-medium rounded-md py-2 text-sm hover:opacity-90 transition-opacity"
          >
            Add transaction
          </button>
        </form>

        <TransactionList transactions={list} onDelete={deleteTransaction} />
      </div>
    </main>
  )
}