"use client"

import { Button } from "@/components/ui/button"
import { LucideDownload, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

type subject = {
  title: string,
  authors: string,
  edition: string,
  tag: string,
  fileID: string,
  cover: string
}

function BookCard({ subject }: { subject: subject }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = (fileID: string) => {
    setLoading(true)
    // start file download
    window.location.href = `https://drive.google.com/uc?export=download&id=${fileID}`
    // re-enable button after 6s
    setTimeout(() => setLoading(false), 6000)
  }

  return (
    <div className="flex gap-5 items-center ring ring-accent rounded-md px-6 md:px-8 py-4">
      <div className="relative w-[100px] h-[140px] sm:w-[110px] sm:h-[155px] md:w-[120px] md:h-[170px] lg:w-[140px] lg:h-[200px] flex-shrink-0">
        <Image
          src={subject.cover}
          alt="cover image"
          fill
          className="object-cover rounded-lg shadow-md"
        />
      </div>
      <div className="flex-1">
        <div className="flex flex-col gap-y-1">
          <p className="font-semibold capitalize text-[1rem] sm:text-lg lg:text-xl bg-clip-text text-transparent bg-gradient-to-r from-[hsl(202,_100%,_56%,_0.8)] via-[hsl(269,_100%,_61%,_0.8)]  to-[hsl(343,_100%,_50%,_0.8)] line-clamp-3">
            {subject.title}
          </p>
          <p className="text-[0.84rem] sm:text-base text-muted-foreground line-clamp-2">
            {subject.authors}
          </p>
          <p className="text-xs sm:text-sm text-[#00ACE6] italic bg-input px-2 py-0.5 rounded-md w-fit mt-1 mb-3">
            {subject.edition}
          </p>
          <Button
            onClick={() => handleDownload(subject.fileID)}
            disabled={loading}
            className="bg-[#00ACE6] hover:bg-[#008fbf] text-sm sm:text-base w-full sm:w-fit flex gap-2 items-center">
            {
              loading ?
                (<>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>)
                :
                (<>
                  <LucideDownload className="w-4 h-4" />
                  Download
                </>)
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BookCard
