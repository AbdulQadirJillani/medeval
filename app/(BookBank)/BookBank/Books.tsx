import BookCard from "./BookCard"

type subjects = {
  title: string,
  authors: string,
  edition: string,
  tag: string,
  fileID: string,
  cover: string
}[]

function Books({ subjects }: { subjects: subjects }) {
  return (
    <div className="my-11 max-w-[90%] mx-auto grid lg:grid-cols-2 gap-6">
      {
        subjects.map((subject, n) => (
          <BookCard key={n} subject={subject} />
        ))
      }
    </div>
  )
}

export default Books
