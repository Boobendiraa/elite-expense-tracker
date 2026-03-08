import { useCallback, useEffect, useRef, useState } from 'react'
import Modal from './Modal.jsx'
import { loadProfile, saveProfile } from '../storage/index.js'

const MAX_AVATAR_BYTES = 80 * 1024

const ProfileModal = ({ open, onClose }) => {
  const [form, setForm] = useState(() => loadProfile())
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open) setForm(loadProfile())
  }, [open])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      let dataUrl = reader.result
      if (typeof dataUrl === 'string' && dataUrl.length > MAX_AVATAR_BYTES) {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let w = img.width
          let h = img.height
          if (w > 200 || h > 200) {
            if (w > h) {
              h = (200 / w) * h
              w = 200
            } else {
              w = (200 / h) * w
              h = 200
            }
          }
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, w, h)
          dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          setForm((prev) => ({ ...prev, avatar: dataUrl }))
        }
        img.src = dataUrl
      } else {
        setForm((prev) => ({ ...prev, avatar: dataUrl }))
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      saveProfile(form)
      onClose()
    },
    [form, onClose],
  )

  return (
    <Modal title="User Profile" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
            {form.avatar ? (
              <img src={form.avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-slate-400">
                {form.name ? form.name[0].toUpperCase() : '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              Upload Image
            </button>
            <p className="mt-1 text-[0.65rem] text-slate-500">JPG/PNG, &lt; 80KB</p>
          </div>
        </div>
        <label className="block text-[0.7rem] text-slate-400">
          Name
          <input
            type="text"
            name="name"
            value={form.name || ''}
            onChange={handleChange}
            placeholder="Your name"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          />
        </label>
        <label className="block text-[0.7rem] text-slate-400">
          Email ID
          <input
            type="email"
            name="email"
            value={form.email || ''}
            onChange={handleChange}
            placeholder="your@email.com"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
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
  )
}

export default ProfileModal
