import { useCallback, useMemo, useState } from 'react'
import {
  loadTransactions,
  loadInvestments,
} from '../storage/index.js'
import { formatCurrency } from '../utils/formatters.js'
import { getBalanceBreakdown } from '../utils/balance.js'
import ExpenseBreakdownPie from '../charts/ExpenseBreakdownPie.jsx'
import IncomeVsExpenseBar from '../charts/IncomeVsExpenseBar.jsx'
import MonthlySpendingBar from '../charts/MonthlySpendingBar.jsx'
import NetWorthGrowthLine from '../charts/NetWorthGrowthLine.jsx'
import InvestmentPerformanceLine from '../charts/InvestmentPerformanceLine.jsx'

const CARD_CLASS =
  'rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/60 backdrop-blur hover-lift transition hover:shadow-[0_0_0_1px_rgba(34,197,94,0.2)]'

const PERIODS = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
]

function filterByPeriod(transactions, period) {
  if (!transactions.length) return []
  const now = new Date()
  let start
  if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  } else if (period === 'quarterly') {
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  } else {
    start = new Date(now.getFullYear() - 4, 0, 1)
  }
  const startStr = start.toISOString().slice(0, 10)
  return transactions.filter((t) => t.date >= startStr)
}

function exportToCSV(transactions) {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Source']
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category || '',
    t.amount,
    (t.description || '').replace(/"/g, '""'),
    t.source || '',
  ])
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      r.map((c) => (typeof c === 'string' && c.includes(',') ? `"${c}"` : c)).join(','),
    ),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expense-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const Reports = () => {
  const [period, setPeriod] = useState('monthly')

  const transactions = useMemo(() => loadTransactions(), [])
  const investments = useMemo(() => loadInvestments(), [])

  const filteredTransactions = useMemo(
    () => filterByPeriod(transactions, period),
    [transactions, period],
  )

  const totalInvestments = useMemo(() => {
    return investments.reduce(
      (sum, a) => sum + (Number(a.currentValue) || Number(a.investedAmount) || 0),
      0,
    )
  }, [investments])

  const handleExportCSV = useCallback(() => {
    exportToCSV(transactions)
  }, [transactions])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-100">
            Reports
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Analytics and export-ready breakdowns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-slate-700 bg-slate-900/80 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition ' +
                  (period === p.id
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-400 hover:text-slate-200')
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="rounded-xl bg-teal-500/20 px-4 py-2 text-sm text-teal-300 hover:bg-teal-500/30"
          >
            Export CSV
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={CARD_CLASS}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Monthly Expense Breakdown
          </h3>
          <p className="mt-1 text-xs text-slate-400">By month</p>
          <div className="mt-4 min-h-[256px]">
            <MonthlySpendingBar transactions={filteredTransactions} />
          </div>
        </div>

        <div className={CARD_CLASS}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Category Spending
          </h3>
          <p className="mt-1 text-xs text-slate-400">Pie by category</p>
          <div className="mt-4 min-h-[256px]">
            <ExpenseBreakdownPie transactions={filteredTransactions} />
          </div>
        </div>
      </section>

      <section className={CARD_CLASS}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Income vs Expense
        </h3>
        <p className="mt-1 text-xs text-slate-400">By month</p>
        <div className="mt-4 min-h-[256px]">
          <IncomeVsExpenseBar transactions={filteredTransactions} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={CARD_CLASS}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Net Worth Growth
          </h3>
          <p className="mt-1 text-xs text-slate-400">Over time</p>
          <div className="mt-4 min-h-[224px]">
            <NetWorthGrowthLine
              transactions={filteredTransactions}
              totalInvestments={totalInvestments}
            />
          </div>
        </div>

        <div className={CARD_CLASS}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Investment Growth
          </h3>
          <p className="mt-1 text-xs text-slate-400">Portfolio value</p>
          <div className="mt-4 min-h-[224px]">
            <InvestmentPerformanceLine investments={investments} />
          </div>
        </div>
      </section>
    </div>
  )
}

export default Reports
