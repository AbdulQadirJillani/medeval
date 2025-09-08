"use client"

import React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface PerformanceItem {
  id?: string
  userId?: string
  clerkId?: string
  pathname: string
  score: number
  totalQuestions: number
  finishDateTime: Date
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function accuracyTrend(data: PerformanceItem[]) {
  const grouped: Record<string, { score: number; total: number }> = {}

  // Group by actual date instead of week start
  data.forEach((d) => {
    const date = formatDate(new Date(d.finishDateTime))

    if (!grouped[date]) {
      grouped[date] = { score: 0, total: 0 }
    }
    grouped[date].score += d.score
    grouped[date].total += d.totalQuestions
  })

  return Object.entries(grouped)
    .map(([date, vals]) => ({
      date,
      accuracy: Math.round((vals.score / vals.total) * 100 * 10) / 10,
    }))
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
}

// Custom tooltip component
interface TooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip: React.FC<TooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length && label) {
    return (
      <div className="bg-background p-3 ring ring-accent rounded-lg shadow-md">
        <p className="text-sm font-medium text-foreground mb-1">
          {new Date(label).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="text-sm text-cyan-400 font-semibold m-0">
          Accuracy: {payload[0].value}%
        </p>
      </div>
    )
  }
  return null
}

// Chart component that accepts `data` as prop
interface AccuracyTrendChartProps {
  data: PerformanceItem[]
}

const AccuracyTrendChart: React.FC<AccuracyTrendChartProps> = ({
  data,
}) => {
  const trendData = accuracyTrend(data)

  // Determine tick interval based on data range
  const getTickInterval = () => {
    if (trendData.length <= 7) return 0 // Show all ticks for 7 days or less
    if (trendData.length <= 30) return Math.ceil(trendData.length / 7) // Show ~7 ticks for a month
    return Math.ceil(trendData.length / 10) // Show ~10 ticks for longer periods
  }

  return (
    <div className="w-full bg-background rounded-xl shadow ring ring-accent p-5">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground m-0">
          Accuracy Trend
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Daily performance accuracy over time
        </p>
      </div>

      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trendData}
            margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="colorAccuracy"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#3b82f6"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="#3b82f6"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid className="text-muted-foreground/40"
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
            />
            <XAxis className="text-muted-foreground"
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              tickMargin={5}
              interval={getTickInterval()}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis className="text-muted-foreground"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              tickMargin={5}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#67e8f9", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorAccuracy)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AccuracyTrendChart