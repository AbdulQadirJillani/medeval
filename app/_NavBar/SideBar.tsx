"use client"

import { Dispatch, SetStateAction } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import Toggle from "./Toggle"
import { LucideMenu } from "lucide-react"
import Logo from "./Logo"
import Menu from "./Menu"

type Props = {
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  toggle: boolean,
  setToggle: Dispatch<SetStateAction<boolean>>
}

function SideBar({ open, setOpen, toggle, setToggle }: Props) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden flex items-center">
        <LucideMenu size={25} />
      </SheetTrigger>
      <SheetContent side={"left"} className="px-10">
        <SheetHeader className="pb-6">
          <SheetTitle>
            <Logo sidebarState={setOpen} />
          </SheetTitle>
        </SheetHeader>
        <Menu className="flex flex-col gap-5 w-fit" setOpen={setOpen} />
        <div className="md:hidden px-4">
          <Toggle toggle={toggle} setToggle={setToggle} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default SideBar
