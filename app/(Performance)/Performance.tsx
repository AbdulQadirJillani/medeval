"use client"

import { subDays, isWithinInterval, endOfDay, startOfDay } from "date-fns";
import { BarChart3, Trash2, TrendingUp } from "lucide-react";
import StatCard from "./StatCard";
import Attempts from "./Attempts";
import Graph from "./Graph";
import { useState } from "react";
import { type PerformanceData } from "./types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

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
  const [allData, setAllData] = useState<PerformanceData>(data)
  const [perfList, setPerfList] = useState<PerformanceData>(data)
  const summaryData = summarize(perfList)
  const [activeTab, setActiveTab] = useState(0)

  const clearAll = () => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.endsWith("-performance")) localStorage.removeItem(k)
    }
    setAllData([])
    setPerfList([])
    setActiveTab(0)
  }

  return (
    <div className="my-11 max-w-[90%] mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex w-fit rounded-full ring ring-accent bg-background shadow-sm">
          {[
            { label: "Overall", filterPerfList: allData },
            { label: "Last 30 days", filterPerfList: filterLast30Days(allData) },
            { label: "Last 7 days", filterPerfList: filterLast7Days(allData) },
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

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={allData.length === 0} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              Clear all attempts
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear all attempts?</DialogTitle>
              <DialogDescription>
                This will permanently delete every recorded attempt from your browser. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={clearAll}>Delete all</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
