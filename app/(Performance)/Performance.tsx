"use client"

import { subDays, isWithinInterval, endOfDay, startOfDay } from "date-fns";
import { BarChart3, TrendingUp } from "lucide-react";
import StatCard from "./StatCard";
import Attempts from "./Attempts";
import Graph from "./Graph";
import { useState } from "react";
import { type PerformanceData } from "./types";

function summarize(data: PerformanceData) {
  const totalScore = data.reduce((sum, d) => sum + d.score, 0)
  const totalQs = data.reduce((sum, d) => sum + d.totalQuestions, 0)
  const avgPercent = totalQs > 0
    ? ((totalScore / totalQs) * 100).toFixed(1)
    : "0.0"
  const modulesAttempted = data.length

  return {
    modulesAttempted: modulesAttempted,
    avgPercent: avgPercent,
    totalScore: totalScore,
    totalQuestions: totalQs
  }
}

export function filterLast7Days(data: PerformanceData, ref: Date = new Date()) {
  const end = endOfDay(ref)
  const start = startOfDay(subDays(ref, 6))
  return data.filter((item) =>
    isWithinInterval(new Date(item.finishDateTime), { start, end })  // ← wrap in new Date()
  )
}

function filterLast30Days(data: PerformanceData, ref: Date = new Date()) {
  const end = endOfDay(ref)
  const start = startOfDay(subDays(ref, 29))
  return data.filter((item) =>
    isWithinInterval(new Date(item.finishDateTime), { start, end })  // ← wrap in new Date()
  )
}

function Performance({ data }: { data: PerformanceData }) {
  const [perfList, setPerfList] = useState<performance>(data)
  const summaryData = summarize(perfList)
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="my-11 max-w-[90%] mx-auto space-y-6">
      <div className="flex w-fit mx-auto sm:mx-0 rounded-full ring ring-accent bg-background shadow-sm">
        {[
          { label: "Overall", filterPerfList: data },
          { label: "Last 30 days", filterPerfList: filterLast30Days(data) },
          { label: "Last 7 days", filterPerfList: filterLast7Days(data) },
        ].map((tab, i) => (
          <button
            key={i}
            onClick={() => {
              setPerfList(tab.filterPerfList)
              setActiveTab(i)
            }}
            className={`px-3 py-2 text-sm font-medium transition-colors  first:rounded-l-full last:rounded-r-full ${activeTab === i ? "bg-purple-500 text-white" : "text-muted-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <StatCard title="Average Accuracy" value={String(summaryData.avgPercent) + '%'} icon={<TrendingUp className="h-4 w-4" />} />

        <StatCard title="Total Attempts" value={String(summaryData.modulesAttempted)} icon={<BarChart3 className="h-4 w-4" />} />
      </div>

      <Graph data={perfList} />

      <Attempts data={perfList} />
    </div>
  )
}

export default Performance
