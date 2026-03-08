// Storage layer - localStorage-backed. Future-ready for IndexedDB/API.

const KEYS = {
  transactions: 'elite-expense-tracker:transactions',
  investments: 'elite-expense-tracker:investments',
  goals: 'elite-expense-tracker:goals',
  settings: 'elite-expense-tracker:settings',
  profile: 'elite-expense-tracker:profile',
  creditCards: 'elite-expense-tracker:creditCards',
  insights: 'elite-expense-tracker:insights',
  customExpenseCategories: 'elite-expense-tracker:customExpenseCategories',
  customIncomeCategories: 'elite-expense-tracker:customIncomeCategories',
  passcode: 'elite-expense-tracker:passcode',
}

const safeParse = (raw, fallback) => {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const safeSet = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

const safeGet = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  return safeParse(window.localStorage.getItem(key), fallback)
}

// Transactions
export const loadTransactions = () => safeGet(KEYS.transactions, [])
export const saveTransactions = (v) => safeSet(KEYS.transactions, v)

// Investments
export const loadInvestments = () => safeGet(KEYS.investments, [])
export const saveInvestments = (v) => safeSet(KEYS.investments, v)

// Goals
export const loadGoals = () => safeGet(KEYS.goals, [])
export const saveGoals = (v) => safeSet(KEYS.goals, v)

// Settings (no bankBalance - computed from transactions)
const DEFAULT_SETTINGS = {
  currency: 'INR',
  theme: 'dark',
  notifications: true,
}
export const loadSettings = () => ({
  ...DEFAULT_SETTINGS,
  ...safeGet(KEYS.settings, {}),
})
export const saveSettings = (v) => safeSet(KEYS.settings, v)

// Profile (name, email, avatar as data URL)
const DEFAULT_PROFILE = { name: '', email: '', avatar: '' }
export const loadProfile = () => ({
  ...DEFAULT_PROFILE,
  ...safeGet(KEYS.profile, {}),
})
export const saveProfile = (v) => safeSet(KEYS.profile, v)

// Passcode (stored as hash; 4-digit)
function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return String(h)
}
export const isPasscodeEnabled = () => !!safeGet(KEYS.passcode, null)
export const setPasscode = (digits) => {
  if (!digits || String(digits).length !== 4) return false
  safeSet(KEYS.passcode, simpleHash(String(digits)))
  return true
}
export const verifyPasscode = (digits) => {
  const stored = safeGet(KEYS.passcode, null)
  if (!stored) return true
  return simpleHash(String(digits)) === stored
}
export const clearPasscode = () => {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(KEYS.passcode)
  } catch {}
}

// Credit Cards
export const loadCreditCards = () => safeGet(KEYS.creditCards, [])
export const saveCreditCards = (v) => safeSet(KEYS.creditCards, v)

// Insights
export const loadInsights = () => safeGet(KEYS.insights, [])
export const saveInsights = (v) => safeSet(KEYS.insights, v)

// Custom categories
export const loadCustomExpenseCategories = () =>
  safeGet(KEYS.customExpenseCategories, [])
export const saveCustomExpenseCategories = (v) =>
  safeSet(KEYS.customExpenseCategories, v)

export const loadCustomIncomeCategories = () =>
  safeGet(KEYS.customIncomeCategories, [])
export const saveCustomIncomeCategories = (v) =>
  safeSet(KEYS.customIncomeCategories, v)

// Export all data
export const exportAllData = () => ({
  version: 2,
  exportedAt: new Date().toISOString(),
  transactions: loadTransactions(),
  investments: loadInvestments(),
  goals: loadGoals(),
  settings: loadSettings(),
  profile: loadProfile(),
  creditCards: loadCreditCards(),
  insights: loadInsights(),
  customExpenseCategories: loadCustomExpenseCategories(),
  customIncomeCategories: loadCustomIncomeCategories(),
})

// Import and restore
export const importAllData = (data) => {
  if (!data || typeof data !== 'object') return false
  if (Array.isArray(data.transactions)) saveTransactions(data.transactions)
  if (Array.isArray(data.investments)) saveInvestments(data.investments)
  if (Array.isArray(data.goals)) saveGoals(data.goals)
  if (data.settings && typeof data.settings === 'object')
    saveSettings({ ...loadSettings(), ...data.settings })
  if (data.profile && typeof data.profile === 'object')
    saveProfile({ ...loadProfile(), ...data.profile })
  if (Array.isArray(data.creditCards)) saveCreditCards(data.creditCards)
  if (Array.isArray(data.insights)) saveInsights(data.insights)
  if (Array.isArray(data.customExpenseCategories))
    saveCustomExpenseCategories(data.customExpenseCategories)
  if (Array.isArray(data.customIncomeCategories))
    saveCustomIncomeCategories(data.customIncomeCategories)
  return true
}

// Clear all data
export const clearAllData = () => {
  saveTransactions([])
  saveInvestments([])
  saveGoals([])
  saveSettings(DEFAULT_SETTINGS)
  saveProfile(DEFAULT_PROFILE)
  saveCreditCards([])
  saveInsights([])
  saveCustomExpenseCategories([])
  saveCustomIncomeCategories([])
  clearPasscode()
}
