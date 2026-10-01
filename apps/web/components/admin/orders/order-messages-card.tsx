"use client";

import type { AdminOrder, AdminSettings } from "@repo/types";
import { CopyIcon, MessageCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { publicEnv } from "@/lib/env";
import {
  paymentDetailsMessage,
  shippedMessage,
  whatsappToCustomer,
} from "@/lib/admin/order-templates";

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy. Select the text and copy it instead.");
  }
}

function Template({
  title,
  message,
  phone,
}: Readonly<{ title: string; message: string; phone: string }>) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold">{title}</p>
      <pre className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">
        {message}
      </pre>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => void copy(message, title)}
        >
          <CopyIcon data-icon="inline-start" />
          Copy
        </Button>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={
            <a
              href={whatsappToCustomer(phone, message)}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <MessageCircleIcon data-icon="inline-start" />
          Open in WhatsApp
        </Button>
      </div>
    </div>
  );
}

export function OrderMessagesCard({
  order,
  settings,
}: Readonly<{ order: AdminOrder; settings: AdminSettings | undefined }>) {
  const trackingUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/order/${order.code}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp messages</CardTitle>
        <CardDescription>
          Ready-to-send messages for this customer.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {settings ? (
          <Template
            title="Payment details"
            message={paymentDetailsMessage(order, settings)}
            phone={order.phone}
          />
        ) : null}
        <Template
          title="Shipped update"
          message={shippedMessage(order, trackingUrl)}
          phone={order.phone}
        />
      </CardContent>
    </Card>
  );
}
