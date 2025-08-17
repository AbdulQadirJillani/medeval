'use client'

export default function Error({ error, reset }: { error: Error, reset: () => void }) {
  return (
    <div className="p-4 text-red-600">
      <p>Error: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
