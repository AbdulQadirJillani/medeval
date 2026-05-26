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
