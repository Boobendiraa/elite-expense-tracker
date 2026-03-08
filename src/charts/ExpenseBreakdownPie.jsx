import { memo, useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Legend, Tooltip } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { getCategoryHex } from '../utils/categoryColors.js'
import { formatCurrency } from '../utils/formatters.js'

ChartJS.register(ArcElement, Legend, Tooltip)

const ExpenseBreakdownPie = ({ transactions }) => {
  const { labels, data } = useMemo(() => {
    const totals = new Map()

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const key = t.category || 'Uncategorized'
        const prev = totals.get(key) ?? 0
        const amt = Number(t.amount) || 0
        totals.set(key, prev + amt)
      })

    const entries = Array.from(totals.entries()).sort(
      (a, b) => b[1] - a[1],
    )

    return {
      labels: entries.map(([label]) => label),
      data: entries.map(([, value]) => value),
    }
  }, [transactions])

  if (!labels.length) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-20 w-20 rounded-full bg-slate-800/60 animate-pulse" />
      </div>
    )
  }

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: labels.map((label) => getCategoryHex(label)),
        borderColor: '#020617',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          color: '#cbd5f5',
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = context.parsed || 0
            return `${label}: ${formatCurrency(value)}`
          },
        },
      },
    },
    layout: {
      padding: 12,
    },
  }

  return (
    <div className="h-64 px-2 py-1">
      <Pie data={chartData} options={options} />
    </div>
  )
}

export default memo(ExpenseBreakdownPie)

