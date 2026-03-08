import { memo, useMemo } from 'react'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { formatCurrency } from '../utils/formatters.js'

ChartJS.register(ArcElement, Legend, Tooltip)

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#64748b']

const AssetTypeDonut = ({ investments }) => {
  const { labels, data } = useMemo(() => {
    const byType = new Map()
    investments.forEach((a) => {
      const type = a.type || 'Other'
      const val = Number(a.currentValue) || Number(a.investedAmount) || 0
      byType.set(type, (byType.get(type) || 0) + val)
    })
    const entries = Array.from(byType.entries()).sort((a, b) => b[1] - a[1])
    return {
      labels: entries.map(([l]) => l),
      data: entries.map(([, v]) => v),
    }
  }, [investments])

  if (!labels.length) {
    return (
      <div className="flex h-56 items-center justify-center text-slate-500 text-sm">
        Add assets to see allocation
      </div>
    )
  }

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: labels.map((l, i) => COLORS[i % COLORS.length]),
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
        labels: { color: '#cbd5f5', boxWidth: 10, padding: 10 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = data.reduce((a, b) => a + b, 0)
            const pct = total > 0 ? (ctx.parsed / total) * 100 : 0
            return `${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct.toFixed(1)}%)`
          },
        },
      },
    },
    layout: { padding: 12 },
  }

  return (
    <div className="h-56 px-2">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

export default memo(AssetTypeDonut)
