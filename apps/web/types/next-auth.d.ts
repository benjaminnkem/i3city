import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: number;
  }

  interface Session {
    accessToken: string;
    accessTokenExpiresAt: number;
    error?: "RefreshTokenError";
    user: {
      id: string;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: number;
    error?: "RefreshTokenError";
  }
}
