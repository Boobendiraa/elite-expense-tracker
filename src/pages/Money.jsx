import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal.jsx'
import ExpenseBreakdownPie from '../charts/ExpenseBreakdownPie.jsx'
import MonthlySpendingBar from '../charts/MonthlySpendingBar.jsx'
import IncomeVsExpenseBar from '../charts/IncomeVsExpenseBar.jsx'
import {
  loadTransactions,
  saveTransactions,
  loadCustomExpenseCategories,
  saveCustomExpenseCategories,
  loadCustomIncomeCategories,
  saveCustomIncomeCategories,
  loadCreditCards,
  saveCreditCards,
} from '../storage/index.js'
import { formatCurrency } from '../utils/formatters.js'
import { getCategoryBadgeClasses } from '../utils/categoryColors.js'
import { getBalanceBreakdown } from '../utils/balance.js'

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Canteen',
  'Transport',
  'Shopping',
  'Health',
  'Subscriptions',
  'Education',
  'Bills',
  'Entertainment',
  'Groceries',
  'Travel',
  'Credit Card Payment',
  'Miscellaneous',
]

const DEFAULT_INCOME_CATEGORIES = [
  'Mother Support',
  'Scholarship',
  'Refund',
  'Other',
]

const PAYMENT_SOURCES_INCOME = ['Cash', 'Bank / UPI']
const PAYMENT_SOURCES_EXPENSE = ['Cash', 'Bank / UPI', 'Credit Card']

const getToday = () => new Date().toISOString().slice(0, 10)

const emptyForm = (type) => ({
  type,
  amount: '',
  category: '',
  description: '',
  date: getToday(),
  source: '',
  creditCardId: '',
})

