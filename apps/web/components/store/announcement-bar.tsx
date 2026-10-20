import { fetchSettings } from "@/lib/store/api";
import { AnnouncementMarquee } from "./announcement-marquee";

export async function AnnouncementBar() {
  const settings = await fetchSettings().catch(() => null);
  return <AnnouncementMarquee messages={settings?.announcements ?? []} />;
}
