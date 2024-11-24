"use client"

import { Dispatch, SetStateAction } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { LucideMenu } from "lucide-react"
import Logo from "./Logo"
import Menu from "./Menu"

type Props = {
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>
}
  
function SideBar({ open, setOpen }: Props) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden flex items-center">
        <LucideMenu size={25}/>
      </SheetTrigger>
      <SheetContent side={"left"} className="px-10">
        <SheetHeader className="pb-12">
          <SheetTitle>
            <Logo/>
          </SheetTitle>
        </SheetHeader>
        <Menu className="flex flex-col gap-5 w-fit" setOpen={setOpen}/>
      </SheetContent>
    </Sheet>
  )
}

export default SideBar