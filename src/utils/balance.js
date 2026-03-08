// Balance calculations from transactions (memoize in components)
// Source: Cash -> onHand; Bank, UPI, Bank/UPI -> bank; Credit Card -> debt (not here)

const isCash = (s) => /^cash$/i.test(s)
const isBank = (s) => /^(bank|upi|bank\s*\/\s*upi)$/i.test(String(s).trim())
const isCreditCard = (s) => /^credit\s*card$/i.test(s)

export const getBalanceBreakdown = (transactions) => {
  let onHand = 0
  let bank = 0

  transactions.forEach((t) => {
    const amt = Number(t.amount) || 0
    const source = String(t.source || '').trim()

    if (t.type === 'income') {
      if (isCash(source)) onHand += amt
      else if (isBank(source)) bank += amt
      else if (!isCreditCard(source)) bank += amt
    } else if (t.type === 'expense') {
      if (isCreditCard(source)) return
      if (isCash(source)) onHand -= amt
      else if (isBank(source)) bank -= amt
      else bank -= amt
    }
  })

  return {
    onHand,
    bank,
    total: onHand + bank,
  }
}
