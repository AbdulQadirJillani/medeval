export type Answer = {
  option: string
  explanation?: string
  bool: boolean
}

export type Question = {
  id: number
  info: string
  question: string
  difficulty?: number
  hint?: string
  answers: Answer[]
}

export type Quiz = Question[]

export type Clicked = { questionIndex: number, optionIndex: number[] }[]

export type QuizLink = { href: string, label: string }

// Where a question lives: its quiz pathname, its content key (questionKey),
// and its 0-based position in the paper when it was saved (display only)
export type QuestionRef = { path: string, key: string, index: number }

// Saved quiz: per-question sources, plus the finish-screen actions that
// replace Retake / Next paper / Back. Persistence is off while practising.
export type Practice = { refs: QuestionRef[], onAgain: () => void, onExit: () => void }
