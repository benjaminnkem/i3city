"use client";

import { formatNaira, type AdminProduct } from "@repo/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { categoryKeys, listCategories } from "@/lib/admin/categories";
import { notifyError } from "@/lib/admin/errors";
import {
  createProduct,
  productFormSchema,
  productKeys,
  updateProduct,
  type ProductInput,
} from "@/lib/admin/products";
import { statsKeys } from "@/lib/admin/stats";
import { DeleteProductsDialog } from "./delete-products-dialog";
import { ImageUploader, type ImageEntry } from "./image-uploader";

interface FormState {
  name: string;
  description: string;
  brand: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  categoryId: string;
  active: boolean;
  featured: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

const NO_CATEGORY = "none";

function initialState(product: AdminProduct | null): FormState {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    brand: product?.brand ?? "",
    sku: product?.sku ?? "",
    price: product ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice
      ? String(product.compareAtPrice)
      : "",
    stock: product ? String(product.stock) : "0",
    categoryId: product?.categoryId ?? NO_CATEGORY,
    active: product?.active ?? true,
    featured: product?.featured ?? false,
  };
}

function initialImages(product: AdminProduct | null): ImageEntry[] {
  return (product?.images ?? []).map((key, index) => ({
    key,
    url: product?.imageUrls[index] ?? "",
  }));
}

export function ProductForm({
  product,
}: Readonly<{ product: AdminProduct | null }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = product !== null;
  const [state, setState] = useState<FormState>(() => initialState(product));
  const [images, setImages] = useState<ImageEntry[]>(() =>
    initialImages(product),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: listCategories,
  });
  const categoryItems = [
    { value: NO_CATEGORY, label: "No category" },
    ...(categories.data ?? []).map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const save = useMutation({
    mutationFn: (input: ProductInput) =>
      product ? updateProduct(product.id, input) : createProduct(input),
    onSuccess: async (saved) => {
      queryClient.setQueryData(productKeys.detail(saved.id), saved);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: statsKeys.all }),
      ]);
      toast.success(editing ? "Product saved" : "Product added");
      if (!editing) router.push("/admin/products");
    },
    onError: notifyError,
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = productFormSchema.safeParse(state);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Check the highlighted fields");
      return;
    }
    setErrors({});
    const value = parsed.data;
    save.mutate({
      name: value.name,
      description: value.description,
      price: value.price,
      compareAtPrice:
        value.compareAtPrice === "" ? null : Number(value.compareAtPrice),
      stock: value.stock,
      sku: value.sku === "" ? null : value.sku,
      brand: value.brand === "" ? null : value.brand,
      images: images.map((image) => image.key),
      featured: value.featured,
      active: value.active,
      categoryId: value.categoryId === NO_CATEGORY ? null : value.categoryId,
    });
  }

  const price = Number(state.price);
  const compare = Number(state.compareAtPrice);
  const saving =
    /^\d+$/.test(state.price) &&
    /^\d+$/.test(state.compareAtPrice) &&
    compare > price
      ? compare - price
      : null;
  const invalid = (key: keyof FormState) => (errors[key] ? true : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-3 w-fit"
          nativeButton={false}
          render={<Link href="/admin/products" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Products
        </Button>
        <PageHeader
          title={editing ? product.name : "New product"}
          description={
            editing
              ? "Changes appear in the store as soon as you save."
              : "Add the details, photos and price. You can edit everything later."
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={invalid("name")}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    value={state.name}
                    onChange={(event) => set("name", event.target.value)}
                    aria-invalid={invalid("name")}
                    autoComplete="off"
                  />
                  <FieldError>{errors.name}</FieldError>
                </Field>
                <Field data-invalid={invalid("description")}>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    rows={5}
                    value={state.description}
                    onChange={(event) => set("description", event.target.value)}
                    aria-invalid={invalid("description")}
                  />
                  <FieldError>{errors.description}</FieldError>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={invalid("brand")}>
                    <FieldLabel htmlFor="brand">Brand</FieldLabel>
                    <Input
                      id="brand"
                      value={state.brand}
                      onChange={(event) => set("brand", event.target.value)}
                      aria-invalid={invalid("brand")}
                      autoComplete="off"
                    />
                    <FieldError>{errors.brand}</FieldError>
                  </Field>
                  <Field data-invalid={invalid("sku")}>
                    <FieldLabel htmlFor="sku">SKU</FieldLabel>
                    <Input
                      id="sku"
                      value={state.sku}
                      onChange={(event) => set("sku", event.target.value)}
                      aria-invalid={invalid("sku")}
                      autoComplete="off"
                    />
                    <FieldError>{errors.sku}</FieldError>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Shoppers see the main photo first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                images={images}
                onChange={(update) => setImages(update)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Price and stock</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={invalid("price")}>
                    <FieldLabel htmlFor="price">Price</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>₦</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="price"
                        inputMode="numeric"
                        value={state.price}
                        onChange={(event) => set("price", event.target.value)}
                        aria-invalid={invalid("price")}
                      />
                    </InputGroup>
                    <FieldError>{errors.price}</FieldError>
                  </Field>
                  <Field data-invalid={invalid("compareAtPrice")}>
                    <FieldLabel htmlFor="compare">Compare-at price</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>₦</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="compare"
                        inputMode="numeric"
                        value={state.compareAtPrice}
                        onChange={(event) =>
                          set("compareAtPrice", event.target.value)
                        }
                        aria-invalid={invalid("compareAtPrice")}
                      />
                    </InputGroup>
                    <FieldDescription>
                      {saving
                        ? `Shoppers see "Save ${formatNaira(saving)}".`
                        : "Optional. Shows the old price crossed out."}
                    </FieldDescription>
                    <FieldError>{errors.compareAtPrice}</FieldError>
                  </Field>
                </div>
                <Field data-invalid={invalid("stock")} className="sm:max-w-xs">
                  <FieldLabel htmlFor="stock">Units in stock</FieldLabel>
                  <Input
                    id="stock"
                    inputMode="numeric"
                    value={state.stock}
                    onChange={(event) => set("stock", event.target.value)}
                    aria-invalid={invalid("stock")}
                  />
                  <FieldError>{errors.stock}</FieldError>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Field orientation="horizontal">
                <Switch
                  id="active"
                  checked={state.active}
                  onCheckedChange={(checked) => set("active", checked)}
                />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="active">Visible in the store</FieldLabel>
                  <FieldDescription>
                    Hidden products stay in your list.
                  </FieldDescription>
                </div>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="featured"
                  checked={state.featured}
                  onCheckedChange={(checked) => set("featured", checked)}
                />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="featured">Featured</FieldLabel>
                  <FieldDescription>Shown on the home page.</FieldDescription>
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Select
                  items={categoryItems}
                  value={state.categoryId}
                  onValueChange={(value) =>
                    set("categoryId", value ?? NO_CATEGORY)
                  }
                >
                  <SelectTrigger id="category" className="w-full">
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
              </Field>
            </CardContent>
          </Card>

          {editing ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete product
            </Button>
          ) : null}
        </div>
      </div>

      <div className="border-border bg-background sticky bottom-0 -mx-4 flex justify-end gap-2 border-t px-4 py-3 md:-mx-8 md:px-8">
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/products" />}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving" : editing ? "Save changes" : "Add product"}
        </Button>
      </div>

      {product ? (
        <DeleteProductsDialog
          target={
            confirmDelete ? { ids: [product.id], label: product.name } : null
          }
          onOpenChange={setConfirmDelete}
          onDeleted={() => router.push("/admin/products")}
        />
      ) : null}
    </form>
  );
}
