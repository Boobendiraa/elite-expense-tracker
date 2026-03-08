import { useCallback, useState } from 'react'
import { verifyPasscode } from '../storage/index.js'

const LockScreen = ({ onUnlock }) => {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)

  const handleDigit = useCallback(
    (d) => {
      if (digits.length >= 4) return
      const next = digits + d
      setDigits(next)
      setError(false)
      if (next.length === 4) {
        if (verifyPasscode(next)) {
          onUnlock()
        } else {
          setError(true)
          setDigits('')
        }
      }
    },
    [digits, onUnlock],
  )

  const handleBackspace = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1))
    setError(false)
  }, [])

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950 px-4">
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold text-slate-100">Elite Expense Tracker</h1>
        <p className="mt-2 text-sm text-slate-400">Enter your 4-digit passcode</p>
      </div>
      <div className="flex gap-2 mb-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={
              'h-12 w-12 rounded-full border-2 flex items-center justify-center text-lg font-semibold ' +
              (digits.length > i
                ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                : 'border-slate-600 bg-slate-800/50 text-slate-500')
            }
          >
            {digits.length > i ? '•' : ''}
          </div>
        ))}
      </div>
      {error && (
        <p className="text-sm text-rose-400 mb-4">Wrong passcode. Try again.</p>
      )}
      <div className="grid grid-cols-3 gap-3 w-48 mt-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'B'].map((n) =>
          n === '' ? (
            <div key="empty" />
          ) : n === 'B' ? (
            <button
              key="B"
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
            >
              ⌫
            </button>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(String(n))}
              className="h-14 rounded-xl bg-slate-800 text-slate-100 text-lg font-medium hover:bg-slate-700 active:bg-slate-600"
            >
              {n}
            </button>
          ),
        )}
      </div>
    </div>
  )
}

export default LockScreen
