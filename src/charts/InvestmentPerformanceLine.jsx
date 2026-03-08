import { memo, useMemo } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
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
)

const InvestmentPerformanceLine = ({ investments }) => {
  const { labels, data } = useMemo(() => {
    const sorted = [...investments].sort(
      (a, b) => new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0),
    )
    let running = 0
    const labels = []
    const data = []
    sorted.forEach((a) => {
      const val = Number(a.currentValue) || Number(a.investedAmount) || 0
      running += val
      const d = a.dateAdded || new Date().toISOString().slice(0, 10)
      labels.push(d.length >= 7 ? d.slice(0, 7) : d)
      data.push(running)
    })
    if (sorted.length === 0) {
      labels.push(new Date().toISOString().slice(0, 7))
      data.push(0)
    }
    return { labels, data }
  }, [investments])

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Portfolio Value',
        data,
        fill: true,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.15)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.y),
        },
      },
    },
    layout: { padding: { top: 8, right: 12, bottom: 8, left: 12 } },
    scales: {
      x: {
        ticks: { maxRotation: 45, font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: { padding: 6, font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.06)' },
        border: { display: false },
      },
    },
  }

  return (
    <div className="h-56 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}

export default memo(InvestmentPerformanceLine)
