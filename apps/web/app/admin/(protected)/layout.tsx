import { AdminSessionProvider } from "@/components/admin/session-provider";
import { requireAdminSession } from "@/lib/auth/session";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdminSession();
  return (
    <AdminSessionProvider session={session}>{children}</AdminSessionProvider>
  );
}
