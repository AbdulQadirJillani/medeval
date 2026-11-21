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
  }, [setToggle])

  useEffect(() => {
    if (!hydrated.current) {
      // Until the read above lands, `toggle` is still the initial false; writing
      // it would clobber a stored "true" and strip .dark for a frame. Start
      // writing only once state matches storage (also safe under Strict Mode).
      if (toggle === (localStorage.getItem('theme') === 'true')) hydrated.current = true
      return
    }
    localStorage.setItem('theme', String(toggle))
    document.documentElement.classList.toggle('dark', toggle)
  }, [toggle])

  return <Switch checked={toggle} onCheckedChange={setToggle} />
}

export default Toggle