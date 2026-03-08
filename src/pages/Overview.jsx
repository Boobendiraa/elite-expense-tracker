import { useMemo } from 'react'
import {
  loadTransactions,
  loadInvestments,
  loadCreditCards,
} from '../storage/index.js'
import { formatCurrency } from '../utils/formatters.js'
import { getBalanceBreakdown } from '../utils/balance.js'
import NetWorthGrowthLine from '../charts/NetWorthGrowthLine.jsx'
import AssetAllocationDonut from '../charts/AssetAllocationDonut.jsx'
import MonthlySpendingBar from '../charts/MonthlySpendingBar.jsx'

const CARD_CLASS =
  'rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/60 backdrop-blur hover-lift transition hover:shadow-[0_0_0_1px_rgba(34,197,94,0.2)]'

const getHealthColor = (status) => {
  if (status === 'healthy') return 'text-emerald-400'
  if (status === 'moderate') return 'text-amber-400'
  return 'text-rose-400'
}

const Overview = () => {
  const transactions = useMemo(() => loadTransactions(), [])
  const investments = useMemo(() => loadInvestments(), [])
  const creditCards = useMemo(() => loadCreditCards(), [])

  const balanceBreakdown = useMemo(
    () => getBalanceBreakdown(transactions),
    [transactions],
  )

  const totalInvestments = useMemo(() => {
    return investments.reduce(
      (sum, a) => sum + (Number(a.currentValue) || Number(a.investedAmount) || 0),
      0,
    )
  }, [investments])

  const creditCardDebt = useMemo(() => {
    return creditCards.reduce(
      (sum, c) => sum + (Number(c.currentDue) || 0),
      0,
    )
  }, [creditCards])

  const netWorth =
    balanceBreakdown.total + totalInvestments - creditCardDebt

  const monthlyExpenses = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7)
    return transactions
      .filter((t) => t.type === 'expense' && String(t.date).startsWith(thisMonth))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [transactions])

  const monthlyIncome = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7)
    return transactions
      .filter((t) => t.type === 'income' && String(t.date).startsWith(thisMonth))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [transactions])

  const financialHealth = useMemo(() => {
    const liquid = balanceBreakdown.total
    const savingsRate =
      monthlyIncome > 0
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
        : 0
    const investmentRatio =
      netWorth > 0 ? (totalInvestments / netWorth) * 100 : 0
    const debtRatio =
      netWorth > 0 ? (creditCardDebt / netWorth) * 100 : 0
    const emergencyMonths =
      monthlyExpenses > 0 ? liquid / monthlyExpenses : 0

    return {
      savingsRate: {
        value: savingsRate,
        status:
          savingsRate >= 20 ? 'healthy' : savingsRate >= 10 ? 'moderate' : 'risky',
      },
      investmentRatio: {
        value: investmentRatio,
        status:
          investmentRatio >= 10 ? 'healthy' : investmentRatio >= 5 ? 'moderate' : 'risky',
      },
      debtRatio: {
        value: debtRatio,
        status:
          debtRatio <= 5 ? 'healthy' : debtRatio <= 15 ? 'moderate' : 'risky',
      },
      emergencyMonths: {
        value: emergencyMonths,
        status:
          emergencyMonths >= 6 ? 'healthy' : emergencyMonths >= 3 ? 'moderate' : 'risky',
      },
    }
  }, [
    balanceBreakdown.total,
    monthlyIncome,
    monthlyExpenses,
    netWorth,
    totalInvestments,
    creditCardDebt,
  ])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-100">
            Overview
          </h1>
          <p className="text-xs text-slate-400">
            Your financial position at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[0.7rem] text-slate-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(34,197,94,0.35)]" />
          <span>Last updated: Today</span>
        </div>
      </header>

      {/* Top cards */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className={CARD_CLASS}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Net Worth
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-50">
            {formatCurrency(netWorth)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Balance + Bank + Investments
          </p>
        </div>

        <div className={CARD_CLASS}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Current Balance
          </p>
          <p
            className={[
              'mt-2 text-2xl font-bold tracking-tight',
              balanceBreakdown.total >= 0 ? 'text-emerald-300' : 'text-rose-300',
            ].join(' ')}
          >
            {formatCurrency(balanceBreakdown.total)}
          </p>
          <p className="mt-1 text-xs text-slate-400">On Hand + Bank</p>
        </div>

        <div className={CARD_CLASS}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Total Investments
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-sky-300">
            {formatCurrency(totalInvestments)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Portfolio value</p>
        </div>

        <div className={CARD_CLASS}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Monthly Expenses
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-rose-300">
            {formatCurrency(monthlyExpenses)}
          </p>
          <p className="mt-1 text-xs text-slate-400">This month</p>
        </div>
      </section>

      {/* Financial Health Summary */}
      <section className={CARD_CLASS}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Financial Health
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
              Savings Rate
            </p>
            <p
              className={[
                'mt-1 text-lg font-semibold',
                getHealthColor(financialHealth.savingsRate.status),
              ].join(' ')}
            >
              {financialHealth.savingsRate.value.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
              Investment Ratio
            </p>
            <p
              className={[
                'mt-1 text-lg font-semibold',
                getHealthColor(financialHealth.investmentRatio.status),
              ].join(' ')}
            >
              {financialHealth.investmentRatio.value.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
              Debt Ratio
            </p>
            <p
              className={[
                'mt-1 text-lg font-semibold',
                getHealthColor(financialHealth.debtRatio.status),
              ].join(' ')}
            >
              {financialHealth.debtRatio.value.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
              Emergency Fund Coverage
            </p>
            <p
              className={[
                'mt-1 text-lg font-semibold',
                getHealthColor(financialHealth.emergencyMonths.status),
              ].join(' ')}
            >
              {financialHealth.emergencyMonths.value.toFixed(1)} months of expenses
            </p>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className={CARD_CLASS}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Net Worth Growth
          </h3>
          <p className="mt-1 text-xs text-slate-400">Over time</p>
          <div className="mt-4">
            <NetWorthGrowthLine
              transactions={transactions}
              totalInvestments={totalInvestments}
            />
          </div>
        </div>

        <div className={CARD_CLASS}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Asset Allocation
          </h3>
          <p className="mt-1 text-xs text-slate-400">Cash · Bank · Investments</p>
          <div className="mt-4">
            <AssetAllocationDonut
              onHand={balanceBreakdown.onHand}
              bank={balanceBreakdown.bank}
              totalInvestments={totalInvestments}
            />
          </div>
        </div>
      </section>

      <section className={CARD_CLASS}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Monthly Expense Trend
        </h3>
        <p className="mt-1 text-xs text-slate-400">Spending by month</p>
        <div className="mt-4">
          <MonthlySpendingBar transactions={transactions} />
        </div>
      </section>
    </div>
  )
}

export default Overview
