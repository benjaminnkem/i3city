import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./options";

export async function requireAdminSession(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session || session.error) {
    redirect("/admin/login");
  }
  return session;
}
