"use client"

import Image from "next/image";
import logo from "../_assets/logo.png"
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

type prop = {
  sidebarState?: Dispatch<SetStateAction<boolean>>
}

function Logo({ sidebarState }: prop) {
  const router = useRouter()
  return (
    <div className="flex items-center gap-1 cursor-pointer"
      onClick={() => {
        router.push("/")
        sidebarState && sidebarState(false)
      }}>
      <Image className="w-[42px] h-[35px]" src={logo} alt="logo" />
      <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">MedEval</h1>
    </div >
  )
}

export default Logo