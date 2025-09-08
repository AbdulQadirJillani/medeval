"use server"

import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function findModule_ClickedOptions(pathname: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not athenticated')

  // @ts-ignore
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw new Error('User not found')

  // @ts-ignore
  const mod = await prisma.module.findUnique({
    where: {
      userId_pathname: {
        userId: user.id,
        pathname: pathname
      }
    }
  })

  if (!mod) return

  // @ts-ignore
  const clickedOptions = await prisma.answers.findMany({
    where: { attemptId: mod.id }
  })

  if (mod?.resumeIndex == 0) return

  return { mod, clickedOptions }
}