const Money = () => {
  const [transactions, setTransactions] = useState(() => loadTransactions())
  const [customExpenseCategories, setCustomExpenseCategories] = useState(() =>
    loadCustomExpenseCategories(),
  )
  const [customIncomeCategories, setCustomIncomeCategories] = useState(() =>
    loadCustomIncomeCategories(),
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm('income'))
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creditCards, setCreditCards] = useState(() => loadCreditCards())
  const [showSuccess, setShowSuccess] = useState(false)
  const [payCardModalOpen, setPayCardModalOpen] = useState(false)
  const [payCardForm, setPayCardForm] = useState({ cardId: '', amount: '' })
  const [addCardModalOpen, setAddCardModalOpen] = useState(false)
  const [addCardForm, setAddCardForm] = useState({
    name: '',
    creditLimit: '',
    billingDate: '',
    dueDate: '',
  })

  const today = getToday()

  useEffect(() => {
    saveTransactions(transactions)
  }, [transactions])

  useEffect(() => {
    saveCustomExpenseCategories(customExpenseCategories)
  }, [customExpenseCategories])

  useEffect(() => {
    saveCustomIncomeCategories(customIncomeCategories)
  }, [customIncomeCategories])

  useEffect(() => {
    saveCreditCards(creditCards)
  }, [creditCards])

  const balanceBreakdown = useMemo(
    () => getBalanceBreakdown(transactions),
    [transactions],
  )

  const incomeToday = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income' && t.date === today)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [transactions, today])

  const expensesToday = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && t.date === today)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [transactions, today])

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateCompare = (b.date || '').localeCompare(a.date || '')
      if (dateCompare !== 0) return dateCompare
      return (b.createdAt || 0) - (a.createdAt || 0)
    })
  }, [transactions])

  const expenseCategories = useMemo(
    () => [...DEFAULT_EXPENSE_CATEGORIES, ...customExpenseCategories],
    [customExpenseCategories],
  )

  const incomeCategories = useMemo(
    () => [...DEFAULT_INCOME_CATEGORIES, ...customIncomeCategories],
    [customIncomeCategories],
  )

  const openModal = useCallback((type = 'expense') => {
    setForm(emptyForm(type))
    setNewCategoryName('')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleAddCustomCategory = useCallback(() => {
    const name = newCategoryName.trim()
    if (!name) return
    const isIncome = form.type === 'income'
    if (isIncome) {
      if (customIncomeCategories.includes(name)) {
        setForm((prev) => ({ ...prev, category: name }))
        setNewCategoryName('')
        return
      }
      setCustomIncomeCategories((prev) => [...prev, name])
      setForm((prev) => ({ ...prev, category: name }))
    } else {
      if (customExpenseCategories.includes(name)) {
        setForm((prev) => ({ ...prev, category: name }))
        setNewCategoryName('')
        return
      }
      setCustomExpenseCategories((prev) => [...prev, name])
      setForm((prev) => ({ ...prev, category: name }))
    }
    setNewCategoryName('')
  }, [
    newCategoryName,
    form.type,
    customIncomeCategories,
    customExpenseCategories,
  ])

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault()
      if (!form.amount || Number(form.amount) <= 0) return
      if (!form.category || !form.date || !form.source) return
      const isCreditCardSource = /^credit\s*card$/i.test(String(form.source || '').trim())
      if (form.type === 'expense' && isCreditCardSource && creditCards.length > 0 && !form.creditCardId)
        return
      const amt = Number(form.amount)
      const src = String(form.source || '').trim()
      const isCreditCard = /^credit\s*card$/i.test(src)

      if (form.type === 'expense' && isCreditCard && form.creditCardId) {
        setCreditCards((prev) => {
          const next = prev.map((c) =>
            c.id === form.creditCardId
              ? { ...c, currentDue: (Number(c.currentDue) || 0) + amt }
              : c,
          )
          saveCreditCards(next)
          return next
        })
      }

      const transaction = {
        id: crypto.randomUUID(),
        ...form,
        amount: amt,
        creditCardId: isCreditCard ? form.creditCardId : undefined,
        createdAt: Date.now(),
      }
      setTransactions((prev) => [...prev, transaction])
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1200)
      closeModal()
    },
    [form, closeModal, creditCards],
  )

  const handleDelete = useCallback((id) => {
    const confirmed = window.confirm('Delete this transaction?')
    if (confirmed) {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    }
  }, [])

  const isIncome = form.type === 'income'
  const categories = isIncome ? incomeCategories : expenseCategories

  const sectionSpacing = 'space-y-8'
  const cardPadding = 'p-6'
  const cardRadius = 'rounded-2xl'

  return (
    <div className={sectionSpacing}>
      {/* Compact header */}
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-100">
            Money Tracker
          </h1>
          <p className="text-xs text-slate-400">
            Track your daily cashflow.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[0.7rem] text-slate-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(34,197,94,0.35)]" />
          <span>Last updated: Today</span>
        </div>
      </header>

      {/* Row 1: Current Balance (primary) */}
      <section className={cardRadius + ' border border-slate-800/80 bg-slate-900/80 shadow-xl shadow-slate-950/60 backdrop-blur ' + cardPadding}>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Current Balance
        </p>
        <p
          className={[
            'mt-2 text-4xl font-bold tracking-tight md:text-5xl',
            balanceBreakdown.total >= 0 ? 'text-emerald-300' : 'text-rose-300',
          ].join(' ')}
        >
          {formatCurrency(balanceBreakdown.total)}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 rounded-xl bg-slate-950/50 px-4 py-3">
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
              On Hand (Cash)
            </p>
            <p className="text-lg font-semibold text-slate-200">
              {formatCurrency(balanceBreakdown.onHand)}
            </p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
              Bank
            </p>
            <p className="text-lg font-semibold text-slate-200">
              {formatCurrency(balanceBreakdown.bank)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Total = On Hand + Bank
        </p>
      </section>

      {/* Credit Card Due section */}
      <section
        className={
          cardRadius +
          ' border border-slate-800/80 bg-slate-900/80 shadow-lg shadow-slate-950/60 backdrop-blur ' +
          cardPadding
        }
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Credit Card Due
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAddCardForm({ name: '', creditLimit: '', billingDate: '', dueDate: '' })
                setAddCardModalOpen(true)
              }}
              className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
            >
              Add Card
            </button>
            {creditCards.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPayCardForm({ cardId: '', amount: '' })
                  setPayCardModalOpen(true)
                }}
                className="rounded-lg bg-sky-500/20 px-3 py-1 text-xs text-sky-300 hover:bg-sky-500/30"
              >
                Pay Bill
              </button>
            )}
          </div>
        </div>
        {creditCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-12 text-center">
            <p className="text-sm text-slate-400">
              No credit cards yet. Add one to track expenses.
            </p>
            <button
              type="button"
              onClick={() => {
                setAddCardForm({ name: '', creditLimit: '', billingDate: '', dueDate: '' })
                setAddCardModalOpen(true)
              }}
              className="mt-3 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/30"
            >
              Add Credit Card
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creditCards.map((c) => {
              const limit = Number(c.creditLimit) || 0
              const due = Number(c.currentDue) || 0
              const available = limit - due
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4"
                >
                  <p className="text-sm font-medium text-slate-200">{c.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Limit: {formatCurrency(limit)}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-rose-300">
                    Due: {formatCurrency(due)}
                  </p>
                  <p className="text-xs text-emerald-400">
                    Available: {formatCurrency(available)}
                  </p>
                  {c.billingDate && (
                    <p className="mt-1 text-[0.65rem] text-slate-500">
                      Billing: {c.billingDate} · Due: {c.dueDate || '-'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Row 2: Income Today | Expenses Today */}
      <section className="grid gap-6 md:grid-cols-2">
        <div
          className={
            cardRadius +
            ' border border-slate-800/80 bg-slate-900/80 shadow-lg shadow-slate-950/60 backdrop-blur transition hover:shadow-[0_0_0_1px_rgba(34,197,94,0.25)] ' +
            cardPadding
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Income today
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-300">
                {formatCurrency(incomeToday)}
              </p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <span className="text-xl">↑</span>
            </div>
          </div>
        </div>

        <div
          className={
            cardRadius +
            ' border border-slate-800/80 bg-slate-900/80 shadow-lg shadow-slate-950/60 backdrop-blur transition hover:shadow-[0_0_0_1px_rgba(248,113,113,0.25)] ' +
            cardPadding
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Expenses today
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-rose-300">
                {formatCurrency(expensesToday)}
              </p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
              <span className="text-xl">↓</span>
            </div>
          </div>
        </div>
      </section>

      {/* Row 3: Charts */}
      <section className="grid gap-6 md:grid-cols-2">
        <div
          className={
            cardRadius +
            ' border border-slate-800/80 bg-slate-900/80 shadow-lg shadow-slate-950/60 backdrop-blur transition hover:shadow-[0_0_0_1px_rgba(34,197,94,0.2)] ' +
            cardPadding
          }
        >
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Expense breakdown
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            By category
          </p>
          <div className="mt-4">
            <ExpenseBreakdownPie transactions={transactions} />
          </div>
        </div>

        <div
          className={
            cardRadius +
            ' border border-slate-800/80 bg-slate-900/80 shadow-lg shadow-slate-950/60 backdrop-blur transition hover:shadow-[0_0_0_1px_rgba(249,115,22,0.2)] ' +
            cardPadding
          }
        >
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Monthly spending
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Over time
          </p>
          <div className="mt-4">
            <MonthlySpendingBar transactions={transactions} />
          </div>
        </div>
      </section>

      <section
        className={
          cardRadius +
          ' border border-slate-800/80 bg-slate-900/80 shadow-lg shadow-slate-950/60 backdrop-blur transition hover:shadow-[0_0_0_1px_rgba(56,189,248,0.2)] ' +
          cardPadding
        }
      >
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Income vs expenses
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          By month
        </p>
        <div className="mt-4">
          <IncomeVsExpenseBar transactions={transactions} />
        </div>
      </section>

      {/* Row 4: Transaction history */}
      <section
        className={
          cardRadius +
          ' border border-slate-800/80 bg-slate-900/80 shadow-lg shadow-slate-950/60 backdrop-blur ' +
          cardPadding
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Transaction history
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Newest first. All time for analytics.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-950/60 px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-200">
              Balance: {formatCurrency(balanceBreakdown.total)}
            </span>
          </div>
        </div>

        <div className="mt-4 relative max-h-80 overflow-auto rounded-xl border border-slate-800/80">
          <table className="min-w-full text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-slate-950/95 text-slate-400 backdrop-blur">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length === 0 ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-3 rounded bg-slate-800/60" />
                    </td>
                  </tr>
                ))
              ) : (
                sortedTransactions.map((t, index) => {
                  const isIncomeRow = t.type === 'income'
                  const rowTint = isIncomeRow
                    ? 'bg-emerald-950/20'
                    : 'bg-rose-950/10'
                  const zebra =
                    index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900/30'
                  return (
                    <tr
                      key={t.id}
                      className={[
                        'transition-colors',
                        zebra,
                        rowTint,
                        'hover:bg-slate-800/80',
                      ].join(' ')}
                    >
                      <td className="px-4 py-2.5 align-middle text-slate-300">
                        {t.date}
                      </td>
                      <td className="px-4 py-2.5 align-middle text-slate-100">
                        {t.description ||
                          (t.type === 'income' ? 'Income' : 'Expense')}
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium border',
                            getCategoryBadgeClasses(t.category),
                          ].join(' ')}
                        >
                          {t.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium',
                            isIncomeRow
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/40',
                          ].join(' ')}
                        >
                          {isIncomeRow ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-right font-medium">
                        <span
                          className={
                            isIncomeRow
                              ? 'text-emerald-300'
                              : 'text-rose-300'
                          }
                        >
                          {formatCurrency(t.amount || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="text-[0.7rem] text-slate-500 hover:text-rose-300 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Transaction Modal */}
      <Modal
        title={isIncome ? 'Add income' : 'Add expense'}
        open={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-full bg-slate-800 p-0.5 text-[0.7rem]">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    type: 'income',
                    category: '',
                  }))
                }
                className={[
                  'px-3 py-1.5 rounded-full transition-colors',
                  isIncome
                    ? 'bg-emerald-500 text-emerald-950'
                    : 'text-slate-300 hover:text-slate-100',
                ].join(' ')}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    type: 'expense',
                    category: '',
                  }))
                }
                className={[
                  'px-3 py-1.5 rounded-full transition-colors',
                  !isIncome
                    ? 'bg-rose-500 text-rose-950'
                    : 'text-slate-300 hover:text-slate-100',
                ].join(' ')}
              >
                Expense
              </button>
            </div>
          </div>

          <label className="block text-[0.7rem] text-slate-300">
            Amount
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block text-[0.7rem] text-slate-300">
            Category
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && (e.preventDefault(), handleAddCustomCategory())
              }
              placeholder="New category name"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleAddCustomCategory}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
            >
              Add
            </button>
          </div>

          <label className="block text-[0.7rem] text-slate-300">
            Payment source
            <select
              name="source"
              value={form.source}
              onChange={(e) => {
                handleChange(e)
                setForm((prev) => ({ ...prev, creditCardId: '' }))
              }}
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              <option value="">Select source</option>
              {(isIncome ? PAYMENT_SOURCES_INCOME : PAYMENT_SOURCES_EXPENSE).map(
                (src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ),
              )}
            </select>
          </label>
          {!isIncome &&
            /^credit\s*card$/i.test(String(form.source || '').trim()) && (
              <label className="block text-[0.7rem] text-slate-300">
                Credit Card
                <select
                  name="creditCardId"
                  value={form.creditCardId}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                >
                  <option value="">Select card</option>
                  {creditCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {creditCards.length === 0 && (
                    <option value="" disabled>
                      Add a card in Credit Card section first
                    </option>
                  )}
                </select>
              </label>
            )}

          <label className="block text-[0.7rem] text-slate-300">
            Description
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional note"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block text-[0.7rem] text-slate-300">
            Date
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-700 px-4 py-2 text-[0.7rem] text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-5 py-2 text-[0.75rem] font-semibold text-emerald-950 shadow-md shadow-emerald-500/40 transition hover:bg-emerald-400"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Credit Card Modal */}
      <Modal
        title="Add Credit Card"
        open={addCardModalOpen}
        onClose={() => setAddCardModalOpen(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const name = addCardForm.name.trim()
            if (!name) return
            const limit = Number(addCardForm.creditLimit) || 0
            const card = {
              id: crypto.randomUUID(),
              name,
              creditLimit: limit,
              currentDue: 0,
              billingDate: addCardForm.billingDate || undefined,
              dueDate: addCardForm.dueDate || undefined,
            }
            setCreditCards((prev) => [...prev, card])
            setAddCardModalOpen(false)
            setAddCardForm({ name: '', creditLimit: '', billingDate: '', dueDate: '' })
          }}
          className="space-y-4"
        >
          <label className="block text-[0.7rem] text-slate-300">
            Card Name
            <input
              type="text"
              value={addCardForm.name}
              onChange={(e) =>
                setAddCardForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. HDFC Regalia"
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Credit Limit (₹)
            <input
              type="number"
              value={addCardForm.creditLimit}
              onChange={(e) =>
                setAddCardForm((prev) => ({ ...prev, creditLimit: e.target.value }))
              }
              min="0"
              step="1"
              placeholder="0"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Billing Date (e.g. 1st)
            <input
              type="text"
              value={addCardForm.billingDate}
              onChange={(e) =>
                setAddCardForm((prev) => ({ ...prev, billingDate: e.target.value }))
              }
              placeholder="1"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Payment Due Date (e.g. 20th)
            <input
              type="text"
              value={addCardForm.dueDate}
              onChange={(e) =>
                setAddCardForm((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              placeholder="20"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddCardModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-[0.7rem] text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-5 py-2 text-[0.75rem] font-semibold text-emerald-950 shadow-md shadow-emerald-500/40 transition hover:bg-emerald-400"
            >
              Add Card
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay Credit Card Bill Modal */}
      <Modal
        title="Pay Credit Card Bill"
        open={payCardModalOpen}
        onClose={() => setPayCardModalOpen(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const cardId = payCardForm.cardId
            const amount = Number(payCardForm.amount) || 0
            if (!cardId || amount <= 0) return
            const card = creditCards.find((c) => c.id === cardId)
            if (!card) return
            const due = Number(card.currentDue) || 0
            const payAmount = Math.min(amount, due)
            setCreditCards((prev) =>
              prev.map((c) =>
                c.id === cardId
                  ? { ...c, currentDue: Math.max(0, due - payAmount) }
                  : c,
              ),
            )
            setTransactions((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type: 'expense',
                amount: payAmount,
                category: 'Credit Card Payment',
                description: `Pay ${card.name} bill`,
                date: getToday(),
                source: 'Bank / UPI',
                creditCardPayment: true,
                creditCardId: cardId,
                createdAt: Date.now(),
              },
            ])
            setPayCardModalOpen(false)
            setPayCardForm({ cardId: '', amount: '' })
          }}
          className="space-y-4"
        >
          <label className="block text-[0.7rem] text-slate-300">
            Select Card
            <select
              value={payCardForm.cardId}
              onChange={(e) =>
                setPayCardForm((prev) => ({ ...prev, cardId: e.target.value }))
              }
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              <option value="">Select card</option>
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Due: {formatCurrency(Number(c.currentDue) || 0)})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Amount (₹)
            <input
              type="number"
              value={payCardForm.amount}
              onChange={(e) =>
                setPayCardForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              min="0"
              step="0.01"
              required
              placeholder={
                payCardForm.cardId
                  ? `Max: ${formatCurrency(
                      Number(creditCards.find((c) => c.id === payCardForm.cardId)?.currentDue) || 0,
                    )}`
                  : '0'
              }
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPayCardModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-[0.7rem] text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sky-500 px-5 py-2 text-[0.75rem] font-semibold text-slate-950 shadow-md shadow-sky-500/40 transition hover:bg-sky-400"
            >
              Pay Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/90 text-slate-950 success-check">
            <svg
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <button
        type="button"
        onClick={() => openModal('expense')}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/40 ring-2 ring-emerald-400/40 transition transform hover:scale-105 hover:bg-emerald-400 md:bottom-8 md:right-8"
        aria-label="Add transaction"
        title="Add Transaction"
      >
        <span className="text-2xl leading-none">+</span>
      </button>
    </div>
  )
}

export default Money
