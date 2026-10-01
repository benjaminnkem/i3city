"use client";

import type { AdminCategory } from "@repo/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  categoryKeys,
  listCategories,
  reorderCategories,
} from "@/lib/admin/categories";
import { notifyError } from "@/lib/admin/errors";
import { toApiError } from "@/lib/api";
import { categoryColumns } from "./category-columns";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";

function moved(
  categories: AdminCategory[],
  index: number,
  direction: -1 | 1,
): AdminCategory[] {
  const target = index + direction;
  const next = [...categories];
  const current = next[index];
  const other = next[target];
  if (!current || !other) {
    return categories;
  }
  next[index] = other;
  next[target] = current;
  return next.map((category, position) => ({
    ...category,
    sortOrder: position,
  }));
}

export function CategoriesView() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: categoryKeys.all,
    queryFn: listCategories,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);

  const reorder = useMutation({
    mutationFn: reorderCategories,
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all });
      const previous = queryClient.getQueryData<AdminCategory[]>(
        categoryKeys.all,
      );
      if (previous) {
        const byId = new Map(
          previous.map((category) => [category.id, category]),
        );
        queryClient.setQueryData(
          categoryKeys.all,
          ids.flatMap((id, position) => {
            const category = byId.get(id);
            return category ? [{ ...category, sortOrder: position }] : [];
          }),
        );
      }
      return { previous };
    },
    onError: (error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(categoryKeys.all, context.previous);
      }
      notifyError(error);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });

  const categories = useMemo(() => query.data ?? [], [query.data]);

  const columns = useMemo(
    () =>
      categoryColumns({
        lastIndex: categories.length - 1,
        busy: reorder.isPending,
        onMove: (index, direction) =>
          reorder.mutate(
            moved(categories, index, direction).map((category) => category.id),
          ),
        onEdit: (category) => {
          setEditing(category);
          setFormOpen(true);
        },
        onDelete: setDeleting,
      }),
    [categories, reorder],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group products and choose the order shoppers see them in."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Add category
          </Button>
        }
      />

      {query.isError ? (
        <Alert>
          <AlertTitle>Could not load categories</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {toApiError(query.error).message}
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          getRowId={(category) => category.id}
          loading={query.isPending}
          paginate={false}
          emptyTitle="No categories yet"
          emptyDescription="Add your first category to start organising products."
        />
      )}

      <CategoryFormDialog
        open={formOpen}
        category={editing}
        onOpenChange={setFormOpen}
      />
      <DeleteCategoryDialog
        category={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      />
    </>
  );
}
