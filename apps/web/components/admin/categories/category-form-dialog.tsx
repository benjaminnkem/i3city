"use client";

import type { AdminCategory } from "@repo/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  categoryFormSchema,
  categoryKeys,
  createCategory,
  updateCategory,
} from "@/lib/admin/categories";
import { notifyError } from "@/lib/admin/errors";

type FieldErrors = Partial<Record<"name" | "slug", string>>;

export function CategoryFormDialog({
  open,
  category,
  onOpenChange,
}: Readonly<{
  open: boolean;
  category: AdminCategory | null;
  onOpenChange: (open: boolean) => void;
}>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <CategoryForm
            key={category?.id ?? "new"}
            category={category}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  category,
  onDone,
}: Readonly<{ category: AdminCategory | null; onDone: () => void }>) {
  const queryClient = useQueryClient();
  const editing = category !== null;
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});

  const save = useMutation({
    mutationFn: async () => {
      if (!category) {
        return createCategory(name.trim());
      }
      return updateCategory(category.id, {
        ...(name.trim() !== category.name ? { name: name.trim() } : {}),
        ...(slug.trim() && slug.trim() !== category.slug
          ? { slug: slug.trim() }
          : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(editing ? "Category updated" : "Category added");
      onDone();
    },
    onError: notifyError,
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = categoryFormSchema.safeParse({
      name,
      slug: editing ? slug : "",
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "name" || key === "slug") && !next[key]) {
          next[key] = issue.message;
        }
      }
      setErrors(next);
      return;
    }
    setErrors({});
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Change the name shoppers see. The slug is used in the category link."
            : "Categories group products in the store."}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="category-name">Name</FieldLabel>
          <Input
            id="category-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            autoComplete="off"
            autoFocus
          />
          <FieldError>{errors.name}</FieldError>
        </Field>
        {editing ? (
          <Field data-invalid={errors.slug ? true : undefined}>
            <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
            <Input
              id="category-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              aria-invalid={errors.slug ? true : undefined}
              autoComplete="off"
            />
            <FieldDescription>
              Changing the slug changes the category link.
            </FieldDescription>
            <FieldError>{errors.slug}</FieldError>
          </Field>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending
            ? "Saving"
            : editing
              ? "Save changes"
              : "Add category"}
        </Button>
      </DialogFooter>
    </form>
  );
}
