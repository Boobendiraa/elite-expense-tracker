import { useEffect } from 'react'
import PropTypes from 'prop-types'

const Modal = ({ title, open, onClose, children }) => {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/95 shadow-xl shadow-slate-900/80 ring-1 ring-slate-700/80 animate-[fadeIn_180ms_ease-out]">
        <header className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          >
            <span className="text-xs leading-none">×</span>
          </button>
        </header>
        <div className="px-6 py-4 text-sm text-slate-100 space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
}

export default Modal

