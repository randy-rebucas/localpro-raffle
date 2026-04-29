import { NextRequest, NextResponse } from 'next/server';
import { connectDb, Template } from '@/lib/db';
import { getCurrentUserIdFromRequest } from '@/lib/auth';
import { isValidPrizeAmount, isValidWinnerCount, sanitizeInput } from '@/lib/security';

interface Params {
  params: Promise<{ id: string }>;
}

interface UpdateTemplateData {
  name?: string;
  description?: string;
  tiers?: Array<{
    prizeName: string;
    prizeAmount: number;
    winnerCount: number;
  }>;
}

function normalizeTemplateUpdate(body: UpdateTemplateData) {
  const update: {
    name?: string;
    description?: string;
    tiers?: Array<{ prizeName: string; prizeAmount: number; winnerCount: number }>;
  } = {};

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? sanitizeInput(body.name) : '';
    if (!name) return { error: 'Template name is required' };
    update.name = name;
  }

  if (body.description !== undefined) {
    update.description = typeof body.description === 'string' ? sanitizeInput(body.description) : '';
  }

  if (body.tiers !== undefined) {
    if (!Array.isArray(body.tiers) || body.tiers.length === 0 || body.tiers.length > 50) {
      return { error: 'Template must include 1 to 50 tiers' };
    }

    const tiers = body.tiers.map((tier) => ({
      prizeName: typeof tier.prizeName === 'string' ? sanitizeInput(tier.prizeName) : '',
      prizeAmount: Number(tier.prizeAmount),
      winnerCount: Number(tier.winnerCount),
    }));

    const hasInvalidTier = tiers.some((tier) => {
      return (
        !tier.prizeName ||
        !isValidPrizeAmount(tier.prizeAmount) ||
        !isValidWinnerCount(tier.winnerCount)
      );
    });

    if (hasInvalidTier) {
      return { error: 'Template tiers contain invalid prize or winner values' };
    }

    update.tiers = tiers;
  }

  return { value: update };
}

// GET /api/templates/[id] - Get single template
export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    const userId = await getCurrentUserIdFromRequest(req);
    const { id } = await params;

    await connectDb();
    const template = await Template.findOne({ id }).lean();

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...template,
      tiers: JSON.parse(String(template.tiers)),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Update template
export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  try {
    const userId = await getCurrentUserIdFromRequest(req);
    const { id } = await params;
    const body: UpdateTemplateData = await req.json();
    const validation = normalizeTemplateUpdate(body);

    if (validation.error || !validation.value) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    await connectDb();
    const template = await Template.findOne({ id }).lean();

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const now = new Date();
    const $set: Record<string, unknown> = { updatedAt: now };

    if (validation.value.name !== undefined) {
      $set.name = validation.value.name;
    }

    if (validation.value.description !== undefined) {
      $set.description = validation.value.description;
    }

    if (validation.value.tiers) {
      $set.tiers = JSON.stringify(validation.value.tiers);
    }

    const updated = await Template.findOneAndUpdate({ id }, { $set }, { new: true, lean: true });

    if (!updated) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...updated,
      tiers: JSON.parse(String(updated.tiers)),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    const userId = await getCurrentUserIdFromRequest(req);
    const { id } = await params;

    await connectDb();
    const template = await Template.findOne({ id }).lean();

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const deleteResult = await Template.deleteOne({ id });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
