"use server"

import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function deleteModule(pathname: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not athenticated')

  // @ts-expect-error: desc to avoid deploy fails
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw new Error('User not found')

  await prisma.module.delete({
    where: {
      userId_pathname: {
        userId: user.id,
        pathname: pathname
      }
    }
  })
}