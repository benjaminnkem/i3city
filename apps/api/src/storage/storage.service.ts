import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { UploadSignature } from "@repo/types";
import { ENV, type Env } from "../config/env.js";

interface StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

function storageConfig(env: Env): StorageConfig | null {
  const {
    R2_ACCOUNT_ID: accountId,
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
    R2_BUCKET_NAME: bucket,
    R2_PUBLIC_URL: publicUrl,
  } = env;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl: publicUrl.replace(/\/+$/, ""),
  };
}

const SIGNED_URL_TTL_SECONDS = 300;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;

  private readonly config: StorageConfig | null;

  constructor(@Inject(ENV) env: Env) {
    this.config = storageConfig(env);
  }

  publicUrl(key: string): string {
    return `${this.requireConfig().publicUrl}/${key}`;
  }

  async signUpload(
    key: string,
    contentType: string,
    size: number,
  ): Promise<UploadSignature> {
    const config = this.requireConfig();
    const uploadUrl = await getSignedUrl(
      this.s3(),
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      { expiresIn: SIGNED_URL_TTL_SECONDS },
    );
    return {
      key,
      uploadUrl,
      publicUrl: this.publicUrl(key),
      expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
    };
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
    try {
      await this.s3().send(
        new DeleteObjectsCommand({
          Bucket: this.requireConfig().bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Could not delete ${keys.length} object(s): ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  private requireConfig(): StorageConfig {
    if (!this.config) {
      throw new ServiceUnavailableException("Image storage is not configured");
    }
    return this.config;
  }

  private s3(): S3Client {
    if (!this.client) {
      const config = this.requireConfig();
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
      });
    }
    return this.client;
  }
}
