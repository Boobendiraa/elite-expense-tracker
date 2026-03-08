import { useCallback, useEffect, useRef, useState } from 'react'
import Modal from '../components/Modal.jsx'
import { useInstallPrompt } from '../hooks/useInstallPrompt.js'
import {
  loadSettings,
  saveSettings,
  exportAllData,
  importAllData,
  clearAllData,
  isPasscodeEnabled,
  setPasscode,
  verifyPasscode,
  clearPasscode,
} from '../storage/index.js'

const CARD_CLASS =
  'rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/60 backdrop-blur hover-lift transition hover:shadow-[0_0_0_1px_rgba(34,197,94,0.2)]'

const Settings = () => {
  const [settings, setSettings] = useState(() => loadSettings())
  const { installable, install } = useInstallPrompt()
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)
  const [passcodeModal, setPasscodeModal] = useState(null)
  const [passcodeForm, setPasscodeForm] = useState({ current: '', new: '', confirm: '' })

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const showMessage = useCallback((text, isError = false) => {
    setMessage({ text, isError })
    setTimeout(() => setMessage(null), 3000)
  }, [])

  const handleExport = useCallback(() => {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `elite-expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showMessage('Backup downloaded successfully')
  }, [showMessage])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result)
          if (importAllData(data)) {
            showMessage('Data restored. Refreshing...')
            setTimeout(() => window.location.reload(), 1000)
          } else {
            showMessage('Invalid backup file', true)
          }
        } catch {
          showMessage('Invalid JSON file', true)
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [showMessage],
  )

  const handleClearAll = useCallback(() => {
    if (!window.confirm('Delete ALL data? This cannot be undone.')) return
    clearAllData()
    showMessage('All data cleared. Refreshing...')
    setTimeout(() => window.location.reload(), 1000)
  }, [showMessage])

  const handleResetDaily = useCallback(() => {
    showMessage('Daily counters reset automatically at midnight.')
  }, [showMessage])

  const passcodeEnabled = isPasscodeEnabled()

  const handleSetPasscode = useCallback(() => {
    setPasscodeForm({ current: '', new: '', confirm: '' })
    setPasscodeModal('set')
  }, [])
  const handleChangePasscode = useCallback(() => {
    setPasscodeForm({ current: '', new: '', confirm: '' })
    setPasscodeModal('change')
  }, [])
  const handleDisablePasscode = useCallback(() => {
    setPasscodeForm({ current: '', new: '', confirm: '' })
    setPasscodeModal('disable')
  }, [])

  const submitPasscodeModal = useCallback(() => {
    if (passcodeModal === 'set') {
      if (passcodeForm.new.length !== 4 || passcodeForm.new !== passcodeForm.confirm) {
        showMessage('Enter 4 digits and confirm.', true)
        return
      }
      setPasscode(passcodeForm.new)
      showMessage('Passcode set.')
      setPasscodeModal(null)
    } else if (passcodeModal === 'change') {
      if (!verifyPasscode(passcodeForm.current)) {
        showMessage('Current passcode is wrong.', true)
        return
      }
      if (passcodeForm.new.length !== 4 || passcodeForm.new !== passcodeForm.confirm) {
        showMessage('Enter new 4 digits and confirm.', true)
        return
      }
      setPasscode(passcodeForm.new)
      showMessage('Passcode changed.')
      setPasscodeModal(null)
    } else if (passcodeModal === 'disable') {
      if (!verifyPasscode(passcodeForm.current)) {
        showMessage('Wrong passcode.', true)
        return
      }
      clearPasscode()
      showMessage('Passcode disabled.')
      setPasscodeModal(null)
    }
  }, [passcodeModal, passcodeForm, showMessage])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-slate-100">
          Settings
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Configure your preferences and manage data.
        </p>
      </header>

      {message && (
        <div
          className={
            'rounded-xl px-4 py-2 text-sm ' +
            (message.isError
              ? 'bg-rose-500/20 text-rose-300'
              : 'bg-emerald-500/20 text-emerald-300')
          }
        >
          {message.text}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <section className="grid gap-6 md:grid-cols-2">
        <div className={CARD_CLASS}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Preferences
          </h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Default Currency</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
                {settings.currency || 'INR'}
              </span>
            </div>
          </div>
        </div>

        <div className={CARD_CLASS}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Data & Backup
          </h3>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={handleResetDaily}
              className="block w-full rounded-xl border border-slate-700 px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"
            >
              Reset Daily Counters
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="block w-full rounded-xl bg-emerald-500/20 px-4 py-2 text-left text-sm text-emerald-300 hover:bg-emerald-500/30"
            >
              Export Data
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="block w-full rounded-xl bg-sky-500/20 px-4 py-2 text-left text-sm text-sky-300 hover:bg-sky-500/30"
            >
              Import Backup
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="block w-full rounded-xl bg-rose-500/20 px-4 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/30"
            >
              Clear All Data
            </button>
            {installable && (
              <button
                type="button"
                onClick={install}
                className="block w-full rounded-xl bg-emerald-500 px-4 py-2 text-left text-sm font-medium text-emerald-950 hover:bg-emerald-400"
              >
                Install App
              </button>
            )}
          </div>
        </div>
      </section>

      <section className={CARD_CLASS}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          App Security
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          {passcodeEnabled ? 'Passcode is enabled. App will lock on startup.' : 'Optional 4-digit passcode to lock the app.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!passcodeEnabled && (
            <button
              type="button"
              onClick={handleSetPasscode}
              className="rounded-xl bg-teal-500/20 px-4 py-2 text-sm text-teal-300 hover:bg-teal-500/30"
            >
              Set Passcode
            </button>
          )}
          {passcodeEnabled && (
            <>
              <button
                type="button"
                onClick={handleChangePasscode}
                className="rounded-xl bg-sky-500/20 px-4 py-2 text-sm text-sky-300 hover:bg-sky-500/30"
              >
                Change Passcode
              </button>
              <button
                type="button"
                onClick={handleDisablePasscode}
                className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/30"
              >
                Disable Passcode
              </button>
            </>
          )}
        </div>
      </section>

      <section className={CARD_CLASS}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          About
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Elite Expense Tracker · Personal finance at a glance · v1.0
        </p>
      </section>

      <section className={CARD_CLASS}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Credits
        </h3>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-700/80 text-2xl font-medium text-slate-400">
            B
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              Creator: Boobendiraa
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Personal finance tracker to help manage expenses, investments, and
              financial goals.
            </p>
          </div>
        </div>
      </section>

      {passcodeModal && (
        <Modal
          title={
            passcodeModal === 'set'
              ? 'Set Passcode'
              : passcodeModal === 'change'
                ? 'Change Passcode'
                : 'Disable Passcode'
          }
          open={!!passcodeModal}
          onClose={() => setPasscodeModal(null)}
        >
          <div className="space-y-4">
            {(passcodeModal === 'change' || passcodeModal === 'disable') && (
              <label className="block text-[0.7rem] text-slate-400">
                Current passcode
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={passcodeForm.current}
                  onChange={(e) =>
                    setPasscodeForm((p) => ({
                      ...p,
                      current: e.target.value.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  placeholder="****"
                />
              </label>
            )}
            {(passcodeModal === 'set' || passcodeModal === 'change') && (
              <>
                <label className="block text-[0.7rem] text-slate-400">
                  New passcode (4 digits)
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={passcodeForm.new}
                    onChange={(e) =>
                      setPasscodeForm((p) => ({
                        ...p,
                        new: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    placeholder="****"
                  />
                </label>
                <label className="block text-[0.7rem] text-slate-400">
                  Confirm
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={passcodeForm.confirm}
                    onChange={(e) =>
                      setPasscodeForm((p) => ({
                        ...p,
                        confirm: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    placeholder="****"
                  />
                </label>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasscodeModal(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPasscodeModal}
                className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400"
              >
                {passcodeModal === 'disable' ? 'Disable' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Settings
