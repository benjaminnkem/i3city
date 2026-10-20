import { MotionProvider } from "@/components/motion/motion-provider";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";

export const dynamic = "force-dynamic";

export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <MotionProvider>
      <div className="flex min-h-screen flex-col">
        <AnnouncementBar />
        <StoreHeader />
        <main className="flex-1">{children}</main>
        <StoreFooter />
      </div>
    </MotionProvider>
  );
}
