import { useMemo } from 'react'
import {
  loadTransactions,
  loadInvestments,
  loadCreditCards,
} from '../storage/index.js'
import { formatCurrency } from '../utils/formatters.js'
import { getBalanceBreakdown } from '../utils/balance.js'
import WeeklySpendingLine from '../charts/WeeklySpendingLine.jsx'

const CARD_CLASS =
  'rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/60 backdrop-blur hover-lift transition hover:shadow-[0_0_0_1px_rgba(34,197,94,0.2)]'

const getHealthColor = (status) => {
  if (status === 'healthy') return 'text-emerald-400'
  if (status === 'moderate') return 'text-amber-400'
  return 'text-rose-400'
}

const getHealthBg = (status) => {
  if (status === 'healthy') return 'bg-emerald-500/10 border-emerald-500/30'
  if (status === 'moderate') return 'bg-amber-500/10 border-amber-500/30'
  return 'bg-rose-500/10 border-rose-500/30'
}

const Essentials = () => {
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

  const netWorth = balanceBreakdown.total + totalInvestments - creditCardDebt

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

  const metrics = useMemo(() => {
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
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate()
    const dailyAvg = daysInMonth > 0 ? monthlyExpenses / daysInMonth : 0

    const thisMonth = new Date().toISOString().slice(0, 7)
    const byCat = new Map()
    transactions
      .filter(
        (t) => t.type === 'expense' && String(t.date).startsWith(thisMonth),
      )
      .forEach((t) => {
        const cat = t.category || 'Uncategorized'
        byCat.set(cat, (byCat.get(cat) || 0) + (Number(t.amount) || 0))
      })
    const topCategory = Array.from(byCat.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0]

    return {
      savingsRate: {
        value: savingsRate,
        status:
          savingsRate >= 20 ? 'healthy' : savingsRate >= 10 ? 'moderate' : 'risky',
      },
      investmentRatio: {
        value: investmentRatio,
        status:
          investmentRatio >= 10
            ? 'healthy'
            : investmentRatio >= 5
              ? 'moderate'
              : 'risky',
      },
      debtRatio: {
        value: debtRatio,
        status:
          debtRatio <= 5 ? 'healthy' : debtRatio <= 15 ? 'moderate' : 'risky',
      },
      emergencyMonths: {
        value: emergencyMonths,
        status:
          emergencyMonths >= 6
            ? 'healthy'
            : emergencyMonths >= 3
              ? 'moderate'
              : 'risky',
      },
      dailyAvg,
      topCategory: topCategory
        ? { name: topCategory[0], amount: topCategory[1] }
        : null,
    }
  }, [
    balanceBreakdown.total,
    monthlyIncome,
    monthlyExpenses,
    netWorth,
    totalInvestments,
    creditCardDebt,
    transactions,
  ])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-slate-100">
          Financial Intelligence
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Key metrics and weekly spending trend.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          className={
            CARD_CLASS +
            ' border ' +
            getHealthBg(metrics.savingsRate.status)
          }
        >
          <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
            Savings Rate
          </p>
          <p
            className={
              'mt-1 text-2xl font-bold ' + getHealthColor(metrics.savingsRate.status)
            }
          >
            {metrics.savingsRate.value.toFixed(1)}%
          </p>
        </div>
        <div
          className={
            CARD_CLASS + ' border ' + getHealthBg(metrics.investmentRatio.status)
          }
        >
          <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
            Investment Ratio
          </p>
          <p
            className={
              'mt-1 text-2xl font-bold ' +
              getHealthColor(metrics.investmentRatio.status)
            }
          >
            {metrics.investmentRatio.value.toFixed(1)}%
          </p>
        </div>
        <div
          className={CARD_CLASS + ' border ' + getHealthBg(metrics.debtRatio.status)}
        >
          <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
            Debt Ratio
          </p>
          <p
            className={
              'mt-1 text-2xl font-bold ' + getHealthColor(metrics.debtRatio.status)
            }
          >
            {metrics.debtRatio.value.toFixed(1)}%
          </p>
        </div>
        <div
          className={
            CARD_CLASS + ' border ' + getHealthBg(metrics.emergencyMonths.status)
          }
        >
          <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
            Emergency Fund Coverage
          </p>
          <p
            className={
              'mt-1 text-2xl font-bold ' +
              getHealthColor(metrics.emergencyMonths.status)
            }
          >
            {metrics.emergencyMonths.value.toFixed(1)} months of expenses
          </p>
        </div>
        <div className={CARD_CLASS}>
          <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
            Daily Average Spending
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-200">
            {formatCurrency(metrics.dailyAvg)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">This month</p>
        </div>
        <div className={CARD_CLASS}>
          <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
            Top Spending Category
          </p>
          <p className="mt-1 text-xl font-bold text-slate-200">
            {metrics.topCategory
              ? metrics.topCategory.name
              : '—'}
          </p>
          <p className="mt-0.5 text-sm text-slate-400">
            {metrics.topCategory
              ? formatCurrency(metrics.topCategory.amount)
              : 'No data'}
          </p>
        </div>
      </section>

      <section className={CARD_CLASS}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Weekly Spending Trend
        </h3>
        <p className="mt-1 text-xs text-slate-400">Last 6 weeks</p>
        <div className="mt-4 min-h-[192px]">
          <WeeklySpendingLine transactions={transactions} />
        </div>
      </section>
    </div>
  )
}

export default Essentials
