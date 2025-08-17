import { auth } from '@clerk/nextjs/server'

export default async function Home() {
  const { userId } = await auth()
  return (
    <div className="min-h-[calc(100svh-68px)] w-[90%] mx-auto grid md:grid-cols-2 items-center">
      <p className="max-w-prose text-lg font-medium">
        From Chaos to Clarity
      </p>
      <p>{userId}</p>
    </div>
  );
}