import { AdminSessionProvider } from "@/components/admin/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PrintLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdminSession();
  return (
    <AdminSessionProvider session={session}>
      <QueryProvider>{children}</QueryProvider>
    </AdminSessionProvider>
  );
}
