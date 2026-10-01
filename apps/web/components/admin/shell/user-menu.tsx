"use client";

import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const { data: session } = useSession();
  const email = session?.user.email ?? "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<SidebarMenuButton size="lg" tooltip="Account" />}
      >
        <Avatar className="size-8">
          <AvatarFallback>{initials(email)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-left">{email}</span>
        <ChevronsUpDownIcon className="ml-auto" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="min-w-56">
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
