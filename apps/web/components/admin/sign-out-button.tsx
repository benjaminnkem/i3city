"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="border-text min-h-12 rounded-pill border-2 px-6 font-bold hover:bg-text hover:text-bg"
    >
      Sign out
    </button>
  );
}
