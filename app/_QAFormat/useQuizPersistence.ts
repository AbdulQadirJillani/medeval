import { Dispatch, RefObject, SetStateAction, useEffect, useRef } from "react"
import { parseQuestionHash, resumeIndexFor } from "./quizLogic"

type Clicked = { questionIndex: number, optionIndex: number[] }[]

type Options = {
  pathname: string
  totalQuestions: number
  clickedOption: Clicked
  score: RefObject<number>
  resumeIndex: RefObject<number>
  recorded: RefObject<boolean>
  finishModal: boolean
  setClickedOption: Dispatch<SetStateAction<Clicked>>
  setResumeModal: Dispatch<SetStateAction<boolean>>
  setIndex: Dispatch<SetStateAction<number>>
}

function useQuizPersistence({
  pathname,
  totalQuestions,
  clickedOption,
  score,
  resumeIndex,
  recorded,
  finishModal,
  setClickedOption,
  setResumeModal,
  setIndex,
}: Options) {
  // Set once a #q=N link has been consumed, so a re-run of the restore effect
  // (dev Strict Mode; the hash is gone by then) doesn't pop the Resume modal
  const landed = useRef<boolean>(false)

  // Debounced save of in-progress module state
  useEffect(() => {
    const handler = setTimeout(() => {
      // A finished paper is not in progress. Checked at fire time so a save
      // queued just before Finish can't re-create the key after it's cleared.
      if (recorded.current) return
      const moduleKey = `${pathname}-module`
      const stored = localStorage.getItem(moduleKey)
      if (stored) {
        const obj = JSON.parse(stored)
        obj.score = score.current
        obj.resumeIndex = resumeIndex.current = resumeIndexFor(clickedOption, totalQuestions)
        obj.answers = clickedOption
        obj.updatedAt = new Date()
        localStorage.setItem(moduleKey, JSON.stringify(obj))
      } else {
        localStorage.setItem(moduleKey, JSON.stringify({
          pathname,
          score: score.current,
          resumeIndex: resumeIndex.current = resumeIndexFor(clickedOption, totalQuestions),
          totalQuestions,
          startDateTime: new Date(),
          answers: clickedOption,
          updatedAt: new Date(),
        }))
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [pathname, totalQuestions, clickedOption, score, resumeIndex, recorded])

  // Restore module state on mount (and open resume modal if mid-attempt)
  useEffect(() => {
    // Legacy flag: it made the NEXT load skip restore and wipe progress made
    // after Retake. Nothing sets it now; clear stale copies and restore anyway.
    localStorage.removeItem(`${pathname}-reset`)
    // "Open at question N" links (#q=N) land on N and restore silently
    const jump = parseQuestionHash(window.location.hash, totalQuestions)
    if (jump !== null) {
      landed.current = true
      // Keep history.state: the Next router stores its own state there
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search)
      setIndex(jump)
    }
    const stored = localStorage.getItem(`${pathname}-module`)
    if (!stored) return
    const obj = JSON.parse(stored)
    // Recomputed from the answers so sessions saved under the old
    // furthest-question-viewed rule land in the same place as new ones.
    const at = resumeIndexFor(obj.answers ?? [], totalQuestions)
    if (at > 0) {
      resumeIndex.current = at
      score.current = obj.score
      setClickedOption(obj.answers)
      if (!landed.current) setResumeModal(true)
    }
  }, [pathname, totalQuestions, score, resumeIndex, setClickedOption, setResumeModal, setIndex])

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
