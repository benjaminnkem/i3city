"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { adminNav, isActive } from "./admin-nav";
import { ThemeToggle } from "./theme-toggle";

export function AdminShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const current = adminNav.find((item) => isActive(item, pathname));
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="border-border bg-background sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <span className="font-bold">{current?.label ?? "Admin"}</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 p-4 md:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
