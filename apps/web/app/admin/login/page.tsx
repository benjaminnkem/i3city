import { BarChart3, PackageCheck, Smartphone } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in" };

const highlights = [
  {
    icon: PackageCheck,
    tone: "bg-tone-1",
    title: "Orders in one place",
    text: "Confirm, pack and ship from a single list.",
  },
  {
    icon: BarChart3,
    tone: "bg-tone-2",
    title: "Sales at a glance",
    text: "Revenue, best sellers and low stock on the dashboard.",
  },
  {
    icon: Smartphone,
    tone: "bg-tone-3",
    title: "Built for your phone",
    text: "Run the store from the counter or on the road.",
  },
];

function Wordmark() {
  return (
    <p className="text-h3 font-extrabold">
      i3<span className="text-primary">city</span>
    </p>
  );
}

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);
  if (session && !session.error) {
    redirect("/admin");
  }
  return (
    <main className="grid min-h-screen  lg:grid-cols-[1.05fr_1fr]">
      <section className="bg-muted hidden flex-col justify-between gap-10 p-12 lg:flex">
        <Wordmark />
        <div className="grid gap-8">
          <h2 className="text-h2 max-w-md font-extrabold">
            Everything your store needs, in one dashboard
          </h2>
          <ul className="grid max-w-md gap-3">
            {highlights.map(({ icon: Icon, tone, title, text }) => (
              <li
                key={title}
                className={`${tone} flex items-center gap-4 rounded-md p-4`}
              >
                <span className="bg-background text-primary grid size-11 shrink-0 place-items-center rounded-pill">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="grid gap-0.5">
                  <span className="font-bold">{title}</span>
                  <span className="text-muted-foreground text-small">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground text-small">
          Need help? Contact whoever set up your store.
        </p>
      </section>
      <section className="flex min-h-screen flex-col px-4 py-6 md:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Wordmark />
          </div>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-10">
          <div className="grid gap-2">
            <h1 className="text-h2 font-extrabold">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to manage your products, orders and delivery.
            </p>
          </div>
          <div className="border-border bg-card rounded-md border p-6 md:p-8">
            <LoginForm />
          </div>
        </div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-small mx-auto font-semibold underline-offset-4 hover:underline"
        >
          Back to the store
        </Link>
      </section>
    </main>
  );
}
