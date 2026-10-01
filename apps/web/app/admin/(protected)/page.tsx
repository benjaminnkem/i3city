import { SignOutButton } from "@/components/admin/sign-out-button";
import { requestProfile } from "@/lib/auth/api-client";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const profile = await requestProfile(session.accessToken);
  return (
    <main className="mx-auto flex min-h-screen max-w-page flex-col items-start justify-center gap-6 px-4 md:px-8">
      <h1 className="text-h2 font-extrabold">Dashboard</h1>
      <p className="text-muted">
        {profile
          ? `Signed in as ${profile.email}`
          : "Could not load your profile"}
      </p>
      <SignOutButton />
    </main>
  );
}
