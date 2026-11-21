"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import Header from "./Header"
import ProgressMap from "./ProgressMap"
import Question from "./Question"
import HintDifficulty from "./HintDifficulty"
import Options from "./Options"
import Footer from "./Footer"
import ResumeModal from "./ResumeModal"
import FinishModal from "./FinishModal"
import FinishConfirm from "./FinishConfirm"
import { useSwipeable } from "react-swipeable"
import type { Clicked, Practice, Quiz, QuizLink, QuestionRef } from "./types"
import useQuizPersistence from "./useQuizPersistence"
import useBookmarks from "./useBookmarks"
import { isSaved, occurrenceKeys, questionKey } from "./bookmarks"
import { isQuizKeyBlocked, missedIndices, nextMissed, prevMissed, questionPrompt, questionStatuses } from "./quizLogic"


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
  const [confirmFinish, setConfirmFinish] = useState<boolean>(false)
  // Frozen when the confirm opens, so its text can't change while it animates closed
  const [unansweredAt, setUnansweredAt] = useState({ count: 0, first: 0 })
  const score = useRef<number>(0)
  const lock = useRef<boolean>(false)
  const recorded = useRef<boolean>(false)
  const totalQuestions = data.length
  const questionOrigin = data[index].info.replace(/-/g, ' ')
  const statuses = useMemo(() => questionStatuses(data, clickedOption), [data, clickedOption])
  const missed = useMemo(() => missedIndices(statuses), [statuses])
  const { bookmarks, toggle, remove } = useBookmarks()
  // Content keys (questionKey) are hashed lazily and cached: hashing a
  // 1,200-question paper up front costs real time on phones
  const keyCache = useRef<Map<number, string>>(new Map())
  const keyAt = useCallback((i: number) => {
    let k = keyCache.current.get(i)
    if (k === undefined) {
      k = questionKey(data[i])
      keyCache.current.set(i, k)
    }
    return k
  }, [data])
  // Bookmark keys number identical twins ("a", "a-1"), which needs the whole
  // paper: computed once, on first need (a bookmark here, a toggle, a #k link)
  const bookmarkKeys = useRef<string[] | null>(null)
  const bookmarkKeyAt = useCallback((i: number) => {
    bookmarkKeys.current ??= occurrenceKeys(data.map((_, j) => keyAt(j)))
    return bookmarkKeys.current[i]
  }, [data, keyAt])
  const hasHere = !practice && bookmarks.some(b => b.path === pathname)
  const refAt = (i: number): QuestionRef => practice ? practice.refs[i] : { path: pathname, key: bookmarkKeyAt(i), index: i }
  const saved = (!!practice || hasHere) && isSaved(bookmarks, refAt(index))
  const savedFlags = useMemo(
    () => data.map((_, i) => (!!practice || hasHere) && isSaved(bookmarks, refAt(i))),
    [data, hasHere, bookmarks, pathname, practice, bookmarkKeyAt]
  )
  const indexOfKey = useCallback((k: string) => data.findIndex((_, i) => bookmarkKeyAt(i) === k), [data, bookmarkKeyAt])
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

  // Finishing records the attempt and locks the paper, so ask first if anything
  // is unanswered. Only before the first finish: Finish review and the
  // read-only tap afterwards go straight to the results.
  const requestFinish = () => {
    const first = statuses.indexOf("unanswered")
    if (recorded.current || first === -1) return Finish()
    setUnansweredAt({ count: statuses.filter(s => s === "unanswered").length, first })
    setConfirmFinish(true)
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
      // Ignore auto-repeat so holding S doesn't flicker the bookmark on and off
      else if ((e.key === 's' || e.key === 'S') && !e.repeat) toggleSave()
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

        <Header questionOrigin={questionOrigin} counterLabel={counterLabel} onOpenMap={() => setMapOpen(true)} saved={saved} onToggleSave={toggleSave} copyText={questionPrompt(data[index])} />

        <ProgressMap statuses={statuses} saved={savedFlags} index={index} open={mapOpen} onOpenChange={setMapOpen} onJump={jump} />

        <Question question={data[index].question} />

        {
          // Ternary, not &&: a difficulty of 0 would otherwise render a stray "0"
          data[index].hint && data[index].difficulty
            ? <HintDifficulty hint={data[index].hint} difficulty={data[index].difficulty} />
            : null
        }

        <Options options={data[index].answers} clickedOption={clickedOption} setClickedOption={setClickedOption} questionIndex={index} score={score} lock={lock} finished={recorded} reveal={review !== null} onFinishedClick={review ? undefined : Finish} />

        <Footer
          canBack={review ? prevStop !== undefined : index > 0}
          isLast={review ? nextStop === undefined : index + 1 >= totalQuestions}
          finishLabel={review ? "Finish review" : "Finish"}
          Back={Back} Next={Next} Finish={requestFinish}
        />

      </div>

      <FinishConfirm
        open={confirmFinish} onOpenChange={setConfirmFinish}
        unanswered={unansweredAt.count} firstUnanswered={unansweredAt.first}
        onGoTo={() => { setConfirmFinish(false); jump(unansweredAt.first) }}
        onFinish={() => { setConfirmFinish(false); Finish() }}
      />

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