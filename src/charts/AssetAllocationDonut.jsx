import { memo, useMemo } from 'react'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { formatCurrency } from '../utils/formatters.js'

ChartJS.register(ArcElement, Legend, Tooltip)

const AssetAllocationDonut = ({
  onHand = 0,
  bank = 0,
  totalInvestments = 0,
}) => {
  const { labels, data } = useMemo(() => {
    const cash = Number(onHand) || 0
    const bankVal = Number(bank) || 0
    const inv = Number(totalInvestments) || 0

    const out = []
    if (cash > 0) out.push(['Cash', cash])
    if (bankVal > 0) out.push(['Bank', bankVal])
    if (inv > 0) out.push(['Investments', inv])

    if (out.length === 0) {
      return { labels: ['No data'], data: [1] }
    }

    return {
      labels: out.map(([l]) => l),
      data: out.map(([, v]) => v),
    }
  }, [onHand, bank, totalInvestments])

  const colors = ['#22c55e', '#3b82f6', '#a855f7']

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
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

export default memo(AssetAllocationDonut)
