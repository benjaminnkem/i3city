"use client";

import type { AdminCategory } from "@repo/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { categoryKeys, deleteCategory } from "@/lib/admin/categories";
import { notifyError } from "@/lib/admin/errors";

function describeImpact(count: number): string {
  if (count === 0) {
    return "This category has no products.";
  }
  return `${count} ${count === 1 ? "product" : "products"} will become uncategorised.`;
}

export function DeleteCategoryDialog({
  category,
  onOpenChange,
}: Readonly<{
  category: AdminCategory | null;
  onOpenChange: (open: boolean) => void;
}>) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Category deleted");
      onOpenChange(false);
    },
    onError: notifyError,
  });

  return (
    <AlertDialog open={category !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {category?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {describeImpact(category?.productCount ?? 0)} This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => category && remove.mutate(category.id)}
          >
            {remove.isPending ? "Deleting" : "Delete category"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
