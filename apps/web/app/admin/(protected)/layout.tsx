import { AdminShell } from "@/components/admin/shell/admin-shell";
import { AdminSessionProvider } from "@/components/admin/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdminSession();
  return (
    <AdminSessionProvider session={session}>
      <QueryProvider>
        <AdminShell>{children}</AdminShell>
      </QueryProvider>
    </AdminSessionProvider>
  );
}
