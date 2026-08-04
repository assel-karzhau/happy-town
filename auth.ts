import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "./lib/db/prisma";
import type { UserRole } from "./generated/prisma/enums";
import { clearLoginFailures, loginAttemptAllowed, recordLoginFailure } from "./lib/auth/login-rate-limit";

const credentialsSchema = z.object({
  iin: z.string().transform(value=>value.replace(/\s/g,"")).pipe(z.string().regex(/^\d{12}$/)),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [
    Credentials({
      name: "IIN and password",
      credentials: { iin: { type: "text" }, password: { type: "password" } },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          await recordLogin("LOGIN_FAILED", null, "INVALID_INPUT");
          return null;
        }
        if(!loginAttemptAllowed(parsed.data.iin)) {
          await recordLogin("LOGIN_FAILED", null, "RATE_LIMITED");
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { iin: parsed.data.iin },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, archivedAt: true, passwordHash: true },
        });
        if (!user?.passwordHash || user.status !== "ACTIVE" || user.archivedAt) {
          recordLoginFailure(parsed.data.iin);
          await recordLogin("LOGIN_FAILED", user?.id ?? null, "ACCOUNT_UNAVAILABLE");
          return null;
        }
        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          recordLoginFailure(parsed.data.iin);
          await recordLogin("LOGIN_FAILED", user.id, "INVALID_CREDENTIALS");
          return null;
        }
        clearLoginFailures(parsed.data.iin);
        await recordLogin("LOGIN", user.id, "SUCCESS");
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

async function recordLogin(action: "LOGIN" | "LOGIN_FAILED", actorUserId: string | null, result: string) {
  try {
    await prisma.auditLog.create({ data: { actorUserId, action, entityType: "Authentication", entityId: actorUserId ?? "credentials", metadata: { result } } });
  } catch (error) {
    console.error("Unable to write authentication audit event", error instanceof Error ? error.message : "Unknown error");
  }
}
