import { loadTransactions, loadInvestments, loadCreditCards } from '../storage/index.js'
import { formatCurrency } from './formatters.js'

export const INSIGHT_TYPES = {
  expense: 'Expense Warning',
  savings: 'Savings Insight',
  investment: 'Investment Growth',
  budget: 'Budget',
  credit: 'Credit Card Alert',
}

export const generateInsights = () => {
  const transactions = loadTransactions()
  const investments = loadInvestments()
  const creditCards = loadCreditCards()
  const insights = []

  const now = new Date()
  const thisWeek = getWeekRange(now)
  const lastWeek = getWeekRange(new Date(now - 7 * 24 * 60 * 60 * 1000))
  const thisMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7)

  const thisWeekExpenses = sumExpenses(transactions, thisWeek.start, thisWeek.end)
  const lastWeekExpenses = sumExpenses(
    transactions,
    lastWeek.start,
    lastWeek.end,
  )
  const thisMonthExpenses = sumExpensesByMonth(transactions, thisMonth)
  const lastMonthExpenses = sumExpensesByMonth(transactions, lastMonth)

  const thisWeekIncome = sumIncome(transactions, thisWeek.start, thisWeek.end)
  const lastWeekIncome = sumIncome(transactions, lastWeek.start, lastWeek.end)
  const thisWeekSavings = thisWeekIncome - thisWeekExpenses
  const lastWeekSavings = lastWeekIncome - lastWeekExpenses

  if (lastWeekExpenses > 0 && thisWeekExpenses > lastWeekExpenses * 1.1) {
    const pct = Math.round(((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100)
    insights.push({
      id: crypto.randomUUID(),
      type: 'expense',
      message: `Your expenses increased by ${pct}% this week.`,
      read: false,
      createdAt: Date.now(),
    })
  }

  if (lastWeekSavings >= 0 && thisWeekSavings > lastWeekSavings) {
    const diff = thisWeekSavings - lastWeekSavings
    if (diff > 100) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'savings',
        message: `You saved ${formatCurrency(diff)} more than last week.`,
        read: false,
        createdAt: Date.now(),
      })
    }
  }

  const totalInv = investments.reduce(
    (s, a) => s + (Number(a.currentValue) || Number(a.investedAmount) || 0),
    0,
  )
  if (totalInv > 0) {
    const invested = investments.reduce(
      (s, a) => s + (Number(a.investedAmount) || 0),
      0,
    )
    if (invested > 0 && totalInv > invested) {
      const gain = ((totalInv - invested) / invested) * 100
      if (gain > 5) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'investment',
          message: `Your portfolio is up ${gain.toFixed(1)}% from invested amount.`,
          read: false,
          createdAt: Date.now(),
        })
      }
    }
  }

  const topCategory = getTopExpenseCategory(transactions, thisMonth)
  if (topCategory) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'budget',
      message: `${topCategory.name} is your highest spending category this month (${formatCurrency(topCategory.amount)}).`,
      read: false,
      createdAt: Date.now(),
    })
  }

  const totalDue = creditCards.reduce(
    (s, c) => s + (Number(c.currentDue) || 0),
    0,
  )
  if (totalDue > 0) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'credit',
      message: `Credit card outstanding: ${formatCurrency(totalDue)}. Consider paying before due date.`,
      read: false,
      createdAt: Date.now(),
    })
  }

  return insights
}

function getWeekRange(d) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  }
}

function sumExpenses(transactions, start, end) {
  return transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.date >= start &&
        t.date <= end,
    )
    .reduce((s, t) => s + (Number(t.amount) || 0), 0)
}

function sumIncome(transactions, start, end) {
  return transactions
    .filter((t) => t.type === 'income' && t.date >= start && t.date <= end)
    .reduce((s, t) => s + (Number(t.amount) || 0), 0)
}

function sumExpensesByMonth(transactions, month) {
  return transactions
    .filter(
      (t) => t.type === 'expense' && String(t.date).startsWith(month),
    )
    .reduce((s, t) => s + (Number(t.amount) || 0), 0)
}

function getTopExpenseCategory(transactions, month) {
  const byCat = new Map()
  transactions
    .filter(
      (t) => t.type === 'expense' && String(t.date).startsWith(month),
    )
    .forEach((t) => {
      const cat = t.category || 'Uncategorized'
      byCat.set(cat, (byCat.get(cat) || 0) + (Number(t.amount) || 0))
    })
  const entries = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])
  return entries[0] ? { name: entries[0][0], amount: entries[0][1] } : null
}
