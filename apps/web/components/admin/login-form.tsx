"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema } from "@/lib/auth/schemas";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setPending(true);
    const result = await signIn("credentials", {
      ...parsed.data,
      redirect: false,
    });
    setPending(false);
    if (!result || result.error) {
      setError(
        !result || result.error === "CredentialsSignin"
          ? "Wrong email or password"
          : result.error,
      );
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid w-full max-w-sm gap-4">
      <label className="grid gap-2 font-bold" htmlFor="email">
        Email
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="border-border bg-background min-h-12 rounded-pill border px-5 font-normal"
        />
      </label>
      <label className="grid gap-2 font-bold" htmlFor="password">
        Password
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border-border bg-background min-h-12 rounded-pill border px-5 font-normal"
        />
      </label>
      {error ? (
        <p role="alert" className="text-warning font-bold">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground min-h-12 rounded-pill px-6 font-bold hover:brightness-90 disabled:opacity-60"
      >
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
