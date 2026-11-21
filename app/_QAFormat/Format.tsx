"use client"

import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import Header from "./Header"
import ProgressMap from "./ProgressMap"
import Question from "./Question"
import HintDifficulty from "./HintDifficulty"
import Options from "./Options"
import Footer from "./Footer"
import ResumeModal from "./ResumeModal"
import FinishModal from "./FinishModal"
import { useSwipeable } from "react-swipeable"
import type { Clicked, Practice, Quiz, QuizLink, QuestionRef } from "./types"
import useQuizPersistence from "./useQuizPersistence"
import useBookmarks from "./useBookmarks"
import { isSaved, questionKey } from "./bookmarks"
import { isQuizKeyBlocked, missedIndices, nextMissed, prevMissed, questionStatuses } from "./quizLogic"


function Format({ data, next, back, practice }: { data: Quiz, next?: QuizLink, back?: QuizLink, practice?: Practice }) {
  const pathname = usePathname()
  const [index, setIndex] = useState<number>(0)
  const [clickedOption, setClickedOption] = useState<Clicked>([])
  const [mapOpen, setMapOpen] = useState<boolean>(false)
  // Missed question indices while reviewing after Finish; null otherwise
  const [review, setReview] = useState<number[] | null>(null)
  const resumeIndex = useRef<number>(0)
  const [resumeModal, setResumeModal] = useState<boolean>(false)
  const [finishModal, setFinishModal] = useState<boolean>(false)
  const score = useRef<number>(0)
  const lock = useRef<boolean>(false)
  const recorded = useRef<boolean>(false)
  const totalQuestions = data.length
  const questionOrigin = data[index].info.replace(/-/g, ' ')
  const statuses = useMemo(() => questionStatuses(data, clickedOption), [data, clickedOption])
  const missed = useMemo(() => missedIndices(statuses), [statuses])
  const { bookmarks, toggle, remove } = useBookmarks()
  const keys = useMemo(() => data.map(questionKey), [data])
  const refAt = (i: number): QuestionRef => practice ? practice.refs[i] : { path: pathname, key: keys[i], index: i }
  const saved = isSaved(bookmarks, refAt(index))
  const savedFlags = useMemo(
    () => data.map((_, i) => isSaved(bookmarks, refAt(i))),
    [data, keys, bookmarks, pathname, practice]
  )
  // Saved quiz: questions answered right first time that are still bookmarked
  const removableRefs = practice ? practice.refs.filter((r, i) => statuses[i] === "right" && isSaved(bookmarks, r)) : []
  const toggleSave = () => toggle(refAt(index), data[index])
  // Relative to the current index, so jumping via the map mid-review still works
  const prevStop = review ? prevMissed(review, index) : undefined
  const nextStop = review ? nextMissed(review, index) : undefined
  const counterLabel = !review
    ? `${index + 1} / ${totalQuestions}`
    : review.includes(index)
      ? `Reviewing ${review.indexOf(index) + 1} / ${review.length}`
      : `Reviewing ${review.length} missed`

  useQuizPersistence({
    enabled: !practice,
    pathname,
    keys,
    totalQuestions,
    clickedOption,
    score,
    resumeIndex,
    recorded,
    finishModal,
    setClickedOption,
    setResumeModal,
    setIndex,
  })

  // Back, Next, Finish functions
  // Navigation only clears the per-render click latch. Whether a question can
  // still be scored is decided in Options from the recorded answers, so a
  // skipped question stays answerable and an answered one stays locked.
  const Back = () => {
    if (review) {
      if (prevStop !== undefined) {
        setIndex(prevStop)
        lock.current = false
      }
      return
    }
    if (index > 0) {
      setIndex(prev => prev - 1)
      lock.current = false
    }
  }

  const Next = () => {
    if (review) {
      if (nextStop !== undefined) {
        setIndex(nextStop)
        lock.current = false
      }
      return
    }
    if (index + 1 < totalQuestions) {
      setIndex(prev => prev + 1)
      lock.current = false
    }
  }

  const jump = (i: number) => {
    setIndex(i)
    lock.current = false
    setMapOpen(false)
  }

  const Finish = () => {
    setFinishModal(true)
  }

  const startReview = () => {
    if (missed.length === 0) return
    setReview(missed)
    setIndex(missed[0])
    lock.current = false
    setFinishModal(false)
  }

  const Retake = () => {
    setReview(null)
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
      if (isQuizKeyBlocked(e)) return
      if (e.key === 'ArrowRight') Next()
      else if (e.key === 'ArrowLeft') Back()
      else if (e.key === 's' || e.key === 'S') toggleSave()
    }
    document.addEventListener('keydown', navigate)
    return () => document.removeEventListener('keydown', navigate)
  }, [index, totalQuestions, pathname, review, bookmarks])


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

        <Header questionOrigin={questionOrigin} counterLabel={counterLabel} onOpenMap={() => setMapOpen(true)} saved={saved} onToggleSave={toggleSave} />

        <ProgressMap statuses={statuses} saved={savedFlags} index={index} open={mapOpen} onOpenChange={setMapOpen} onJump={jump} />

        <Question question={data[index].question} />

        {
          data[index].hint && data[index].difficulty &&
          <HintDifficulty hint={data[index].hint} difficulty={data[index].difficulty} />
        }

        <Options options={data[index].answers} clickedOption={clickedOption} setClickedOption={setClickedOption} questionIndex={index} score={score} lock={lock} finished={recorded} reveal={review !== null} onFinishedClick={review ? undefined : Finish} />

        <Footer
          canBack={review ? prevStop !== undefined : index > 0}
          isLast={review ? nextStop === undefined : index + 1 >= totalQuestions}
          finishLabel={review ? "Finish review" : "Finish"}
          Back={Back} Next={Next} Finish={Finish}
        />

      </div>

      <ResumeModal pathname={pathname} answered={clickedOption.length} resumeModal={resumeModal} setResumeModal={setResumeModal} resumeIndex={resumeIndex} score={score} setClickedOption={setClickedOption} setIndex={setIndex} />

      <FinishModal
        finishModal={finishModal} setFinishModal={setFinishModal} score={score} totalQuestions={totalQuestions} Retake={Retake}
        next={next} back={back} missedCount={missed.length} onReview={startReview}
        practice={practice && {
          removable: removableRefs.length,
          onRemoveRight: () => remove(removableRefs),
          onAgain: practice.onAgain,
          onExit: practice.onExit,
        }}
      />
    </div>
  )
}

export default Format