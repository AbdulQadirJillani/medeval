"use client"

import Logo from "./Logo"
import SideBar from "./SideBar"
import Menu from "./Menu"
import { useState } from "react"
import Toggle from "./Toggle"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

const NavBar = () => {
  const [toggle, setToggle] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  return (
    <nav className="relative py-3 px-3 shadow-lg shadow-accent z-50">
      <div className="w-[90%] mx-auto flex justify-between items-center">
        <div className="flex gap-3">
          <SideBar open={open} setOpen={setOpen} toggle={toggle} setToggle={setToggle} />
          <Logo />
        </div>
        <Menu className="hidden lg:flex md:gap-5 md:items-center" setOpen={setOpen} />
        <div className="hidden md:flex gap-3 text-lg items-center">
          <Toggle toggle={toggle} setToggle={setToggle} />
          <SignedOut>
            <SignInButton>
              <Button variant='outline' className="cursor-pointer">
                Login
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="bg-[#2ADBA4] hover:bg-[#1dc791] focus-visible:bg-[#1dc791] cursor-pointer">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton showName={true} />
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}

export default NavBar