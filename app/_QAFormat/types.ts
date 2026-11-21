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

// Where a question lives: its quiz pathname, its id in that file, and its
// 0-based position in the paper (for "Q12" and #q=N links)
export type QuestionRef = { path: string, id: number, index: number }
