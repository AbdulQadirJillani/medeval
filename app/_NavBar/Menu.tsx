"use client"

import Link from "next/link"
import { Dispatch, SetStateAction } from "react"

import { LucideDiamond } from "lucide-react"
import useBookmarks from "@/app/_QAFormat/useBookmarks"
import { YEARS } from "@/app/(PastPapers)/modules"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"

type Props = {
  className: string,
  setOpen: Dispatch<SetStateAction<boolean>>
}

const Menu = ({ className, setOpen }: Props) => {
  const { bookmarks } = useBookmarks()
  const close = () => {
    setOpen(false)
  }

  return (
    <div className={className}>

      <Link className="px-4 py-1 text-lg rounded-md hover:bg-input lg:focus:bg-input lg:focus:outline-none" href="/BookBank" onClick={close}>
        Book Bank
      </Link>

      <Link className="px-4 py-1 text-lg rounded-md hover:bg-input lg:focus:bg-input lg:focus:outline-none" href="/Maps" onClick={close}>
        Maps
      </Link>

      {/* <Link className="px-4 py-1 text-lg rounded-md hover:bg-input lg:focus:bg-input lg:focus:outline-none" href="/SystemReview" onClick={close}>
        System Review
      </Link> */}

      <Link className="px-4 py-1 text-lg rounded-md hover:bg-input lg:focus:bg-input lg:focus:outline-none" href="/Performance" onClick={close}>
        Performance
      </Link>

      <Link className="px-4 py-1 text-lg rounded-md hover:bg-input lg:focus:bg-input lg:focus:outline-none" href="/Saved" onClick={close}>
        Saved
        {
          bookmarks.length > 0 &&
          <span className="ml-1.5 rounded-full bg-brand px-1.5 text-xs text-white tabular-nums align-middle">
            {bookmarks.length}
            <span className="sr-only"> saved</span>
          </span>
        }
      </Link>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-lg font-normal cursor-pointer">
              Past Papers
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-[143px] p-4 space-y-3">
                {
                  YEARS.map((y) => (
                    <li key={y}>
                      <Link className="flex gap-1 items-center px-2 py-1 rounded-md hover:bg-input lg:focus:bg-input lg:focus:outline-none" href={`/PastPapers/${y}`} onClick={close}>
                        <LucideDiamond size={10} />
                        {y.split('-').join(' ')}
                      </Link>
                    </li>
                  ))
                }
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

export default Menu