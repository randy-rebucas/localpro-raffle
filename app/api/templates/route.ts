import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserIdFromRequest } from '@/lib/auth';
import { isValidPrizeAmount, isValidWinnerCount, sanitizeInput } from '@/lib/security';

interface TemplateData {
  name: string;
  description?: string;
  tiers: Array<{
    prizeName: string;
    prizeAmount: number;
    winnerCount: number;
  }>;
}

function validateTemplateData(body: TemplateData) {
  const name = typeof body.name === 'string' ? sanitizeInput(body.name) : '';
  const description = typeof body.description === 'string' ? sanitizeInput(body.description) : undefined;
  const tiers = body.tiers;

  if (!name) {
    return { error: 'Template name is required' };
  }

  if (!Array.isArray(tiers) || tiers.length === 0 || tiers.length > 50) {
    return { error: 'Template must include 1 to 50 tiers' };
  }

  const normalizedTiers = tiers.map((tier) => ({
    prizeName: typeof tier.prizeName === 'string' ? sanitizeInput(tier.prizeName) : '',
    prizeAmount: Number(tier.prizeAmount),
    winnerCount: Number(tier.winnerCount),
  }));

  const hasInvalidTier = normalizedTiers.some((tier) => {
    return (
      !tier.prizeName ||
      !isValidPrizeAmount(tier.prizeAmount) ||
      !isValidWinnerCount(tier.winnerCount)
    );
  });

  if (hasInvalidTier) {
    return { error: 'Template tiers contain invalid prize or winner values' };
  }

  return { value: { name, description, tiers: normalizedTiers } };
}

// GET /api/templates - List all templates for current user
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserIdFromRequest(req);

    const templates = await prisma.template.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Parse tiers JSON for response
    const templatesWithParsedTiers = templates.map((template) => ({
      ...template,
      tiers: JSON.parse(template.tiers),
    }));

    return NextResponse.json(templatesWithParsedTiers);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create new template
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserIdFromRequest(req);
    const body: TemplateData = await req.json();
    const validation = validateTemplateData(body);

    if (validation.error || !validation.value) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { name, description, tiers } = validation.value;

    const template = await prisma.template.create({
      data: {
        userId,
        name,
        description,
        tiers: JSON.stringify(tiers),
      },
    });

    return NextResponse.json(
      {
        ...template,
        tiers: JSON.parse(template.tiers),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
