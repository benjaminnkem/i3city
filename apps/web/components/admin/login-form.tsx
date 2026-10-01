"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { loginSchema } from "@/lib/auth/schemas";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);

  function clearField(name: keyof FieldErrors) {
    setError(null);
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "email" || key === "password") && !next[key]) {
          next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setPending(true);
    const result = await signIn("credentials", {
      ...parsed.data,
      redirect: false,
    });
    if (!result || result.error) {
      setPending(false);
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
    <form onSubmit={onSubmit} noValidate className="grid w-full gap-5">
      <div className="grid gap-2">
        <Label htmlFor="email" className="font-bold">
          Email
        </Label>
        <div className="relative">
          <Mail
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@i3city.com"
            aria-invalid={fieldErrors.email ? true : undefined}
            onChange={() => clearField("email")}
            className="h-12 pl-11"
          />
        </div>
        {fieldErrors.email ? (
          <p role="alert" className="text-destructive text-small">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password" className="font-bold">
          Password
        </Label>
        <div className="relative">
          <Lock
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          />
          <Input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={fieldErrors.password ? true : undefined}
            onChange={() => clearField("password")}
            className="h-12 pr-12 pl-11"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            className="absolute top-1/2 right-1.5 -translate-y-1/2"
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        {fieldErrors.password ? (
          <p role="alert" className="text-destructive text-small">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      {error ? (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-4 py-3 font-bold"
        >
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Spinner /> Signing in
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
