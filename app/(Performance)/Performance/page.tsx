"use client"
import { useEffect, useState } from "react"
import Performance from "../Performance"
import { isEntry, type PerformanceData } from "../types"

function Page() {
  const [performance, setPerformance] = useState<PerformanceData>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)

    // Check localStorage first
    const perfItemsLS: PerformanceData = []
    const unreadable: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.endsWith("-performance")) {
        const valueString = localStorage.getItem(key)
        if (valueString) {
          let value: unknown
          try {
            value = JSON.parse(valueString)
          } catch {
            unreadable.push(key)
            continue
          }
          // Legacy values are a single object rather than an array
          const entries = (Array.isArray(value) ? value : [value]).filter(isEntry)
          if (entries.length === 0) unreadable.push(key)
          perfItemsLS.push(...entries)
        }
      }
    }
    // Removed after the loop: removing mid-loop would shift localStorage.key(i)
    unreadable.forEach(k => localStorage.removeItem(k))

    perfItemsLS.sort(
      (a, b) => new Date(b.finishDateTime).getTime() - new Date(a.finishDateTime).getTime()
    )

    if (perfItemsLS.length > 0) {
      setPerformance(perfItemsLS)
      setIsLoading(false)
      return
    }
    else {
      setIsLoading(false)
    }
  }, [])

  // Loading UI
  if (isLoading) {
    return (
      <div className="mt-11 max-w-[90%] mx-auto">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Loading your performance data...</span>
        </div>
      </div>
    )
  }

  // No data state
  if (performance.length === 0) {
    return (
      <div className="mt-11 max-w-[90%] mx-auto text-lg">
        You have not completed any past paper yet! Start now to track your progress.
      </div>
    )
  }

  // Data loaded
  return <Performance data={performance} />
}

export default Page