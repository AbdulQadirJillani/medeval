"use client"
import { useEffect, useState } from "react"
import Performance from "../Performance"
import { findPerformance } from "@/app/actions/findPerformance"
import { useUser } from "@clerk/nextjs"

type Performance = {
  id?: string,
  userId?: string,
  clerkId?: string,
  pathname: string,
  score: number,
  totalQuestions: number,
  finishDateTime: Date
}[]

function Page() {
  const { user } = useUser()
  const clerkId = user?.id
  const [performance, setPerformance] = useState<Performance>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!clerkId) return

    const loadPerformance = async () => {
      setIsLoading(true)

      // Check localStorage first
      const perfItemsLS = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.endsWith("-performance")) {
          const valueString = localStorage.getItem(key)
          if (valueString) {
            const value = JSON.parse(valueString)
            if (value.clerkId == clerkId) {
              perfItemsLS.push(value)
            }
          }
        }
      }

      if (perfItemsLS.length > 0) {
        setPerformance(perfItemsLS)
        setIsLoading(false)
        return
      }

      // Fetch from database if not in localStorage
      try {
        const perfItemsDB = await findPerformance()
        setPerformance(perfItemsDB)

        // Save to localStorage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        perfItemsDB.forEach((i: any) => {
          const key = `${i.pathname}-performance`
          const value = {
            clerkId: clerkId,
            finishDateTime: i.finishDateTime,
            pathname: i.pathname,
            score: i.score,
            totalQuestions: i.totalQuestions,
          }
          localStorage.setItem(key, JSON.stringify(value))
        })
      } catch (err) {
        console.error(err, "No performance in DB!")
      } finally {
        setIsLoading(false)
      }
    }

    loadPerformance()
  }, [clerkId])

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