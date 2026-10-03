"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import Header from "./Header"
import Question from "./Question"
import HintDifficulty from "./HintDifficulty"
import Options from "./Options"
import Footer from "./Footer"
import ResumeModal from "./ResumeModal"
import FinishModal from "./FinishModal"
import { useSwipeable } from "react-swipeable"
import type { Quiz } from "./types"
import useQuizPersistence from "./useQuizPersistence"

type clicked = { questionIndex: number, optionIndex: number[] }[]


function Format({ data }: { data: Quiz }) {
  const pathname = usePathname()
  const [index, setIndex] = useState<number>(0)
  const [clickedOption, setClickedOption] = useState<clicked>([])
  const resumeIndex = useRef<number>(0)
  const [resumeModal, setResumeModal] = useState<boolean>(false)
  const [finishModal, setFinishModal] = useState<boolean>(false)
  const score = useRef<number>(0)
  const lock = useRef<boolean>(false)
  const recorded = useRef<boolean>(false)
  const totalQuestions = data.length
  const questionOrigin = data[index].info.replace(/-/g, ' ')

  useQuizPersistence({
    pathname,
    totalQuestions,
    index,
    clickedOption,
    score,
    resumeIndex,
    recorded,
    finishModal,
    setClickedOption,
    setResumeModal,
  })

  // Back, Next, Finish functions
  // Navigation only clears the per-render click latch. Whether a question can
  // still be scored is decided in Options from the recorded answers, so a
  // skipped question stays answerable and an answered one stays locked.
  const Back = () => {
    if (index > 0) {
      setIndex(prev => prev - 1)
      lock.current = false
    }
  }

  const Next = () => {
    if (index + 1 < totalQuestions) {
      setIndex(prev => prev + 1)
      lock.current = false
    }
  }

  const Finish = () => {
    setFinishModal(true)
  }

  const Retake = () => {
    localStorage.setItem(`${pathname}-reset`, "true")
    score.current = 0
    resumeIndex.current = 0
    lock.current = false
    recorded.current = false
    setIndex(0)
    setClickedOption([])
    setFinishModal(false)
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

      <FinishModal finishModal={finishModal} setFinishModal={setFinishModal} score={score} totalQuestions={totalQuestions} Retake={Retake} />
    </div>
  )
}

export default Format