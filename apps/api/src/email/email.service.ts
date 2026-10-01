import { Inject, Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { ENV, type Env } from "../config/env.js";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: Resend | null;
  private readonly from: string;

  constructor(@Inject(ENV) env: Env) {
    this.client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
    this.from = env.EMAIL_FROM;
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.client) {
      this.logger.log(
        `Email not configured, skipped "${message.subject}" to ${message.to}`,
      );
      return;
    }
    try {
      const { error } = await this.client.emails.send({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      if (error) {
        this.logger.warn(
          `Could not send "${message.subject}": ${error.message}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Could not send "${message.subject}": ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }
}
