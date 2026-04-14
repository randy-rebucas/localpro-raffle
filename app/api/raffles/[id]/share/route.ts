import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRaffleOwnership, generateSecureShareKey, logSecurityEvent } from '@/lib/security';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(req, id);
    if (authError) {
      const user = await getSessionUser(req);
      logSecurityEvent(user?.id || 'unknown', 'SHARE_CREATION_UNAUTHORIZED', id);
      return authError;
    }

    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find or create a share link
    let share = await prisma.raffleShare.findFirst({
      where: { raffleId: id },
    });

    if (!share) {
      // SECURITY: Use cryptographically secure key generation
      share = await prisma.raffleShare.create({
        data: {
          raffleId: id,
          shareKey: generateSecureShareKey(),
        },
      });

      logSecurityEvent(user.id, 'SHARE_LINK_CREATED', id);
    }

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${share.shareKey}`;

    return NextResponse.json({
      shareKey: share.shareKey,
      shareUrl,
    });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
