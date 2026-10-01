import { Container } from "@/components/store/section";

export function LegalPage({
  title,
  updated,
  children,
}: Readonly<{ title: string; updated: string; children: React.ReactNode }>) {
  return (
    <Container className="max-w-3xl py-10 md:py-14">
      <h1 className="text-h2 font-extrabold">{title}</h1>
      <p className="text-muted-foreground text-small mt-2">
        Last updated {updated}
      </p>
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </Container>
  );
}

export function LegalSection({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="text-muted-foreground flex max-w-prose flex-col gap-3 [&_a]:text-primary [&_a]:font-bold [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
