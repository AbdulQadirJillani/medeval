// "use server"

// import prisma from '@/lib/prisma'
// import { auth } from '@clerk/nextjs/server'

// // Cache user IDs to reduce lookups (in-memory cache)
// const userCache = new Map<string, { id: string; timestamp: number }>()
// const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// async function getCachedUserId(clerkId: string): Promise<string | null> {
//   const cached = userCache.get(clerkId)
//   if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
//     return cached.id
//   }
//   // @ts-expect-error: desc to avoid deploy fails
//   const user = await prisma.user.findUnique({
//     where: { clerkId },
//     select: { id: true }
//   })

//   if (user) {
//     userCache.set(clerkId, { id: user.id, timestamp: Date.now() })
//     return user.id
//   }

//   return null
// }



// type data = {
//   clerkId: string,
//   pathname: string,
//   score: number,
//   totalQuestions: number,
//   finishDateTime: Date
// }

// export async function createPerformance(data: data) {
//   const { clerkId, pathname, score, totalQuestions, finishDateTime } = data

//   const { userId } = await auth()
//   if (!userId) throw new Error('Not authenticated')

//   if (clerkId !== userId) {
//     throw new Error('Clerk Id mismatch')
//   }

//   // Use cached user ID or get from DB
//   const userDbId = await getCachedUserId(userId)
//   if (!userDbId) throw new Error('User not found')

//   await prisma.performance.create(
//     {
//       data: {
//         userId: userDbId,
//         pathname: pathname,
//         score: score,
//         totalQuestions: totalQuestions,
//         finishDateTime: new Date(finishDateTime)
//       }
//     }
//   )
//   return { success: true }
// }



// export async function deleteModule(pathname: string) {
//   const { userId } = await auth()
//   if (!userId) throw new Error('Not athenticated')

//   // Use cached user ID or get from DB
//   const userDbId = await getCachedUserId(userId)
//   if (!userDbId) throw new Error('User not found')

//   await prisma.module.delete({
//     where: {
//       userId_pathname: {
//         userId: userDbId,
//         pathname: pathname
//       }
//     }
//   })
// }



// export async function findModule_ClickedOptions(pathname: string) {
//   const { userId } = await auth()
//   if (!userId) throw new Error('Not athenticated')

//   // Use cached user ID or get from DB
//   const userDbId = await getCachedUserId(userId)
//   if (!userDbId) throw new Error('User not found')

//   // @ts-expect-error: desc to avoid deploy fails
//   const mod = await prisma.module.findUnique({
//     where: {
//       userId_pathname: {
//         userId: userDbId,
//         pathname: pathname
//       }
//     }
//   })

//   if (!mod) return

//   // @ts-expect-error: desc to avoid deploy fails
//   const clickedOptions = await prisma.answers.findMany({
//     where: { attemptId: mod.id }
//   })

//   if (mod?.resumeIndex == 0) return

//   return { mod, clickedOptions }
// }



// export async function findPerformance() {
//   const { userId } = await auth()
//   if (!userId) throw new Error('Not athenticated')

//   const userDbId = await getCachedUserId(userId)
//   if (!userDbId) throw new Error('User not found')

//   // @ts-expect-error: desc to avoid deploy fails
//   const perf = await prisma.performance.findMany({
//     where: {
//       userId: userDbId
//     }
//   })

//   return perf
// }
