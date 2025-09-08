import { subDays, isWithinInterval, endOfDay, startOfDay } from "date-fns";
import { BarChart3, TrendingUp } from "lucide-react";
import StatCard from "./StatCard";
import Attempts from "./Attempts";
import Graph from "./Graph";
import { useState } from "react";

type performance = {
  id?: string,
  userId?: string,
  clerkId?: string;
  pathname: string;
  score: number;
  totalQuestions: number;
  finishDateTime: Date
}[]

function summarize(data: performance) {
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

export function filterLast7Days(data: performance, ref: Date = new Date()) {
  const end = endOfDay(ref)                // today 23:59:59
  const start = startOfDay(subDays(ref, 6)) // 7 days ago 00:00:00
  return data.filter((item) =>
    isWithinInterval(item.finishDateTime, { start, end })
  )
}

function filterLast30Days(data: performance, ref: Date = new Date()) {
  const end = endOfDay(ref)                   // today 23:59
  const start = startOfDay(subDays(ref, 29))  // 30 days ago 00:00
  return data.filter((item) =>
    isWithinInterval(item.finishDateTime, { start, end })
  )
}

const sampleData: performance = [
  {
    id: "2001",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Medicine/2024",
    score: 64,
    totalQuestions: 80,
    finishDateTime: new Date("2025-08-25"),
  },
  {
    id: "2002",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Surgery/2022",
    score: 72,
    totalQuestions: 90,
    finishDateTime: new Date("2025-08-28"),
  },
  {
    id: "2003",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Pediatrics/2023",
    score: 85,
    totalQuestions: 100,
    finishDateTime: new Date("2025-08-30"),
  },
  {
    id: "3001",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Infectious/2020",
    score: 48,
    totalQuestions: 60,
    finishDateTime: new Date("2025-08-05"),
  },
  {
    id: "3002",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Medicine/2021",
    score: 67,
    totalQuestions: 85,
    finishDateTime: new Date("2025-08-12"),
  },
  {
    id: "3003",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Surgery/2022",
    score: 75,
    totalQuestions: 95,
    finishDateTime: new Date("2025-08-18"),
  },
  {
    id: "3004",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Pediatrics/2023",
    score: 88,
    totalQuestions: 110,
    finishDateTime: new Date("2025-08-22"),
  },
  {
    id: "2001",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Medicine/2021",
    score: 62,
    totalQuestions: 80,
    finishDateTime: new Date("2025-01-12"),
  },
  {
    id: "2002",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Surgery/2022",
    score: 75,
    totalQuestions: 95,
    finishDateTime: new Date("2025-01-28"),
  },
  {
    id: "2003",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Infectious/2020",
    score: 58,
    totalQuestions: 70,
    finishDateTime: new Date("2025-02-10"),
  },
  {
    id: "2004",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Pediatrics/2023",
    score: 80,
    totalQuestions: 100,
    finishDateTime: new Date("2025-02-25"),
  },
  {
    id: "2005",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Medicine/2021",
    score: 66,
    totalQuestions: 85,
    finishDateTime: new Date("2025-03-05"),
  },
  {
    id: "2006",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Surgery/2022",
    score: 72,
    totalQuestions: 90,
    finishDateTime: new Date("2025-03-22"),
  },
  {
    id: "2007",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Infectious/2020",
    score: 50,
    totalQuestions: 65,
    finishDateTime: new Date("2025-04-08"),
  },
  {
    id: "2008",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Pediatrics/2023",
    score: 84,
    totalQuestions: 100,
    finishDateTime: new Date("2025-04-19"),
  },
  {
    id: "2009",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Medicine/2021",
    score: 70,
    totalQuestions: 90,
    finishDateTime: new Date("2025-05-03"),
  },
  {
    id: "2010",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Surgery/2022",
    score: 65,
    totalQuestions: 85,
    finishDateTime: new Date("2025-05-21"),
  },
  {
    id: "2011",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Infectious/2020",
    score: 60,
    totalQuestions: 75,
    finishDateTime: new Date("2025-06-07"),
  },
  {
    id: "2012",
    userId: "abcde",
    clerkId: "#pojnvn3",
    pathname: "/PastPapers/Pediatrics/2023",
    score: 90,
    totalQuestions: 110,
    finishDateTime: new Date("2025-06-25"),
  }
]

function Performance({ data }: { data: performance }) {
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
