import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserIdFromRequest } from '@/lib/auth';

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
        name: body.name || template.name,
        description: body.description ?? template.description,
        tiers: body.tiers ? JSON.stringify(body.tiers) : template.tiers,
      },
    });

    return NextResponse.json({
      ...updated,
      tiers: JSON.parse(updated.tiers),
    });
  } catch (error) {
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
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
