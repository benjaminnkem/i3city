"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem={false}
      storageKey="i3-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
