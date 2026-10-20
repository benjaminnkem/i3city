"use client";

import { HERO_WHATSAPP_HREF } from "@repo/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryKeys, listCategories } from "@/lib/admin/categories";

const CUSTOM = "custom";

export function HeroLinkField({
  value,
  error,
  onChange,
}: Readonly<{
  value: string;
  error?: string;
  onChange: (value: string) => void;
}>) {
  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: listCategories,
  });
  const items = [
    { value: "/shop", label: "All products" },
    ...(categories.data ?? []).map((category) => ({
      value: `/category/${category.slug}`,
      label: category.name,
    })),
    { value: HERO_WHATSAPP_HREF, label: "WhatsApp chat" },
    { value: CUSTOM, label: "Another page on the store" },
  ];
  const known = items.some(
    (item) => item.value !== CUSTOM && item.value === value,
  );
  const [custom, setCustom] = useState(false);
  const selected = custom || (!known && !categories.isPending) ? CUSTOM : value;

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor="ctaTarget">Button goes to</FieldLabel>
      <Select
        items={items}
        value={selected}
        onValueChange={(next) => {
          if (next === CUSTOM) {
            setCustom(true);
            if (known) onChange("");
            return;
          }
          setCustom(false);
          onChange(next ?? "/shop");
        }}
      >
        <SelectTrigger id="ctaTarget" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected === CUSTOM ? (
        <>
          <Input
            aria-label="Page link"
            placeholder="/product/iphone-14-pro-max-pouch"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={error ? true : undefined}
          />
          <FieldDescription>
            Copy the part of the address after the domain, starting with /.
          </FieldDescription>
        </>
      ) : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
