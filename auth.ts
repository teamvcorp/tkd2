import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByUsername } from '@/lib/userStore';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = await getUserByUsername(username);
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.parentName,
          email: user.username, // next-auth uses email as a unique identifier slot
          username: user.username,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/members',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // Persist username in the JWT
        token.username = (user as { username?: string }).username ?? token.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.username) {
        (session.user as { username?: string }).username = token.username as string;
      }
      return session;
    },
  },
});
