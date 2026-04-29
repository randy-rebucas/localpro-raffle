import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { connectDb, User } from '@/lib/db';
import { isDuplicateKeyError } from '@/lib/mongo-errors';
import { isValidEmail, sanitizeInput } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = rateLimit(req, 'signup', 5, 15 * 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const { email, password, name } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof name === 'string' ? sanitizeInput(name) : '';

    // Validate input
    if (!normalizedEmail || !password || !normalizedName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Enter a valid email address' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await connectDb();

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Unable to create an account with this email' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const now = new Date();

    try {
      await User.create({
        id: userId,
        email: normalizedEmail,
        password: hashedPassword,
        name: normalizedName,
        createdAt: now,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return NextResponse.json(
          { error: 'Unable to create an account with this email' },
          { status: 409 }
        );
      }
      throw error;
    }

    const user = { id: userId, email: normalizedEmail, name: normalizedName };

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
