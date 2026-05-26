import { Dispatch, RefObject, SetStateAction, useEffect } from "react"

type Clicked = { questionIndex: number, optionIndex: number[] }[]

type Options = {
  pathname: string
  totalQuestions: number
  index: number
  clickedOption: Clicked
  score: RefObject<number>
  resumeIndex: RefObject<number>
  recorded: RefObject<boolean>
  finishModal: boolean
  setClickedOption: Dispatch<SetStateAction<Clicked>>
  setResumeModal: Dispatch<SetStateAction<boolean>>
}

function useQuizPersistence({
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
}: Options) {
  // Debounced save of in-progress module state
  useEffect(() => {
    const handler = setTimeout(() => {
      const moduleKey = `${pathname}-module`
      const stored = localStorage.getItem(moduleKey)
      if (stored) {
        const obj = JSON.parse(stored)
        obj.score = score.current
        if (index > obj.resumeIndex) {
          obj.resumeIndex = index
          resumeIndex.current = index
        }
        obj.answers = clickedOption
        localStorage.setItem(moduleKey, JSON.stringify(obj))
      } else {
        localStorage.setItem(moduleKey, JSON.stringify({
          pathname,
          score: score.current,
          resumeIndex: resumeIndex.current,
          totalQuestions,
          startDateTime: new Date(),
          answers: clickedOption,
        }))
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [pathname, index, totalQuestions, clickedOption, score, resumeIndex])

  // Restore module state on mount (and open resume modal if mid-attempt)
  useEffect(() => {
    if (localStorage.getItem(`${pathname}-reset`)) {
      localStorage.removeItem(`${pathname}-reset`)
      return
    }
    const stored = localStorage.getItem(`${pathname}-module`)
    if (!stored) return
    const obj = JSON.parse(stored)
    if (obj.resumeIndex > 0) {
      resumeIndex.current = obj.resumeIndex
      score.current = obj.score
      setClickedOption(obj.answers)
      setResumeModal(true)
    }
  }, [pathname, score, resumeIndex, setClickedOption, setResumeModal])

  // Append the completed attempt to performance history once per finish
  useEffect(() => {
    if (!finishModal || recorded.current) return
    recorded.current = true
    const entry = {
      pathname,
      score: score.current,
      totalQuestions,
      finishDateTime: new Date(),
    }
    const key = `${pathname}-performance`
    const existing = localStorage.getItem(key)
    const prev = existing ? JSON.parse(existing) : []
    const arr = Array.isArray(prev) ? prev : [prev]
    localStorage.setItem(key, JSON.stringify([...arr, entry]))
  }, [finishModal, pathname, totalQuestions, score, recorded])

  // Clear in-progress module state once finished
  useEffect(() => {
    if (finishModal) localStorage.removeItem(`${pathname}-module`)
  }, [pathname, finishModal])
}

export default useQuizPersistence
