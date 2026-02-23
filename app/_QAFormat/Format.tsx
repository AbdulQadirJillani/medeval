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
        storedModDataObject.score = score.current
        if (index > storedModDataObject.resumeIndex) {
          storedModDataObject.resumeIndex = index
          resumeIndex.current = index
        }
        storedModDataObject.answers = clickedOption
        localStorage.setItem(`${pathname}-module`, JSON.stringify(storedModDataObject))
      }
      else {
        const stateModData = {
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
  }, [pathname, score, index, totalQuestions, clickedOption])

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
  }, [pathname])


  //useEffect for saving and debouncing performance history to local storage and DB
  useEffect(() => {
    const handler = setTimeout(async () => {
      const statePerformanceData = {
        pathname: pathname,
        score: score.current,
        totalQuestions: totalQuestions,
        finishDateTime: new Date()
      }
      if (finishModal) {
        localStorage.setItem(`${pathname}-performance`, JSON.stringify(statePerformanceData))
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [finishModal, pathname, totalQuestions])


  //useEffect for deleting module data from local storage and DB on finish
  useEffect(() => {
    if (finishModal) {
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