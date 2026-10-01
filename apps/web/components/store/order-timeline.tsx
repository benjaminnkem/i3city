import {
  ORDER_STATUS_LABELS,
  type OrderStatusName,
  type OrderTimelineEntry,
} from "@repo/types";
import { format, parseISO } from "date-fns";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS: OrderStatusName[] = [
  "AWAITING_CONFIRMATION",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

const STEP_LABELS: Partial<Record<OrderStatusName, string>> = {
  AWAITING_CONFIRMATION: "Order placed",
};

export function OrderTimeline({
  timeline,
  status,
}: Readonly<{ timeline: OrderTimelineEntry[]; status: OrderStatusName }>) {
  const reached = new Map(timeline.map((entry) => [entry.status, entry.at]));
  const cancelledAt = reached.get("CANCELLED");
  const currentIndex = STEPS.indexOf(status);
  return (
    <div className="flex flex-col gap-4">
      {status === "CANCELLED" ? (
        <p role="status" className="bg-muted rounded-md px-4 py-3 font-bold">
          This order was cancelled
          {cancelledAt
            ? ` on ${format(parseISO(cancelledAt), "d MMM yyyy")}`
            : ""}
          .
        </p>
      ) : null}
      <ol className="flex flex-col">
        {STEPS.map((step, index) => {
          const at = reached.get(step);
          const done =
            at !== undefined || (currentIndex >= 0 && index <= currentIndex);
          const current = step === status;
          return (
            <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-7 left-3 h-[calc(100%-1.75rem)] w-0.5",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "z-10 grid size-6 shrink-0 place-items-center rounded-full border-2",
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border bg-background",
                )}
              >
                {done ? (
                  <CheckIcon className="size-3.5" strokeWidth={3} />
                ) : null}
              </span>
              <div className="flex flex-col">
                <span
                  className={cn("font-bold", !done && "text-muted-foreground")}
                  aria-current={current ? "step" : undefined}
                >
                  {STEP_LABELS[step] ?? ORDER_STATUS_LABELS[step]}
                </span>
                {at ? (
                  <span className="text-muted-foreground price text-sm">
                    {format(parseISO(at), "d MMM yyyy, h:mm a")}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
