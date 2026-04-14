import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserIdFromRequest } from '@/lib/auth';

// GET /api/raffles - List all raffles (or user's raffles if authenticated)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Try to get current user, but don't require it for backward compatibility
    let userId: string | undefined;
    try {
      userId = await getCurrentUserIdFromRequest(request);
    } catch {
      // If not authenticated, show all raffles (or could require auth)
    }

    const [raffles, total] = await Promise.all([
      prisma.raffle.findMany({
        skip,
        take: limit,
        where: userId ? { createdBy: userId } : undefined,
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
      prisma.raffle.count(userId ? { where: { createdBy: userId } } : undefined),
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
