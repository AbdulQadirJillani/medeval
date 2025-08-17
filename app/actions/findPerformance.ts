"use server"

import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function findPerformance() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not athenticated')
  
  const user = await prisma.user.findUnique({where: { clerkId: userId }})
  if (!user) throw new Error('User not found')
  
  const perf = await prisma.performance.findMany({
    where: {
      userId: user.id
    }
  })
  
  return perf
}