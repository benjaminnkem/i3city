import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

export function Logo({
  className,
  markClassName,
  textClassName,
}: Readonly<{
  className?: string;
  markClassName?: string;
  textClassName?: string;
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-extrabold tracking-tight",
        className,
      )}
    >
      <LogoMark className={cn("size-9 shrink-0", markClassName)} />
      <span className={textClassName}>i3City</span>
    </span>
  );
}
