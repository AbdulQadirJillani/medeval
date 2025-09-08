const Question = ({ question }: { question: string }) => {
  return (
    <p className="text-lg sm:text-xl leading-relaxed my-6 text-pretty">
      {question}
    </p>
  )
}

export default Question