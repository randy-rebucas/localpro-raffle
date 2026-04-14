import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserIdFromRequest } from '@/lib/auth';

interface TemplateData {
  name: string;
  description?: string;
  tiers: Array<{
    prizeName: string;
    prizeAmount: number;
    winnerCount: number;
  }>;
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

    const { name, description, tiers } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return NextResponse.json(
        { error: 'At least one tier is required' },
        { status: 400 }
      );
    }

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
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
