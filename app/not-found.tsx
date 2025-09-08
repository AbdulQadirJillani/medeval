"use client"

import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100svh-60px)] bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white px-4 text-center">
      <h1 className="text-6xl sm:text-7xl md:text-9xl font-extrabold mt-5 mb-6 drop-shadow-lg">
        404
      </h1>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
        Oops! Page not found
      </h2>
      <p className="mb-8 max-w-md text-base sm:text-lg md:text-xl drop-shadow-sm">
        The page you are looking for does not exist or has been moved. Let&apos;s get you back home.
      </p>
      <Link
        href="/"
        className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-purple-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition transform hover:scale-105"
      >
        Go to Homepage
      </Link>
    </div>
  )
}
