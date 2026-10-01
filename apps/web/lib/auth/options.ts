import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { ApiError } from "@/lib/api";
import { requestLogin, requestLogout, requestRefresh } from "./api-client";
import { loginSchema } from "./schemas";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const REFRESH_MARGIN_MS = 30_000;

async function renewAccessToken(token: JWT): Promise<JWT> {
  if (token.refreshTokenExpiresAt <= Date.now()) {
    return { ...token, error: "RefreshTokenError" };
  }
  const grant = await requestRefresh(token.refreshToken).catch(() => null);
  if (!grant) {
    return { ...token, error: "RefreshTokenError" };
  }
  return {
    ...token,
    accessToken: grant.accessToken,
    accessTokenExpiresAt: grant.accessTokenExpiresAt,
    error: undefined,
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const result = await requestLogin(parsed.data).catch(
          (error: unknown) => {
            if (error instanceof ApiError && error.status === 429) {
              throw new Error("Too many attempts. Try again in a minute.");
            }
            throw new Error("Could not reach the server. Try again.");
          },
        );
        if (!result) {
          return null;
        }
        return {
          id: result.user.id,
          email: result.user.email,
          accessToken: result.accessToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
          refreshToken: result.refreshToken,
          refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          userId: user.id,
          accessToken: user.accessToken,
          accessTokenExpiresAt: user.accessTokenExpiresAt,
          refreshToken: user.refreshToken,
          refreshTokenExpiresAt: user.refreshTokenExpiresAt,
          error: undefined,
        };
      }
      if (Date.now() < token.accessTokenExpiresAt - REFRESH_MARGIN_MS) {
        return token;
      }
      return renewAccessToken(token);
    },
    async session({ session, token }) {
      session.user = { id: token.userId, email: session.user?.email ?? "" };
      session.accessToken = token.accessToken;
      session.accessTokenExpiresAt = token.accessTokenExpiresAt;
      session.error = token.error;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token.refreshToken) {
        await requestLogout(token.refreshToken);
      }
    },
  },
};
