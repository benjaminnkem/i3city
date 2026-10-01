"use client";

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
import { notifyError } from "@/lib/admin/errors";
import { deleteProducts, productKeys } from "@/lib/admin/products";
import { statsKeys } from "@/lib/admin/stats";

export interface DeleteTarget {
  ids: string[];
  label: string;
}

export function DeleteProductsDialog({
  target,
  onOpenChange,
  onDeleted,
}: Readonly<{
  target: DeleteTarget | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}>) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (ids: string[]) => deleteProducts(ids),
    onSuccess: async ({ deleted }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: statsKeys.all }),
      ]);
      toast.success(
        deleted === 1 ? "Product deleted" : `${deleted} products deleted`,
      );
      onOpenChange(false);
      onDeleted?.();
    },
    onError: notifyError,
  });

  return (
    <AlertDialog open={target !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {target?.label}?</AlertDialogTitle>
          <AlertDialogDescription>
            Their photos are removed too. Past orders keep the name and price
            they were bought at. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => target && remove.mutate(target.ids)}
          >
            {remove.isPending ? "Deleting" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
