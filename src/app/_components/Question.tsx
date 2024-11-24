const Question = ({ question }: { question: string }) => {
  return (
    <p className="text-xl my-6 leading-relaxed text-pretty">
      {question}
    </p>
  )
}

export default Question