import { formatNaira, LOW_STOCK_THRESHOLD } from "@repo/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircleIcon } from "lucide-react";
import { AddToCart } from "@/components/store/add-to-cart";
import { ProductCard } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Container, SectionHeading } from "@/components/store/section";
import { ShareButton } from "@/components/store/share-button";
import { StickyBuyBar } from "@/components/store/sticky-buy-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";
import { fetchProduct, fetchSettings } from "@/lib/store/api";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { trimDescription } from "@/lib/seo/site";
import { whatsappLink } from "@/lib/store/whatsapp";

export const dynamic = "force-dynamic";

type Props = Readonly<{ params: Promise<{ slug: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return {};
  const description =
    trimDescription(product.description) ||
    `Buy ${product.name} for ${formatNaira(product.price)}. Delivered across Nigeria.`;
  const images = product.imageUrls.slice(0, 1);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `/product/${product.slug}`,
      ...(images.length > 0 ? { images } : {}),
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title: product.name,
      description,
      ...(images.length > 0 ? { images } : {}),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    fetchProduct(slug),
    fetchSettings(),
  ]);
  if (!product) notFound();

  const cartProduct = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrls[0] ?? null,
    stock: product.stock,
  };
  const saving = product.compareAtPrice
    ? product.compareAtPrice - product.price
    : 0;
  const pageUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`;
  const ask = whatsappLink(
    settings.whatsappNumber,
    `Hello, I'm interested in ${product.name}.\n${pageUrl}`,
  );

  return (
    <Container className="pt-6 pb-24 md:pb-8">
      <JsonLdScript
        data={[
          productJsonLd(product),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            ...(product.category
              ? [
                  {
                    name: product.category.name,
                    path: `/category/${product.category.slug}`,
                  },
                ]
              : []),
            { name: product.name, path: `/product/${product.slug}` },
          ]),
        ]}
      />
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mb-2 flex flex-wrap items-center gap-x-2 text-sm"
      >
        <Link
          href="/shop"
          className="hover:text-primary inline-flex min-h-11 items-center"
        >
          Shop
        </Link>
        {product.category ? (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-primary inline-flex min-h-11 items-center"
            >
              {product.category.name}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.imageUrls} name={product.name} />
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            {product.brand ? (
              <span className="text-muted-foreground">{product.brand}</span>
            ) : null}
            <h1 className="text-h2 font-extrabold">{product.name}</h1>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="price text-primary text-3xl font-extrabold">
              {formatNaira(product.price)}
            </span>
            {product.compareAtPrice ? (
              <span className="price text-muted-foreground text-lg line-through">
                {formatNaira(product.compareAtPrice)}
              </span>
            ) : null}
            {saving > 0 ? <Badge>Save {formatNaira(saving)}</Badge> : null}
          </div>

          <p className="font-bold">
            {product.stock === 0 ? (
              <span className="text-muted-foreground">Out of stock</span>
            ) : product.stock <= LOW_STOCK_THRESHOLD ? (
              <span className="text-warning">Only {product.stock} left</span>
            ) : (
              <span className="text-success">In stock</span>
            )}
          </p>

          <AddToCart product={cartProduct} className="max-w-md" />

          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={ask} />}
            >
              <MessageCircleIcon data-icon="inline-start" />
              Ask on WhatsApp
            </Button>
            <ShareButton title={product.name} />
          </div>

          <p className="text-muted-foreground">
            Delivery to every state. See your fee and delivery time at checkout.
          </p>

          {product.description ? (
            <section
              aria-labelledby="about"
              className="border-border border-t pt-5"
            >
              <h2 id="about" className="mb-2 font-extrabold">
                About this product
              </h2>
              <p className="text-muted-foreground max-w-prose whitespace-pre-line">
                {product.description}
              </p>
            </section>
          ) : null}
        </div>
      </div>

      {product.related.length > 0 ? (
        <section className="pt-14" aria-label="Related products">
          <SectionHeading title="You may also like" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {product.related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      <StickyBuyBar product={cartProduct} />
    </Container>
  );
}
