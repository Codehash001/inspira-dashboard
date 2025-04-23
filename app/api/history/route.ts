import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const walletId = searchParams.get('walletId')
  const type = searchParams.get('type')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  if (!walletId) {
    return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 })
  }

  try {
    let history: any[] = []
    let totalCount = 0

    // Get chat history
    if (!type || type === 'chat') {
      const chats = await prisma.chatHistory.findMany({
        where: {
          walletId,
          ...(search ? {
            OR: [
              { sessionName: { contains: search, mode: 'insensitive' } },
              { userMessage: { contains: search, mode: 'insensitive' } },
              { botMessage: { contains: search, mode: 'insensitive' } },
            ]
          } : {})
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
      history = [...history, ...chats.map((chat: any) => ({ ...chat, type: 'chat' }))]
    }

    // Get image generation history
    if (!type || type === 'image') {
      const images = await prisma.imageGenerationHistory.findMany({
        where: {
          walletId,
          ...(search ? {
            imageId: { contains: search, mode: 'insensitive' }
          } : {})
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
      history = [...history, ...images.map((img: any) => ({ ...img, type: 'image' }))]
    }

    // Get video generation history
    if (!type || type === 'video') {
      const videos = await prisma.videoGenerationHistory.findMany({
        where: {
          walletId,
          ...(search ? {
            videoId: { contains: search, mode: 'insensitive' }
          } : {})
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
      history = [...history, ...videos.map((video: any) => ({ ...video, type: 'video' }))]
    }

    // Get book grading history
    if (!type || type === 'book') {
      const books = await prisma.bookGradingHistory.findMany({
        where: {
          walletId,
          ...(search ? {
            bookId: { contains: search, mode: 'insensitive' }
          } : {})
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
      history = [...history, ...books.map((book: any) => ({ ...book, type: 'book' }))]
    }

    // Get smart contract audit history
    if (!type || type === 'audit') {
      const audits = await prisma.smartContractAudit.findMany({
        where: {
          walletId,
          ...(search ? {
            OR: [
              { contractName: { contains: search, mode: 'insensitive' } },
              { contractId: { contains: search, mode: 'insensitive' } },
              { severity: { contains: search, mode: 'insensitive' } }
            ]
          } : {})
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
      history = [...history, ...audits.map((audit: any) => ({ ...audit, type: 'audit' }))]
    }

    // Sort all results by createdAt
    history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Get total count for pagination
    totalCount = await prisma.$transaction([
      prisma.chatHistory.count({ where: { walletId } }),
      prisma.imageGenerationHistory.count({ where: { walletId } }),
      prisma.videoGenerationHistory.count({ where: { walletId } }),
      prisma.bookGradingHistory.count({ where: { walletId } }),
      prisma.smartContractAudit.count({ where: { walletId } })
    ]).then((counts: any[]) => counts.reduce((a: any, b: any) => a + b, 0))

    // If type is specified, apply pagination
    // Removed this condition as pagination is now applied for all cases

    return NextResponse.json({
      data: history,
      totalCount,
      page,
      limit
    })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
