"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { adminNav, isActive } from "./admin-nav";
import { UserMenu } from "./user-menu";

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/admin"
          className="px-2 py-1 text-2xl font-extrabold tracking-tight group-data-[collapsible=icon]:text-lg"
          aria-label="i3City admin home"
        >
          i3<span className="text-primary">city</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item, pathname)}
                    tooltip={item.label}
                    render={
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                      />
                    }
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
