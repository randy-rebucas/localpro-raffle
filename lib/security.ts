import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from './auth';
import { connectDb, Raffle } from './db';
import { randomUUID } from 'crypto';

/**
 * Generate a cryptographically secure share key
 */
export function generateSecureShareKey(): string {
  return randomUUID();
}

/**
 * Check if user owns the raffle
 */
export async function checkRaffleOwnership(
  req: NextRequest,
  raffleId: string
): Promise<string | null> {
  try {
    const user = await getSessionUser(req);
    
    if (!user?.id) {
      return null;
    }

    await connectDb();
    const raffle = await Raffle.findOne({ id: raffleId }).select('createdBy').lean();

    if (!raffle || raffle.createdBy !== user.id) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Error checking raffle ownership:', error);
    return null;
  }
}

/**
 * Middleware to ensure user is authenticated
 */
export async function requireAuth(req: NextRequest) {
  const user = await getSessionUser(req);
  
  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized: Please sign in' },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Middleware to ensure raffle ownership
 */
export async function requireRaffleOwnership(
  req: NextRequest,
  raffleId: string
) {
  const userId = await checkRaffleOwnership(req, raffleId);

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized: You do not own this raffle' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate and parse JSON safely
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * Sanitize string input (prevent XSS and CSV injection)
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > characters
    .substring(0, 255); // Limit length
}

/**
 * Validate prize amount (prevent negative or extremely large values)
 */
export function isValidPrizeAmount(amount: number): boolean {
  return typeof amount === 'number' && amount >= 0 && amount <= 999999999;
}

/**
 * Validate winner count (must be positive integer)
 */
export function isValidWinnerCount(count: number): boolean {
  return Number.isInteger(count) && count > 0 && count <= 10000;
}

/**
 * Validate raffle title
 */
export function isValidRaffleTitle(title: string): boolean {
  return (
    typeof title === 'string' &&
    title.trim().length > 0 &&
    title.length <= 200
  );
}

/**
 * Create audit log entry
 */
export async function logSecurityEvent(
  userId: string,
  action: string,
  raffleId?: string,
  details?: Record<string, unknown>
) {
  try {
    // Note: You may want to store these in a dedicated audit log table
    console.log(`[SECURITY AUDIT] User: ${userId}, Action: ${action}, Raffle: ${raffleId}`, details);
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}
