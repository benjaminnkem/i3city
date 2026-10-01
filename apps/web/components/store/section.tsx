import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-page px-4 md:px-8", className)}
      {...props}
    />
  );
}

export function SectionHeading({
  title,
  href,
  linkLabel = "View all",
}: Readonly<{ title: string; href?: string; linkLabel?: string }>) {
  return (
    <Reveal className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-h2 font-extrabold">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="text-primary border-b-2 border-current font-bold whitespace-nowrap"
        >
          {linkLabel}
        </Link>
      ) : null}
    </Reveal>
  );
}
