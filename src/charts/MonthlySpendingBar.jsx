import { memo, useMemo } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { formatCurrency } from '../utils/formatters.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const formatMonthLabel = (year, monthIndex) => {
  const date = new Date(Number(year), Number(monthIndex) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

const MonthlySpendingBar = ({ transactions }) => {
  const { labels, data } = useMemo(() => {
    const totals = new Map()

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!t.date) return
        const [year, month] = String(t.date).split('-')
        if (!year || !month) return
        const key = `${year}-${month}`
        const prev = totals.get(key) ?? 0
        const amt = Number(t.amount) || 0
        totals.set(key, prev + amt)
      })

    const entries = Array.from(totals.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    )

    const labels = entries.map(([key]) => {
      const [year, month] = key.split('-')
      return formatMonthLabel(year, month)
    })

    const data = entries.map(([, value]) => value)

    return { labels, data }
  }, [transactions])

  if (!labels.length) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-24 w-40 rounded-xl bg-slate-800/60 animate-pulse" />
      </div>
    )
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Expenses',
        data,
        backgroundColor: '#fb923c',
        borderRadius: 10,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0
            return formatCurrency(value)
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' },
        grid: { display: false },
        offset: true,
      },
      y: {
        ticks: { color: '#6b7280', padding: 6 },
        grid: { color: 'rgba(31,41,55,0.15)' },
        border: { display: false },
      },
    },
  }

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  )
}

export default memo(MonthlySpendingBar)

