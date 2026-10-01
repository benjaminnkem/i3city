"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

const REFETCH_INTERVAL_SECONDS = 4 * 60;

export function AdminSessionProvider({
  session,
  children,
}: Readonly<{ session: Session; children: React.ReactNode }>) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={REFETCH_INTERVAL_SECONDS}
      refetchOnWindowFocus
    >
      {children}
    </SessionProvider>
  );
}
