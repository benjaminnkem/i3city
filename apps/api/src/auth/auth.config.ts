export interface AuthConfig {
  jwtSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
}

export const AUTH_CONFIG = Symbol("AUTH_CONFIG");

const MIN_SECRET_LENGTH = 32;

function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

export function loadAuthConfig(): AuthConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters`,
    );
  }
  return {
    jwtSecret,
    accessTokenTtlSeconds: positiveInt("ACCESS_TOKEN_TTL_SECONDS", 900),
    refreshTokenTtlDays: positiveInt("REFRESH_TOKEN_TTL_DAYS", 7),
  };
}
