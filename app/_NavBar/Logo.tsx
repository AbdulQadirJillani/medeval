import Image from "next/image";
import Link from "next/link";
import logo from "../_assets/logo.png"
import { Dispatch, SetStateAction } from "react";

type prop = {
  sidebarState?: Dispatch<SetStateAction<boolean>>
}

function Logo({ sidebarState }: prop) {
  return (
    <Link
      href="/"
      className="flex items-center gap-1"
      onClick={() => sidebarState?.(false)}>
      <Image className="w-[42px] h-[35px]" src={logo} alt="logo" />
      <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">MedEval</h1>
    </Link>
  )
}

export default Logo