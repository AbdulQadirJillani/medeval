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

  //useEffect for saving performance data from local storage to state and opening resume modal + looking up in DB and then saving to state and local storage if not in local storage
  useEffect(() => {
    if (!clerkId) return
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
      return
    }

    (async() => {
      try {
        const perfItemsLS = await findPerformance()
        setPerformance(perfItemsLS)
        perfItemsLS.forEach((i) => {
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
      }
      catch(err) {
        console.error(err, "No performance in DB!")
      }
    })()
  }, [clerkId])

  return (
    performance.length == 0
    ?
    <div className="mt-11 max-w-[90%] mx-auto text-lg">
      You have not completed any past paper yet! Start now to track your progress.
    </div>
    :
    <Performance performance={performance} />
  )
}

export default Page