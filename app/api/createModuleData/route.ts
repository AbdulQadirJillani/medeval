import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  console.log('createModuleData API called')
  try {
    const data = await req.json()
    const { clerkId, pathname, score, resumeIndex, totalQuestions, startDateTime, answers } = data

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (clerkId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // @ts-expect-error: desc to avoid deploy fails
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) throw new Error('User not found')

    // @ts-expect-error: desc to avoid deploy fails
    const existingMod = await prisma.module.findUnique({
      where: {
        userId_pathname: {
          userId: user.id,
          pathname: pathname
        }
      }
    })

    const boolResIn = !existingMod || (existingMod.resumeIndex < resumeIndex)

    // @ts-expect-error: desc to avoid deploy fails
    await prisma.$transaction(async (tx) => {
      const mod = await tx.module.upsert({
        where: {
          userId_pathname: {
            userId: user.id,
            pathname: pathname
          }
        },
        update: {
          score: score,
          resumeIndex: boolResIn ? resumeIndex : existingMod.resumeIndex,
          totalQuestions: totalQuestions
        },
        create: {
          userId: user.id,
          pathname: pathname,
          score: score,
          resumeIndex: resumeIndex,
          totalQuestions: totalQuestions,
          startDateTime: new Date(startDateTime)
        }
      })

      // Clear old answers
      await tx.answers.deleteMany({
        where: {
          attemptId: mod.id
        }
      })

      // Insert new answers
      if (answers.length > 0) {
        await tx.answers.createMany({
          data: answers.map((a: { questionIndex: number, optionIndex: string }) => ({
            attemptId: mod.id,
            questionIndex: a.questionIndex,
            optionIndex: a.optionIndex
          }))
        })
      }
    })
    return NextResponse.json({ success: true })
  }
  catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
export async function GET() {
  return NextResponse.json({ message: 'working!' });
}
