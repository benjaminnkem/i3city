"use client";

import { MessageCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { whatsappSessionKey } from "@/lib/store/whatsapp";

const REDIRECT_DELAY_MS = 1500;

export function WhatsAppContinue({
  code,
  autoOpen,
}: Readonly<{ code: string; autoOpen: boolean }>) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(whatsappSessionKey(code));
    } catch {
      stored = null;
    }
    setUrl(stored);
    if (!stored || !autoOpen) return;
    const flag = `${whatsappSessionKey(code)}-opened`;
    try {
      if (sessionStorage.getItem(flag)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(flag, "1");
      } catch {
        void 0;
      }
      window.location.assign(stored);
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [code, autoOpen]);

  if (!url) return null;
  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" nativeButton={false} render={<a href={url} />}>
        <MessageCircleIcon data-icon="inline-start" />
        Send your order on WhatsApp
      </Button>
      {autoOpen ? (
        <p className="text-muted-foreground text-sm">
          Opening WhatsApp for you. If nothing happens, tap the button.
        </p>
      ) : null}
    </div>
  );
}
