"use client"

import Image from "next/image";
import logo from "../_assets/logo.png"
import { useRouter } from "next/navigation";

function Logo() {
  const router = useRouter()
  return (
    <div className="flex items-center gap-1 cursor-pointer" onClick={() => router.push("/")}>
        <Image className="w-[42px] h-[35px]" src={logo} alt="logo"/>
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#1fadffcc] via-[#9838ffcc] to-[#ff0048cc]">MedEval</h1>
    </div>
  )
}

export default Logo