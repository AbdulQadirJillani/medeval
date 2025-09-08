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
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
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
        <div className="md:hidden flex px-4 gap-3 text-lg items-center pb-6">
          <SignedOut>
            <SignInButton>
              <Button variant='outline' className="cursor-pointer" onClick={() => setOpen(false)}>
                Login
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="bg-[#2ADBA4] hover:bg-[#1dc791] focus-visible:bg-[#1dc791] cursor-pointer" onClick={() => setOpen(false)}>
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton showName={true} />
          </SignedIn>
        </div>
        <Menu className="flex flex-col gap-5 w-fit" setOpen={setOpen} />
        <div className="md:hidden px-4">
          <Toggle toggle={toggle} setToggle={setToggle} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default SideBar
