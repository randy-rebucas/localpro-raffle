import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { connectDb, RaffleShare } from '@/lib/db';
import { isDuplicateKeyError } from '@/lib/mongo-errors';
import { requireRaffleOwnership, generateSecureShareKey, logSecurityEvent } from '@/lib/security';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    await connectDb();

    const existingShare = await RaffleShare.findOne({ raffleId: id }).lean();
    let shareKey =
      existingShare && typeof existingShare.shareKey === 'string' ? existingShare.shareKey : undefined;

    if (!shareKey) {
      const now = new Date();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const nextShareKey = generateSecureShareKey();
        const shareId = randomUUID();

        try {
          await RaffleShare.create({
            id: shareId,
            raffleId: id,
            shareKey: nextShareKey,
            createdAt: now,
          });
          shareKey = nextShareKey;
          logSecurityEvent(user.id, 'SHARE_LINK_CREATED', id);
          break;
        } catch (error) {
          if (isDuplicateKeyError(error)) {
            continue;
          }
          throw error;
        }
      }

      if (!shareKey) {
        return NextResponse.json(
          { error: 'Failed to create share link' },
          { status: 500 }
        );
      }
    }

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareKey}`;

    return NextResponse.json({
      shareKey,
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
