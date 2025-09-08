"use server"

import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

type data = {
  clerkId: string,
  pathname: string,
  score: number,
  totalQuestions: number,
  finishDateTime: Date
}

export async function createPerformance(data: data) {
  const { clerkId, pathname, score, totalQuestions, finishDateTime } = data

  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  if (clerkId !== userId) {
    throw new Error('Clerk Id mismatch')
  }

  // @ts-expect-error: desc to avoid deploy fails
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw new Error('User not found')

  await prisma.performance.create(
    {
      data: {
        userId: user.id,
        pathname: pathname,
        score: score,
        totalQuestions: totalQuestions,
        finishDateTime: new Date(finishDateTime)
      }
    }
  )
  return { success: true }
}
