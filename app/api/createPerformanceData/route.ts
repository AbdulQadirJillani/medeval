import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { clerkId, pathname, score, totalQuestions, finishDateTime } = data

    const { userId } = await auth()
    if (!userId) throw new Error('Not authenticated')

    if (clerkId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
    return NextResponse.json({ success: true })
  }
  catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save performance' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'working!' });
}