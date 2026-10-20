import {
  ANNOUNCEMENT_MAX_LENGTH,
  ANNOUNCEMENT_MAX_MESSAGES,
  type AnnouncementSettings,
} from "@repo/types";
import { z } from "zod";
import { adminRequest } from "./client";

export const announcementKeys = {
  all: ["admin", "announcements"] as const,
};

export function getAnnouncements(): Promise<AnnouncementSettings> {
  return adminRequest<AnnouncementSettings>({ url: "/admin/announcements" });
}

export function saveAnnouncements(
  settings: AnnouncementSettings,
): Promise<AnnouncementSettings> {
  return adminRequest<AnnouncementSettings>({
    method: "put",
    url: "/admin/announcements",
    data: settings,
  });
}

export const announcementMessageSchema = z
  .string()
  .trim()
  .min(1, "Write a message or remove this line")
  .max(
    ANNOUNCEMENT_MAX_LENGTH,
    `Keep it under ${ANNOUNCEMENT_MAX_LENGTH} characters`,
  );

export const announcementsFormSchema = z
  .object({
    enabled: z.boolean(),
    messages: z
      .array(announcementMessageSchema)
      .max(
        ANNOUNCEMENT_MAX_MESSAGES,
        `Use at most ${ANNOUNCEMENT_MAX_MESSAGES} messages`,
      ),
  })
  .refine((value) => !value.enabled || value.messages.length > 0, {
    message: "Add at least one message to show the bar",
    path: ["messages"],
  });
