export interface AdminPrincipal {
  id: string;
  email: string;
}

export interface AccessGrant {
  accessToken: string;
  accessTokenExpiresAt: number;
}

export interface LoginResult extends AccessGrant {
  refreshToken: string;
  refreshTokenExpiresAt: number;
  user: AdminPrincipal;
}
