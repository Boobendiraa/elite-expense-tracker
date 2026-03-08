import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal.jsx'
import { loadInvestments, saveInvestments } from '../storage/index.js'
import { formatCurrency } from '../utils/formatters.js'
import AssetTypeDonut from '../charts/AssetTypeDonut.jsx'
import InvestmentPerformanceLine from '../charts/InvestmentPerformanceLine.jsx'
import { getCategoryHex } from '../utils/categoryColors.js'

const ASSET_TYPES = [
  'Mutual Funds',
  'Stocks',
  'Fixed Deposits',
  'Crypto',
  'Gold',
  'Other Investments',
]

const CARD_CLASS =
  'rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/60 backdrop-blur hover-lift transition hover:shadow-[0_0_0_1px_rgba(34,197,94,0.2)]'

const Wealth = () => {
  const [investments, setInvestments] = useState(() => loadInvestments())
  const [modalOpen, setModalOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    type: '',
    investedAmount: '',
    currentValue: '',
    dateAdded: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  useEffect(() => {
    saveInvestments(investments)
  }, [investments])

  const totals = useMemo(() => {
    let invested = 0
    let current = 0
    investments.forEach((a) => {
      invested += Number(a.investedAmount) || 0
      current += Number(a.currentValue) || Number(a.investedAmount) || 0
    })
    return {
      invested,
      current,
      profitLoss: current - invested,
    }
  }, [investments])

  const resetForm = useCallback(() => {
    setForm({
      name: '',
      type: '',
      investedAmount: '',
      currentValue: '',
      dateAdded: new Date().toISOString().slice(0, 10),
      notes: '',
    })
    setEditingId(null)
  }, [])

  const openAdd = useCallback(() => {
    resetForm()
    setModalOpen(true)
  }, [resetForm])

  const openEdit = useCallback((asset) => {
    setForm({
      name: asset.name || '',
      type: asset.type || '',
      investedAmount: String(asset.investedAmount ?? ''),
      currentValue: String(asset.currentValue ?? asset.investedAmount ?? ''),
      dateAdded: asset.dateAdded || new Date().toISOString().slice(0, 10),
      notes: asset.notes || '',
    })
    setEditingId(asset.id)
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
      const invested = Number(form.investedAmount) || 0
      const current = Number(form.currentValue) || invested

      if (editingId) {
        setInvestments((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? {
                  ...a,
                  name: form.name,
                  type: form.type,
                  investedAmount: invested,
                  currentValue: current,
                  dateAdded: form.dateAdded,
                  notes: form.notes,
                }
              : a,
          ),
        )
      } else {
        setInvestments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: form.name,
            type: form.type,
            investedAmount: invested,
            currentValue: current,
            dateAdded: form.dateAdded,
            notes: form.notes,
          },
        ])
      }
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1200)
      closeModal()
    },
    [form, editingId, closeModal],
  )

  const handleDelete = useCallback((id) => {
    if (window.confirm('Delete this asset?')) {
      setInvestments((prev) => prev.filter((a) => a.id !== id))
    }
  }, [])

  const handleUpdateValue = useCallback((id, newValue) => {
    const val = Number(newValue)
    if (isNaN(val)) return
    setInvestments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, currentValue: val } : a)),
    )
  }, [])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-100">
            Wealth & Investments
          </h1>
          <p className="text-xs text-slate-400">
            Track your portfolio and asset allocation.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
        >
          + Add Asset
        </button>
      </header>

      {/* Row 1: Summary cards */}
      <section className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        <div className={CARD_CLASS}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Total Invested
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-50">
            {formatCurrency(totals.invested)}
          </p>
        </div>
        <div className={CARD_CLASS}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Portfolio Value
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-sky-300">
            {formatCurrency(totals.current)}
          </p>
        </div>
        <div className={CARD_CLASS}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Profit / Loss
          </p>
          <p
            className={[
              'mt-2 text-2xl font-bold tracking-tight',
              totals.profitLoss >= 0 ? 'text-emerald-300' : 'text-rose-300',
            ].join(' ')}
          >
            {formatCurrency(totals.profitLoss)}
          </p>
        </div>
      </section>

      {/* Row 2: Investment Performance Chart - full width */}
      <section className={CARD_CLASS}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Investment Performance
        </h3>
        <p className="mt-1 text-xs text-slate-400">Portfolio value over time</p>
        <div className="mt-4 min-h-[224px] w-full">
          <InvestmentPerformanceLine investments={investments} />
        </div>
      </section>

      {/* Row 3: Asset Allocation (left) + Asset Table (right) */}
      <section className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-12">
        <div className={`${CARD_CLASS} lg:col-span-4`}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Asset Allocation
          </h3>
          <p className="mt-1 text-xs text-slate-400">By asset type</p>
          <div className="mt-4 min-h-[200px] flex items-center justify-center">
            <AssetTypeDonut investments={investments} />
          </div>
        </div>
        <div className={`${CARD_CLASS} lg:col-span-8`}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Your Assets
          </h3>
          <p className="mt-1 text-xs text-slate-400">Click Edit to update value</p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Invested</th>
                <th className="px-4 py-3 text-right font-medium">Current</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {investments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No assets yet. Add your first investment.
                  </td>
                </tr>
              ) : (
                investments.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-slate-100">{a.name}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
                        style={{
                          backgroundColor: `${getCategoryHex(a.type)}20`,
                          color: getCategoryHex(a.type),
                          border: `1px solid ${getCategoryHex(a.type)}60`,
                        }}
                      >
                        {a.type || 'Other'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300">
                      {formatCurrency(a.investedAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        defaultValue={a.currentValue ?? a.investedAmount}
                        onBlur={(e) =>
                          handleUpdateValue(a.id, e.target.value)
                        }
                        className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-right text-sky-300 outline-none focus:border-sky-500"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{a.dateAdded}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="text-slate-400 hover:text-emerald-300 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="text-slate-400 hover:text-rose-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/90 text-slate-950 success-check">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <Modal
        title={editingId ? 'Edit Asset' : 'Add Asset'}
        open={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-[0.7rem] text-slate-300">
            Asset Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Asset Type
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              <option value="">Select type</option>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Invested Amount
            <input
              type="number"
              name="investedAmount"
              value={form.investedAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Current Value
            <input
              type="number"
              name="currentValue"
              value={form.currentValue}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Same as invested if unknown"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Date Added
            <input
              type="date"
              name="dateAdded"
              value={form.dateAdded}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-[0.7rem] text-slate-300">
            Notes
            <input
              type="text"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional"
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

export default Wealth
