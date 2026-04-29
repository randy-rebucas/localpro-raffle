import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { connectDb, User } from './db';

export async function getSessionFromRequest(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return null;

    await connectDb();
    const user = await User.findOne({ id: token.id as string })
      .select('id email name password')
      .lean();

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

    await connectDb();
    return await User.findOne({ id: token.id as string })
      .select('id email name password')
      .lean();
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}
