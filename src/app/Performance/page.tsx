"use client"

import { useEffect, useState } from "react"
import Performance from "../_components/Performance"

type performance = {
  performance: {
    dateTime: string,
    questionOrigin: string,
    score: number,
    totalQuestions: number
  }[]
}

function page() {
  // eslint-disable-next-line
  const [performance, setPerformance] = useState<performance>()
  // eslint-disable-next-line
  useEffect(() => {
    setPerformance(JSON.parse(localStorage.getItem('performance') as string))
    // eslint-disable-next-line
  }, [])

  return (
    performance
    ?
    <Performance performance={performance}/>
    :
    <div className="mt-11 max-w-[90%] mx-auto text-lg">
      You have not completed any past paper yet! Start now to track your progress.
    </div>
  )
}

export default page