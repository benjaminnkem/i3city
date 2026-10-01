import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);
  if (session && !session.error) {
    redirect("/admin");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-page flex-col items-start justify-center gap-6 px-4 md:px-8">
      <p className="text-h3 font-extrabold">
        i3<span className="text-primary">city</span> admin
      </p>
      <h1 className="text-h2 font-extrabold">Sign in</h1>
      <LoginForm />
    </main>
  );
}
