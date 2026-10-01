"use client";

import type { AdminProduct, PaginationMeta } from "@repo/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import {
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useProductFilters } from "@/hooks/use-product-filters";
import { categoryKeys, listCategories } from "@/lib/admin/categories";
import { notifyError } from "@/lib/admin/errors";
import { fromSorting, toSorting } from "@/lib/admin/product-sort";
import {
  DEFAULT_PRODUCT_FILTERS,
  listProducts,
  productKeys,
  setProductsActive,
  updateProduct,
  type ProductFilters,
  type ProductPatch,
} from "@/lib/admin/products";
import { statsKeys } from "@/lib/admin/stats";
import { toApiError } from "@/lib/api";
import {
  DeleteProductsDialog,
  type DeleteTarget,
} from "./delete-products-dialog";
import { productColumns } from "./product-columns";

const SEARCH_DEBOUNCE_MS = 300;

interface ProductPage {
  items: AdminProduct[];
  meta: PaginationMeta;
}

const STOCK_OPTIONS = [
  { value: "all", label: "Any stock" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

function hasActiveFilters(filters: ProductFilters): boolean {
  return Boolean(
    filters.search || filters.categoryId || filters.status || filters.stock,
  );
}

export function ProductsView() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useProductFilters();
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [searchDraft, setSearchDraft] = useState(filters.search);

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (searchDraft === filters.search) return;
    const timer = setTimeout(
      () => setFilters({ search: searchDraft.trim() }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchDraft, filters.search, setFilters]);

  const products = useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => listProducts(filters),
    placeholderData: keepPreviousData,
  });
  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: listCategories,
  });

  const patch = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: ProductPatch }) =>
      updateProduct(id, changes),
    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.all });
      const snapshots = queryClient.getQueriesData<ProductPage>({
        queryKey: productKeys.all,
      });
      queryClient.setQueriesData<ProductPage>(
        { queryKey: productKeys.all },
        (page) =>
          page && "items" in page
            ? {
                ...page,
                items: page.items.map((item) =>
                  item.id === id ? { ...item, ...changes } : item,
                ),
              }
            : page,
      );
      return { snapshots };
    },
    onError: (error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      notifyError(error);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
      void queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });

  const bulkActive = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      setProductsActive(ids, active),
    onSuccess: async ({ updated }, { active }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: statsKeys.all }),
      ]);
      toast.success(
        `${updated} ${updated === 1 ? "product" : "products"} ${active ? "now visible" : "hidden"}`,
      );
      setSelection({});
    },
    onError: notifyError,
  });

  const items = useMemo(() => products.data?.items ?? [], [products.data]);
  const meta = products.data?.meta;
  const selectedIds = Object.keys(selection).filter((id) => selection[id]);

  const columns = useMemo(
    () =>
      productColumns({
        savingId: patch.isPending ? (patch.variables?.id ?? null) : null,
        onToggleActive: (product, active) =>
          patch.mutate({ id: product.id, changes: { active } }),
        onToggleFeatured: (product, featured) =>
          patch.mutate({ id: product.id, changes: { featured } }),
        onSaveStock: (product, stock) => {
          patch.mutate({ id: product.id, changes: { stock } });
          toast.success(`Stock updated for ${product.name}`);
        },
        onDelete: (product) =>
          setDeleteTarget({ ids: [product.id], label: product.name }),
      }),
    [patch],
  );

  function changeFilters(next: Partial<ProductFilters>) {
    setSelection({});
    setFilters(next);
  }

  function clearFilters() {
    setSearchDraft("");
    changeFilters({ ...DEFAULT_PRODUCT_FILTERS, sort: filters.sort });
  }

  const categoryItems = [
    { value: "all", label: "All categories" },
    { value: "none", label: "Uncategorised" },
    ...(categories.data ?? []).map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];
  const statusValue = filters.status === "" ? "all" : filters.status;

  return (
    <>
      <PageHeader
        title="Products"
        description="Add, edit and organise everything you sell."
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/admin/products/new" />}
          >
            <PlusIcon data-icon="inline-start" />
            Add product
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <InputGroup className="lg:max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search name, SKU or brand"
            aria-label="Search products"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </InputGroup>
        <Select
          items={categoryItems}
          value={filters.categoryId === "" ? "all" : filters.categoryId}
          onValueChange={(value) =>
            changeFilters({
              categoryId: value === "all" || value === null ? "" : value,
            })
          }
        >
          <SelectTrigger aria-label="Category" className="w-full lg:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={STOCK_OPTIONS}
          value={filters.stock === "" ? "all" : filters.stock}
          onValueChange={(value) =>
            changeFilters({
              stock:
                value === "in" || value === "low" || value === "out"
                  ? value
                  : "",
            })
          }
        >
          <SelectTrigger aria-label="Stock" className="w-full lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STOCK_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          variant="outline"
          value={[statusValue]}
          onValueChange={(value) => {
            const next = value[0];
            if (next === "all") changeFilters({ status: "" });
            if (next === "active" || next === "inactive")
              changeFilters({ status: next });
          }}
          aria-label="Visibility"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="active">Visible</ToggleGroupItem>
          <ToggleGroupItem value="inactive">Hidden</ToggleGroupItem>
        </ToggleGroup>
        {hasActiveFilters(filters) ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon data-icon="inline-start" />
            Clear filters
          </Button>
        ) : null}
      </div>

      {selectedIds.length > 0 ? (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="bg-accent flex flex-wrap items-center gap-2 rounded-md px-4 py-2"
        >
          <span className="price mr-auto font-bold">
            {selectedIds.length} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkActive.isPending}
            onClick={() =>
              bulkActive.mutate({ ids: selectedIds, active: true })
            }
          >
            <EyeIcon data-icon="inline-start" />
            Show
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkActive.isPending}
            onClick={() =>
              bulkActive.mutate({ ids: selectedIds, active: false })
            }
          >
            <EyeOffIcon data-icon="inline-start" />
            Hide
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              setDeleteTarget({
                ids: selectedIds,
                label: `${selectedIds.length} ${selectedIds.length === 1 ? "product" : "products"}`,
              })
            }
          >
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelection({})}>
            Clear
          </Button>
        </div>
      ) : null}

      {products.isError ? (
        <Alert>
          <AlertTitle>Could not load products</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {toApiError(products.error).message}
            <Button
              size="sm"
              variant="outline"
              onClick={() => products.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          getRowId={(product) => product.id}
          loading={products.isPending}
          rowSelection={selection}
          onRowSelectionChange={setSelection}
          sorting={toSorting(filters.sort)}
          onSortingChange={(updater) => {
            const next: SortingState =
              typeof updater === "function"
                ? updater(toSorting(filters.sort))
                : updater;
            changeFilters({ sort: fromSorting(next) });
          }}
          pagination={{
            page: meta?.page ?? filters.page,
            pageSize: meta?.limit ?? filters.limit,
            total: meta?.total ?? 0,
            onPageChange: (page) => {
              setSelection({});
              setFilters({ page });
            },
          }}
          emptyTitle={
            hasActiveFilters(filters) ? "No products match" : "No products yet"
          }
          emptyDescription={
            hasActiveFilters(filters)
              ? "Try a different search or clear the filters."
              : "Add your first product to start selling."
          }
        />
      )}

      <DeleteProductsDialog
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={() => setSelection({})}
      />
    </>
  );
}
