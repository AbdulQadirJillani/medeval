"use client"

import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import Header from "./Header"
import Question from "./Question"
import HintDifficulty from "./HintDifficulty"
import Options from "./Options"
import Footer from "./Footer"
import ResumeModal from "./ResumeModal"
import FinishModal from "./FinishModal"
import { findModule_ClickedOptions } from "../actions/findModule_ClickedOptions"
import { useUser } from "@clerk/nextjs"
import { createPerformance } from "../actions/createPerformance"
import { deleteModule } from "../actions/deleteModule"
import { useSwipeable } from "react-swipeable"

type Props = {
  id: number,
  info: string,
  question: string,
  difficulty?: number,
  hint?: string,
  answers: { option: string, explanation?: string, bool: boolean }[]
}[]

type clicked = { questionIndex: number, optionIndex: number[] }[]


function Format({ data }: { data: Props }) {
  const { user } = useUser()
  const userId = user?.id
  const pathname = usePathname()
  const [index, setIndex] = useState<number>(0)
  const [clickedOption, setClickedOption] = useState<clicked>([])
  const resumeIndex = useRef<number>(0)
  const [resumeModal, setResumeModal] = useState<boolean>(false)
  const [finishModal, setFinishModal] = useState<boolean>(false)
  const score = useRef<number>(0)
  const lock = useRef<boolean>(false)
  const totalQuestions = useMemo((): number => data.length, [data])
  const questionOrigin = data[index].info.replace(/-/g, ' ')

  //useEffect for saving and debouncing module data to local storage
  useEffect(() => {
    const handler = setTimeout(() => {
      const storedModDataString = localStorage.getItem(`${pathname}-module`)
      if (storedModDataString) {
        const storedModDataObject = JSON.parse(storedModDataString)
        if (userId == storedModDataObject.clerkId) {
          storedModDataObject.score = score.current
          if (index > storedModDataObject.resumeIndex) {
            storedModDataObject.resumeIndex = index
            resumeIndex.current = index
          }
          storedModDataObject.answers = clickedOption
          localStorage.setItem(`${pathname}-module`, JSON.stringify(storedModDataObject))
        }
      }
      else {
        const stateModData = {
          clerkId: userId,
          pathname: pathname,
          score: score.current,
          resumeIndex: resumeIndex.current,
          totalQuestions: totalQuestions,
          startDateTime: new Date(),
          answers: clickedOption
        }
        localStorage.setItem(`${pathname}-module`, JSON.stringify(stateModData))
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [userId, pathname, score, index, totalQuestions, clickedOption])


  //useEffect for saving module data to the DB
  useEffect(() => {
    const handleUnload = () => {
      const storedModDataString = localStorage.getItem(`${pathname}-module`)
      if (!storedModDataString) return
      navigator.sendBeacon(
        "/api/createModuleData",
        new Blob([storedModDataString], { type: "application/json" })
      )
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleUnload();
      }
    }
    window.addEventListener("beforeunload", handleUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      window.removeEventListener("beforeunload", handleUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [pathname])


  //useEffect for saving resume index, score and clicked options from local storage to state and opening resume modal + looking up in DB and then saving to state and local storage if not in local storage
  useEffect(() => {
    const resetFlag = localStorage.getItem(`${pathname}-reset`)
    if (resetFlag) {
      localStorage.removeItem(`${pathname}-reset`)
      //skip restoring
      return
    }
    const storedModDataString = localStorage.getItem(`${pathname}-module`)
    if (storedModDataString) {
      const storedModDataObject = JSON.parse(storedModDataString)
      if (storedModDataObject.resumeIndex > 0) {
        resumeIndex.current = storedModDataObject.resumeIndex
        score.current = storedModDataObject.score
        setClickedOption(storedModDataObject.answers)
        setResumeModal(true)
        return
      }
    }
    (async () => {
      try {
        const data = await findModule_ClickedOptions(pathname)
        if (!data) {
          return
        }
        const { mod, clickedOptions } = data
        if (mod) {
          resumeIndex.current = mod.resumeIndex
          score.current = mod.score
          setResumeModal(true)
        }
        if (clickedOptions) setClickedOption(clickedOptions)

        const stateModData = {
          clerkId: userId,
          pathname: pathname,
          score: mod.score,
          resumeIndex: mod.resumeIndex,
          totalQuestions: mod.totalQuestions,
          startDateTime: new Date(mod.startDateTime),
          answers: clickedOptions
        }
        localStorage.setItem(`${pathname}-module`, JSON.stringify(stateModData))
      }
      catch (err) {
        console.error(err, 'Finding module data from DB failed!')
      }
    })()
  }, [pathname, userId])


  //useEffect for saving and debouncing performance history to local storage and DB
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!userId) return null
      const statePerformanceData = {
        clerkId: userId,
        pathname: pathname,
        score: score.current,
        totalQuestions: totalQuestions,
        finishDateTime: new Date()
      }
      if (finishModal) {
        localStorage.setItem(`${pathname}-performance`, JSON.stringify(statePerformanceData))
        await createPerformance(statePerformanceData)
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [userId, finishModal, pathname, totalQuestions])


  //useEffect for deleting module data from local storage and DB on finish
  useEffect(() => {
    if (finishModal) {
      (async () => {
        try {
          await deleteModule(pathname)
        }
        catch (err) {
          console.error(err, 'Deleting module data from DB failed!')
        }
      })()
      localStorage.removeItem(`${pathname}-module`)
    }
  }, [pathname, finishModal])

  // Back, Next, Finish functions
  const Back = () => {
    if (index > 0) {
      setIndex(prev => prev - 1)
      lock.current = true
    }
  }

  const Next = () => {
    if (index + 1 < totalQuestions) {
      setIndex(prev => prev + 1)
      if (resumeIndex.current > index) {
        lock.current = true
      }
      else {
        lock.current = false
      }
    }
  }

  const Finish = () => {
    setFinishModal(true)
  }

  // useEffect for keyboard navigation
  useEffect(() => {
    function navigate(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') Next()
      else if (e.key === 'ArrowLeft') Back()
    }
    document.addEventListener('keydown', navigate)
    return () => document.removeEventListener('keydown', navigate)
  }, [index, totalQuestions, pathname])


  // Swipe support
  const handlers = useSwipeable({
    onSwipedLeft: Next,
    onSwipedRight: Back,
    preventScrollOnSwipe: true,
    trackTouch: true
  })

  return (
    <div {...handlers}>
      <div className="w-[80%] my-6 mx-auto">

        <Header questionOrigin={questionOrigin} questionID={index + 1} totalQuestions={totalQuestions} />

        <Question question={data[index].question} />

        {
          data[index].hint && data[index].difficulty &&
          <HintDifficulty hint={data[index].hint} difficulty={data[index].difficulty} />
        }

        <Options options={data[index].answers} clickedOption={clickedOption} setClickedOption={setClickedOption} questionIndex={index} score={score} lock={lock} />

        <Footer index={index} totalQuestions={totalQuestions} Back={Back} Next={Next} Finish={Finish} />

      </div>

      <ResumeModal pathname={pathname} resumeModal={resumeModal} setResumeModal={setResumeModal} resumeIndex={resumeIndex} score={score} setClickedOption={setClickedOption} setIndex={setIndex} />

      <FinishModal finishModal={finishModal} setFinishModal={setFinishModal} score={score} totalQuestions={totalQuestions} />
    </div>
  )
}

export default Format