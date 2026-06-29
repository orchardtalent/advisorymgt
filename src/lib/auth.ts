import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { roleCard: true },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id:        user.id,
          name:      user.name,
          email:     user.email,
          role:      user.roleCard?.role ?? null,
          canManage: user.canManage,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id        = user.id;
        token.role      = (user as any).role;
        token.canManage = (user as any).canManage;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id        = token.id;
        (session.user as any).role      = token.role;
        (session.user as any).canManage = token.canManage;
      }
      return session;
    },
  },
};

// Resolve the current user's id from their session by EMAIL (stable), rather than
// trusting the id baked into the JWT — which can go stale if user rows are
// re-created. Returns null if not found.
export async function userIdFromSession(
  session: { user?: { email?: string | null } | null } | null
): Promise<string | null> {
  const email = session?.user?.email;
  if (!email) return null;
  const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  return u?.id ?? null;
}
