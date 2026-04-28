import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const template = await prisma.template.findUnique({
      where: { id },
    });

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
      tiers: JSON.parse(template.tiers),
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

    const template = await prisma.template.findUnique({
      where: { id },
    });

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

    const updated = await prisma.template.update({
      where: { id },
      data: {
        name: validation.value.name ?? template.name,
        description: validation.value.description ?? template.description,
        tiers: validation.value.tiers ? JSON.stringify(validation.value.tiers) : template.tiers,
      },
    });

    return NextResponse.json({
      ...updated,
      tiers: JSON.parse(updated.tiers),
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

    const template = await prisma.template.findUnique({
      where: { id },
    });

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

    await prisma.template.delete({
      where: { id },
    });

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
