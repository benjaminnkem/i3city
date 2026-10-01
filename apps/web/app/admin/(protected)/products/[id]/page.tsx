import { ProductEditor } from "@/components/admin/products/product-editor";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <ProductEditor productId={id} />;
}
