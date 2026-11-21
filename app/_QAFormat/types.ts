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
