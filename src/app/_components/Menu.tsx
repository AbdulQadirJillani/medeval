"use client"

import Link from "next/link"
import { Dispatch, SetStateAction } from "react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu"
import { LucideDiamond } from "lucide-react"
import Toggle from "./Toggle"

type Props = {
  className: string,
  setOpen: Dispatch<SetStateAction<boolean>>
}
  
const Menu = ({ className, setOpen }: Props) => {
  const years = ['1st-year', '2nd-year', '3rd-year', '4th-year']
  const close = () => {
    setOpen(false)
  }

  return (
    <div className={className}>

      <Link className="px-4 py-1 text-lg rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none" href="https://drive.google.com/drive/folders/1jmdTFwBD56cLCH1zYj5HLcUfrBK0HoWq?usp=drive_link" target="_blank">
        Resources
      </Link>

      {/* <Link className="px-4 py-1 text-lg rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none" href="/SystemReview" onClick={close}>
        System Review
      </Link> */}

      <Link className="px-4 py-1 text-lg rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none" href="/Performance" onClick={close}>
        Performance
      </Link>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-lg font-normal">
              Past Papers
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-[143px] p-4 space-y-3">
                {
                  years.map((y) => (
                    <li key={y}>
                      <Link className="flex gap-1 items-center px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none" href={`/PastPapers/${y}`} onClick={close}>
                        <LucideDiamond size={10}/>
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
      <Toggle/>
    </div>
  )
}

export default Menu