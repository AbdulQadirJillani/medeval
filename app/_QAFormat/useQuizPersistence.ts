import { Dispatch, RefObject, SetStateAction, useEffect, useRef } from "react"
import { answerRecords, isQuestionHash, parseQuestionHash, questionStatuses, remapAnswers, resumeIndexFor } from "./quizLogic"
import type { Clicked, Quiz } from "./types"

type Options = {
  enabled: boolean
  pathname: string
  data: Quiz
  keyAt: (i: number) => string
  indexOfKey: (key: string) => number
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
  enabled,
  pathname,
  data,
  keyAt,
  indexOfKey,
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
  // Set once a #q / #k link has been consumed, so a re-run of the restore effect
  // (dev Strict Mode; the hash is gone by then) doesn't pop the Resume modal
  const landed = useRef<boolean>(false)

  // Debounced save of in-progress module state
  useEffect(() => {
    if (!enabled) return
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
        obj.answerKeys = answerRecords(data, clickedOption, keyAt)
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
          answerKeys: answerRecords(data, clickedOption, keyAt),
          updatedAt: new Date(),
        }))
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [enabled, pathname, data, keyAt, totalQuestions, clickedOption, score, resumeIndex, recorded])

  // Restore module state on mount (and open resume modal if mid-attempt)
  useEffect(() => {
    if (!enabled) return
    // Legacy flag: it made the NEXT load skip restore and wipe progress made
    // after Retake. Nothing sets it now; clear stale copies and restore anyway.
    localStorage.removeItem(`${pathname}-reset`)
    // "Open at question" links (#q=N or #k=<questionKey>) land there and restore silently
    const hash = window.location.hash
    if (isQuestionHash(hash)) {
      // Stripped even when it doesn't match. A null state makes Next copy its
      // own state AND update its stored URL; passing history.state would skip
      // that sync, and a later router update would write the hash back.
      window.history.replaceState(null, "", window.location.pathname + window.location.search)
    }
    const jump = parseQuestionHash(hash, totalQuestions, indexOfKey)
    if (jump !== null) {
      landed.current = true
      setIndex(jump)
    }
    const stored = localStorage.getItem(`${pathname}-module`)
    if (!stored) return
    const obj = JSON.parse(stored)
    // Positions in `answers` go stale if the paper is re-scraped or reordered,
    // so answers are placed by content (answerKeys) and the score recounted
    let answers: Clicked = Array.isArray(obj.answers) ? obj.answers : []
    let restoredScore: number = obj.score ?? 0
    if (Array.isArray(obj.answerKeys)) {
      answers = remapAnswers(obj.answerKeys, data, keyAt)
      restoredScore = questionStatuses(data, answers).filter(s => s === "right").length
    } else if (obj.totalQuestions !== totalQuestions) {
      // Saved before answerKeys existed and the paper has changed since:
      // its positions can't be trusted, so start fresh rather than misplace them
      localStorage.removeItem(`${pathname}-module`)
      return
    }
    // Recomputed from the answers so sessions saved under the old
    // furthest-question-viewed rule land in the same place as new ones.
    const at = resumeIndexFor(answers, totalQuestions)
    if (at > 0) {
      resumeIndex.current = at
      score.current = restoredScore
      setClickedOption(answers)
      if (!landed.current) setResumeModal(true)
    }
  }, [enabled, pathname, data, keyAt, indexOfKey, totalQuestions, score, resumeIndex, setClickedOption, setResumeModal, setIndex])

  // Append the completed attempt to performance history once per finish
  useEffect(() => {
    if (!finishModal || recorded.current) return
    recorded.current = true
    if (!enabled) return
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
  }, [enabled, finishModal, pathname, totalQuestions, score, recorded])

  // Clear in-progress module state once finished
  useEffect(() => {
    if (enabled && finishModal) localStorage.removeItem(`${pathname}-module`)
  }, [enabled, pathname, finishModal])
}

export default useQuizPersistence
