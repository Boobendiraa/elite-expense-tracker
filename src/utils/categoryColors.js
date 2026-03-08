const CATEGORY_HEX = {
  Food: '#f59e0b', // amber
  Canteen: '#22c55e', // green
  Transport: '#3b82f6', // blue
  Shopping: '#a855f7', // purple
  Health: '#ec4899', // pink
  Subscriptions: '#f97316', // orange
  Education: '#6366f1', // indigo
  Bills: '#0ea5e9', // sky
  Entertainment: '#eab308', // yellow
  Groceries: '#84cc16', // lime
  Travel: '#06b6d4', // cyan
  'Credit Card Payment': '#0ea5e9', // sky
  Miscellaneous: '#6b7280', // gray
  Misc: '#6b7280',
}

export const getCategoryHex = (name) =>
  CATEGORY_HEX[name] ?? (name ? stringToHex(name) : '#64748b')

function stringToHex(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h)
  }
  const hex = (h & 0x00ffffff).toString(16).padStart(6, '0')
  return '#' + hex
}

export const getCategoryBadgeClasses = (name) => {
  switch (name) {
    case 'Food':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
    case 'Canteen':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
    case 'Transport':
      return 'bg-blue-500/15 text-blue-300 border border-blue-500/40'
    case 'Shopping':
      return 'bg-purple-500/15 text-purple-300 border border-purple-500/40'
    case 'Health':
      return 'bg-pink-500/15 text-pink-300 border border-pink-500/40'
    case 'Subscriptions':
      return 'bg-orange-500/15 text-orange-300 border border-orange-500/40'
    case 'Education':
      return 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40'
    case 'Bills':
      return 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
    case 'Entertainment':
      return 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/40'
    case 'Groceries':
      return 'bg-lime-500/15 text-lime-300 border border-lime-500/40'
    case 'Travel':
      return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
    case 'Credit Card Payment':
      return 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
    case 'Miscellaneous':
    case 'Misc':
      return 'bg-slate-600/30 text-slate-200 border border-slate-500/60'
    default:
      return 'bg-slate-700/40 text-slate-200 border border-slate-600/60'
  }
}

