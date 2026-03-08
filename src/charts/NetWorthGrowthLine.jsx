import { memo, useMemo } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { formatCurrency } from '../utils/formatters.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
)

const formatMonth = (year, month) => {
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

const NetWorthGrowthLine = ({ transactions, totalInvestments }) => {
  const { labels, data } = useMemo(() => {
    const byMonth = new Map()

    transactions.forEach((t) => {
      if (!t.date) return
      const [year, month] = String(t.date).split('-')
      if (!year || !month) return
      const key = `${year}-${month}`
      const cur = byMonth.get(key) ?? { income: 0, expense: 0 }
      const amt = Number(t.amount) || 0
      if (t.type === 'income') cur.income += amt
      if (t.type === 'expense') cur.expense += amt
      byMonth.set(key, cur)
    })

    const entries = Array.from(byMonth.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    )

    let running = 0
    const labels = entries.map(([key]) => {
      const [y, m] = key.split('-')
      return formatMonth(y, m)
    })
    const data = entries.map(([, v]) => {
      running += v.income - v.expense
      return running
    })

    if (data.length > 0) {
      data[data.length - 1] += Number(totalInvestments) || 0
    }

    return { labels, data }
  }, [transactions, totalInvestments])

  if (!labels.length) {
    return (
      <div className="flex h-56 items-center justify-center">
        <div className="h-16 w-32 rounded-xl bg-slate-800/60 animate-pulse" />
      </div>
    )
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Net Worth',
        data,
        fill: true,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 8, right: 12, bottom: 8, left: 12 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af', maxRotation: 45 },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#6b7280', padding: 6 },
        grid: { color: 'rgba(31,41,55,0.15)' },
        border: { display: false },
      },
    },
  }

  return (
    <div className="h-56">
      <Line data={chartData} options={options} />
    </div>
  )
}

export default memo(NetWorthGrowthLine)
