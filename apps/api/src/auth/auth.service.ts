import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service.js";
import { ENV, type Env } from "../config/env.js";
import type { AccessGrant, AdminPrincipal, LoginResult } from "@repo/types";
import type { AccessTokenPayload } from "./auth.types.js";
import type { LoginDto } from "./dto/login.dto.js";

const MS_PER_DAY = 86_400_000;
const PASSWORD_COST = 12;
const MISSING_USER_HASH = bcrypt.hashSync("missing-user", PASSWORD_COST);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    const matches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? MISSING_USER_HASH,
    );
    if (!user || !matches) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const principal: AdminPrincipal = { id: user.id, email: user.email };
    const access = await this.signAccessToken(principal);
    const refresh = await this.createRefreshToken(user.id);
    return { ...access, ...refresh, user: principal };
  }

  async refresh(refreshToken: string): Promise<AccessGrant> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { adminUser: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
      throw new UnauthorizedException("Refresh token is invalid or expired");
    }
    return this.signAccessToken({
      id: stored.adminUser.id,
      email: stored.adminUser.email,
    });
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyAccessToken(token: string): Promise<AdminPrincipal> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.env.JWT_SECRET,
      });
      return { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException("Access token is invalid or expired");
    }
  }

  private async signAccessToken(admin: AdminPrincipal): Promise<AccessGrant> {
    const payload: AccessTokenPayload = { sub: admin.id, email: admin.email };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.env.JWT_SECRET,
      expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS,
    });
    return {
      accessToken,
      accessTokenExpiresAt:
        Date.now() + this.env.ACCESS_TOKEN_TTL_SECONDS * 1000,
    };
  }

  private async createRefreshToken(
    adminUserId: string,
  ): Promise<{ refreshToken: string; refreshTokenExpiresAt: number }> {
    const refreshToken = randomBytes(48).toString("base64url");
    const expiresAt = new Date(
      Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * MS_PER_DAY,
    );
    await this.prisma.refreshToken.create({
      data: { tokenHash: hashToken(refreshToken), adminUserId, expiresAt },
    });
    return { refreshToken, refreshTokenExpiresAt: expiresAt.getTime() };
  }
}
