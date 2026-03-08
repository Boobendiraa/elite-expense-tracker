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

function getWeekRange(d) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
    label: `Week ${monday.getDate()}/${monday.getMonth() + 1}`,
  }
}

const WeeklySpendingLine = ({ transactions }) => {
  const { labels, data } = useMemo(() => {
    const weeks = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weeks.push(getWeekRange(d))
    }
    const values = weeks.map((w) =>
      transactions
        .filter(
          (t) =>
            t.type === 'expense' && t.date >= w.start && t.date <= w.end,
        )
        .reduce((s, t) => s + (Number(t.amount) || 0), 0),
    )
    return {
      labels: weeks.map((w) => w.label),
      data: values,
    }
  }, [transactions])

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Spending',
        data,
        fill: true,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.12)',
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
    <div className="h-48 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}

export default memo(WeeklySpendingLine)
