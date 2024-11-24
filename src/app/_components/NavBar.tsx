"use client"

import Logo from "./Logo"
import SideBar from "./SideBar"
import Menu from "./Menu"
import { useState } from "react"

const NavBar = () => {
  const [open, setOpen] = useState<boolean>(false)
  return (
    <nav className="py-3 px-3 shadow-lg shadow-accent">
      <div className="w-[90%] mx-auto flex justify-between items-center">
        <SideBar open={open} setOpen={setOpen}/>
        <Logo/>
        <Menu className="hidden md:flex md:gap-5 md:items-center" setOpen={setOpen}/>
      </div>
    </nav>
  )
}

export default NavBar