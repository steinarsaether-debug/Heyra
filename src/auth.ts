import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const authSecret = process.env.AUTH_SECRET;

if (process.env.NODE_ENV === "production" && !authSecret) {
  console.warn("AUTH_SECRET is not configured. Falling back to the local development secret.");
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: email.toLowerCase(),
          },
          include: {
            pii: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DEACTIVATED) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          fullName: user.pii?.fullName ?? user.email,
          name: user.pii?.fullName ?? user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? UserRole.HUNTER;
        token.status = user.status ?? UserStatus.ACTIVE;
        token.fullName = user.fullName ?? user.name ?? user.email ?? "Heyra user";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.fullName = token.fullName;
        session.user.name = token.fullName;
      }

      return session;
    },
  },
  secret: authSecret ?? "heyra-local-auth-secret-change-me",
};

export function auth() {
  return getServerSession(authOptions);
}
