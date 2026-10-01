"use client";

import { LOW_STOCK_THRESHOLD } from "@repo/types";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export function QuickStock({
  name,
  stock,
  saving,
  onSave,
}: Readonly<{
  name: string;
  stock: number;
  saving: boolean;
  onSave: (stock: number) => void;
}>) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(stock));
  const valid = /^\d+$/.test(draft.trim()) && Number(draft) <= 100000;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(String(stock));
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Edit stock for ${name}`}
            className="-ml-3"
          />
        }
      >
        {stock === 0 ? (
          <Badge variant="outline">Out of stock</Badge>
        ) : stock <= LOW_STOCK_THRESHOLD ? (
          <Badge variant="outline" className="text-warning">
            Only {stock} left
          </Badge>
        ) : (
          <span className="price">{stock}</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            onSave(Number(draft));
            setOpen(false);
          }}
        >
          <PopoverHeader>
            <PopoverTitle>Update stock</PopoverTitle>
            <PopoverDescription className="truncate">{name}</PopoverDescription>
          </PopoverHeader>
          <Label htmlFor={`stock-${name}`} className="sr-only">
            Units in stock
          </Label>
          <Input
            id={`stock-${name}`}
            inputMode="numeric"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-invalid={!valid}
            autoFocus
          />
          <Button type="submit" disabled={!valid || saving}>
            Save stock
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
