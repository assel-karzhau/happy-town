import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "./lib/db/prisma";
import type { UserRole } from "./generated/prisma/enums";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        const email = parsed.success ? parsed.data.email : "invalid-input";
        if (!parsed.success) {
          await recordLogin("LOGIN_FAILED", email, null, "INVALID_INPUT");
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, archivedAt: true, passwordHash: true },
        });
        if (!user?.passwordHash || user.status !== "ACTIVE" || user.archivedAt) {
          await recordLogin("LOGIN_FAILED", parsed.data.email, user?.id ?? null, "ACCOUNT_UNAVAILABLE");
          return null;
        }
        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          await recordLogin("LOGIN_FAILED", parsed.data.email, user.id, "INVALID_CREDENTIALS");
          return null;
        }
        await recordLogin("LOGIN", parsed.data.email, user.id, "SUCCESS");
        return { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.userId = user.id; token.role = user.role as UserRole; }
      return token;
    },
    session({ session, token }) {
      if (session.user) { session.user.id = String(token.userId ?? token.sub); session.user.role = token.role as UserRole; }
      return session;
    },
  },
});

async function recordLogin(action: "LOGIN" | "LOGIN_FAILED", email: string, actorUserId: string | null, result: string) {
  try {
    await prisma.auditLog.create({ data: { actorUserId, action, entityType: "Authentication", entityId: actorUserId ?? email, metadata: { result, email } } });
  } catch (error) {
    console.error("Unable to write authentication audit event", error instanceof Error ? error.message : "Unknown error");
  }
}
