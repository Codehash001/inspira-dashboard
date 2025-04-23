import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const walletId = searchParams.get('walletId');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    console.log('Pagination params:', { page, limit, skip });

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    const where: Prisma.BookGradingHistoryWhereInput = {
      walletId,
      OR: search ? [
        { bookName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { authorName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { bookGrade: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
      ] : undefined
    };

    const [total, history] = await Promise.all([
      prisma.bookGradingHistory.count({ where }),
      prisma.bookGradingHistory.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      })
    ]);

    console.log('Query results:', { 
      totalItems: total, 
      itemsReturned: history.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

    return NextResponse.json({
      history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching book grading history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book grading history' },
      { status: 500 }
    );
  }
}
