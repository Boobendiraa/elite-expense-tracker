import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal.jsx'
import { loadGoals, saveGoals } from '../storage/index.js'
import { formatCurrency } from '../utils/formatters.js'

const CARD_CLASS =
  'rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/60 backdrop-blur hover-lift transition hover:shadow-[0_0_0_1px_rgba(34,197,94,0.2)]'

const Goals = () => {
  const [goals, setGoals] = useState(() => loadGoals())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentSaved: '',
    targetDate: '',
  })

  useEffect(() => {
    saveGoals(goals)
  }, [goals])

  const resetForm = useCallback(() => {
    setForm({
      name: '',
      targetAmount: '',
      currentSaved: '',
      targetDate: '',
    })
    setEditingId(null)
  }, [])

  const openAdd = useCallback(() => {
    resetForm()
    setModalOpen(true)
  }, [resetForm])

  const openEdit = useCallback((g) => {
    setForm({
      name: g.name || '',
      targetAmount: String(g.targetAmount ?? ''),
      currentSaved: String(g.currentSaved ?? ''),
      targetDate: g.targetDate || '',
    })
    setEditingId(g.id)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    resetForm()
  }, [resetForm])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const target = Number(form.targetAmount) || 0
      const current = Number(form.currentSaved) || 0

      if (editingId) {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === editingId
              ? {
                  ...g,
                  name: form.name,
                  targetAmount: target,
                  currentSaved: current,
                  targetDate: form.targetDate,
                }
              : g,
          ),
        )
      } else {
        setGoals((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: form.name,
            targetAmount: target,
            currentSaved: current,
            targetDate: form.targetDate,
          },
        ])
      }
      closeModal()
    },
    [form, editingId, closeModal],
  )

  const handleDelete = useCallback((id) => {
    if (window.confirm('Delete this goal?')) {
      setGoals((prev) => prev.filter((g) => g.id !== id))
    }
  }, [])

  const handleAddToGoal = useCallback((id, amount) => {
    const amt = Number(amount)
    if (isNaN(amt) || amt <= 0) return
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, currentSaved: (Number(g.currentSaved) || 0) + amt }
          : g,
      ),
    )
  }, [])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-100">
            Financial Goals
          </h1>
          <p className="text-xs text-slate-400">
            Set targets and track your progress.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
        >
          + Add Goal
        </button>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.length === 0 ? (
          <div className={CARD_CLASS + ' col-span-full text-center py-12'}>
            <p className="text-slate-400">No goals yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Add goals like Emergency Fund, Travel, or House Fund.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/30"
            >
              + Add your first goal
            </button>
          </div>
        ) : (
          goals.map((g) => {
            const target = Number(g.targetAmount) || 0
            const current = Number(g.currentSaved) || 0
            const remaining = Math.max(0, target - current)
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0

            let monthlyRequired = 0
            if (g.targetDate && remaining > 0) {
              const end = new Date(g.targetDate)
              const now = new Date()
              const monthsLeft = Math.max(
                0,
                (end.getFullYear() - now.getFullYear()) * 12 +
                  (end.getMonth() - now.getMonth()),
              )
              monthlyRequired = monthsLeft > 0 ? remaining / monthsLeft : remaining
            }

            return (
              <div key={g.id} className={CARD_CLASS}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    {g.name}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="text-slate-400 hover:text-emerald-300 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="text-slate-400 hover:text-rose-300 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Target: {formatCurrency(target)}
                  {g.targetDate && (
                    <span className="ml-2">· {g.targetDate}</span>
                  )}
                </p>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[0.7rem] text-slate-500">
                  {pct.toFixed(0)}% complete
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Saved: {formatCurrency(current)}
                </p>
                <p className="text-xs text-slate-400">
                  Remaining: {formatCurrency(remaining)}
                </p>
                {monthlyRequired > 0 && (
                  <p className="mt-1 text-xs text-amber-300">
                    Save {formatCurrency(monthlyRequired)}/month to reach on time
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    placeholder="Add amount"
                    min="0"
                    step="0.01"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddToGoal(g.id, e.target.value)
                        e.target.value = ''
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.target.previousElementSibling
                      handleAddToGoal(g.id, input?.value)
                      if (input) input.value = ''
                    }}
                    className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Add
                  </button>
                </div>
              </div>
            )
          })
        )}
      </section>

      <Modal
        title={editingId ? 'Edit Goal' : 'Add Goal'}
        open={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-[0.7rem] text-slate-300">
            Goal Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Emergency Fund"
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Target Amount
            <input
              type="number"
              name="targetAmount"
              value={form.targetAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Current Saved
            <input
              type="number"
              name="currentSaved"
              value={form.currentSaved}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Target Date
            <input
              type="date"
              name="targetDate"
              value={form.targetDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Goals
