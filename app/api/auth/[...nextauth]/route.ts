import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDb, User } from "@/lib/db";

const invalidCredentialsMessage = "Invalid email or password";
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isLoginRateLimited(email: string) {
  const now = Date.now();
  const key = email || "unknown";
  const current = loginAttempts.get(key);

  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }

  current.count += 1;
  return current.count > 10;
}

function clearLoginAttempts(email: string) {
  loginAttempts.delete(email || "unknown");
}

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          throw new Error(invalidCredentialsMessage);
        }

        if (isLoginRateLimited(email)) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        await connectDb();
        const user = await User.findOne({ email }).lean();

        if (!user?.password) {
          throw new Error(invalidCredentialsMessage);
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error(invalidCredentialsMessage);
        }

        clearLoginAttempts(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
export const auth = handler;
