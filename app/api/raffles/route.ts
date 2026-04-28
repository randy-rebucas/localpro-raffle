import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserIdFromRequest } from '@/lib/auth';

// GET /api/raffles - List current user's raffles
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const skip = (page - 1) * limit;
    const userId = await getCurrentUserIdFromRequest(request);

    const [raffles, total] = await Promise.all([
      prisma.raffle.findMany({
        skip,
        take: limit,
        where: { createdBy: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          tiers: {
            orderBy: { tierOrder: 'asc' },
          },
          _count: {
            select: { participants: true, winners: true },
          },
        },
      }),
      prisma.raffle.count({ where: { createdBy: userId } }),
    ]);

    return NextResponse.json(
      {
        data: raffles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Error fetching raffles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch raffles' },
      { status: 500 }
    );
  }
}

// POST /api/raffles - Create new raffle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get current user
    const userId = await getCurrentUserIdFromRequest(request);

    const raffle = await prisma.raffle.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        createdBy: userId,
      },
    });

    return NextResponse.json(raffle, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error creating raffle:', error);
    return NextResponse.json(
      { error: 'Failed to create raffle' },
      { status: 500 }
    );
  }
}
