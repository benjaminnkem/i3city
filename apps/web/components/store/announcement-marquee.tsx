import { marqueeSeconds } from "@/lib/motion";
import { cn } from "@/lib/utils";

function MessageGroup({
  messages,
  hidden,
}: Readonly<{ messages: string[]; hidden?: boolean }>) {
  return (
    <ul
      aria-hidden={hidden}
      className={cn(
        "animate-marquee flex min-w-full shrink-0 items-center justify-around gap-x-10 pr-10 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:min-w-0 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-1 motion-reduce:pr-0",
        hidden && "motion-reduce:hidden",
      )}
    >
      {messages.map((message, index) => (
        <li
          key={`${index}-${message}`}
          className="flex items-center gap-x-10 whitespace-nowrap"
        >
          {index > 0 ? (
            <span aria-hidden className="opacity-60">
              •
            </span>
          ) : null}
          {message}
        </li>
      ))}
    </ul>
  );
}

export function AnnouncementMarquee({
  messages,
  className,
}: Readonly<{ messages: string[]; className?: string }>) {
  if (messages.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Store announcements"
      className={cn(
        "group bg-foreground text-background text-small flex overflow-hidden py-2 font-semibold motion-reduce:justify-center motion-reduce:px-4",
        className,
      )}
      style={
        {
          "--marquee-duration": `${marqueeSeconds(messages)}s`,
        } as React.CSSProperties
      }
    >
      <MessageGroup messages={messages} />
      <MessageGroup messages={messages} hidden />
    </div>
  );
}
