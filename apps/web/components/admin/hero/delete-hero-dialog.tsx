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
import { deleteHeroSlide, heroKeys } from "@/lib/admin/hero";

export interface HeroDeleteTarget {
  id: string;
  headline: string;
}

export function DeleteHeroDialog({
  target,
  onOpenChange,
  onDeleted,
}: Readonly<{
  target: HeroDeleteTarget | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}>) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: deleteHeroSlide,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: heroKeys.all });
      toast.success("Slide deleted");
      onOpenChange(false);
      onDeleted?.();
    },
    onError: notifyError,
  });

  return (
    <AlertDialog open={target !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this slide?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{target?.headline}&rdquo; is removed from the store, along
            with its banner image. To hide it for now, turn it off instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => target && remove.mutate(target.id)}
          >
            {remove.isPending ? "Deleting" : "Delete slide"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
