import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

export async function getSessionFromRequest(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
    });
    return user ? { user } : null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getCurrentUserIdFromRequest(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

// For use in route handlers - pass the request
export async function getSessionUser(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return null;
    
    return await prisma.user.findUnique({
      where: { id: token.id as string },
    });
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}
