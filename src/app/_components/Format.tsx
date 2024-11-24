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

type Props = {
  id: number,
  info: string|string[],
  question: string,
  difficulty?: number,
  hint?: string,
  answers: { option: string, explanation?: string, bool: boolean }[]
}[]

type clicked = {
  optionHx: { questionIndex: number, optionIndex: number }[]
}

type performance = {
  performance: {
    dateTime: string,
    questionOrigin: string,
    score: number,
    totalQuestions: number
  }[]
}

function Format({ data }: { data: Props }) {
  const pathname = usePathname()
  const [index, setIndex] = useState<number>(0)
  const [clickedOption, setClickedOption] = useState<clicked>({ optionHx: [] })
  const hasPageBeenRenderedFirstTime = useRef<boolean>(false)
  const resumeIndex = useRef<number>(0)
  const [resumeModal, setResumeModal] = useState<boolean>(false)
  const [finishModal, setFinishModal] = useState<boolean>(false)
  const score = useRef<number>(0)
  const lock = useRef<boolean>(false)
  const highestIndex = useRef<number>(-1)
  const totalQuestions = useMemo((): number => data.length, [data])
  const performance = useRef<performance>({performance: []})

  let questionOrigin = 'question'
  if (typeof data[0].info === typeof 'string') {
    const array = (data[0].info as string).split("/")
    if (array.length == 1) questionOrigin = array[0]
    else questionOrigin = `${array[1]} - ${array[2]}`
  }
  else if (Array.isArray(data[0].info)) {
    let mod
    const yearArr = []
    for (let index = 1; index < data[0].info.length; index++) {
      const array = data[0].info[index].split("/")
      mod = array[1]
      yearArr.push(` ${array[2]}`)
    }
    questionOrigin = `${mod} - compiled (${yearArr.toString()} )`
  }

  // use Effect for storing performance in local storage
  useEffect(() => {
    const storedPerformance = JSON.parse(localStorage.getItem('performance') as string)
    if (storedPerformance == null) {
      performance.current = {performance: []}
    }
    else {
      performance.current = storedPerformance
    }
    if (finishModal) {
      const newPerf = {
        dateTime: `${new Date().toLocaleString('en-us', {day: '2-digit', month: 'short', year: 'numeric'})} - ${new Date().toLocaleString('en-us', {hour: '2-digit', minute: '2-digit', hour12: true})}`,
        questionOrigin: questionOrigin,
        score: score.current,
        totalQuestions: totalQuestions
      }
      if (performance.current.performance.length > 0) {
        const lastPerf = performance.current.performance[performance.current.performance.length - 1]
        if (lastPerf.dateTime == newPerf.dateTime && lastPerf.questionOrigin == newPerf.questionOrigin) {
        }
        else {
          performance.current.performance.push(newPerf)
          localStorage.setItem('performance', JSON.stringify(performance.current))
        }
      }
      else {
        performance.current.performance.push(newPerf)
        localStorage.setItem('performance', JSON.stringify(performance.current))
      }
    }

    // eslint-disable-next-line
  }, [score, finishModal])

  // use Effect for setting score and option lock
  useEffect(() => {
    if (index > highestIndex.current) {
      lock.current = false
      highestIndex.current = index
    } else lock.current = true

    const storedScore = parseInt(localStorage.getItem(`${pathname}-score`) as string)

    if (index === 0 && storedScore > 0) {
    } else localStorage.setItem(`${pathname}-score`, score.current.toString())
  }, [index, score, pathname])

  // use Effect for showing resume modal on first render
  useEffect(() => {
    const storedIndex = parseInt(localStorage.getItem(`${pathname}-index`) as string)
    const storedHx = localStorage.getItem(`${pathname}-hx`) as string
    const storedScore = parseInt(localStorage.getItem(`${pathname}-score`) as string)

    if (index < storedIndex) {
      if (storedIndex + 1 == totalQuestions) {
        localStorage.removeItem(storedIndex.toString())
        localStorage.removeItem(storedHx)
        localStorage.removeItem(storedScore.toString())
      }
      else {
        setClickedOption(JSON.parse(storedHx))
        resumeIndex.current = storedIndex
        score.current = storedScore
        setResumeModal(true)
      }
    }
    // eslint-disable-next-line
  }, [])

  // use Effect for setting index in local storage on each render (except first render) and setting clicked option in local storage on each render (except when both the index is zero and the storedHx is not empty)
  useEffect(() => {
    const storedHx = `${pathname}-hx`
    const storedIndex = `${pathname}-index`

    if (index == 0 && localStorage.getItem(storedHx) !== null) {
    }
    else {
      localStorage.setItem(storedHx, JSON.stringify(clickedOption))
    }

    if (hasPageBeenRenderedFirstTime.current) {
      localStorage.setItem(storedIndex, index.toString())
    }
    hasPageBeenRenderedFirstTime.current = true
  }, [index, clickedOption, pathname])
  
  // use Effect for keyboard navigation
  useEffect(() => {
    function navigate(e: KeyboardEvent) {
      if (e.key==='ArrowRight' && index + 1 < totalQuestions) setIndex(prev => prev + 1)
      else if (e.key==='ArrowLeft' && index > 0) setIndex(prev => prev - 1)
    }

    document.addEventListener('keydown', navigate)
    return () => document.removeEventListener('keydown', navigate)
  }, [index, totalQuestions, pathname])

  return (
    <>
    <div className="w-[80%] my-6 mx-auto">

      <Header questionOrigin={questionOrigin} questionID={index + 1} totalQuestions={totalQuestions}/>

      <Question question={data[index].question}/>

      {
        data[index].hint && data[index].difficulty &&
        <HintDifficulty hint={data[index].hint} difficulty={data[index].difficulty}/>
      }

      <Options options={data[index].answers} clickedOption={clickedOption} setClickedOption={setClickedOption} index={index} score={score} lock={lock} highestIndex={highestIndex}/>

      <Footer index={index} setIndex={setIndex} totalQuestions={totalQuestions} setFinishModal={setFinishModal}/>

    </div>

    <ResumeModal resumeModal={resumeModal} setResumeModal={setResumeModal} resumeIndex={resumeIndex} setClickedOption={setClickedOption} setIndex={setIndex}/>

    <FinishModal finishModal={finishModal} setFinishModal={setFinishModal} score={score} totalQuestions={totalQuestions}/>
    </>
  )
}

export default Format