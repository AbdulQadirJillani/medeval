"use client"

import { Switch } from "@/components/ui/switch"
import { Dispatch, SetStateAction, useEffect, useRef } from "react"

type props = {
  toggle: boolean
  setToggle: Dispatch<SetStateAction<boolean>>
}

function Toggle({ toggle, setToggle }: props) {
  const hydrated = useRef(false)

  useEffect(() => {
    setToggle(localStorage.getItem('theme') === 'true')
    hydrated.current = true
  }, [setToggle])

  useEffect(() => {
    if (!hydrated.current) return
    localStorage.setItem('theme', String(toggle))
    document.documentElement.classList.toggle('dark', toggle)
  }, [toggle])

  return <Switch checked={toggle} onCheckedChange={setToggle} />
}

export default Toggle