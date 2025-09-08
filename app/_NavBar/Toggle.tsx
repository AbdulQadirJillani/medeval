"use client"

import { Switch } from "@/components/ui/switch"
import { Dispatch, SetStateAction, useEffect, useRef } from "react"

type props = {
  toggle: boolean
  setToggle: Dispatch<SetStateAction<boolean>>
}

function Toggle({ toggle, setToggle }: props) {
  const def = useRef<boolean>(false)

  useEffect(() => {
    if (localStorage.getItem('theme') == 'true') setToggle(true)
    else setToggle(false)
  }, [])
  useEffect(() => {
    localStorage.setItem('theme', toggle.toString())
    const documentElemClass = document.querySelector('html')?.classList
    if (toggle) documentElemClass?.add('dark')
    else documentElemClass?.remove('dark')
  }, [toggle])
  function change() {
    setToggle((prev) => !prev)
  }
  return (
    <Switch defaultChecked={def.current} checked={toggle} onCheckedChange={change} />
  )
}

export default Toggle