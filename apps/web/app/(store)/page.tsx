import { formatNaira } from "@repo/types";
import { TruckIcon, WalletCardsIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { HomeHero } from "@/components/store/home-hero";
import { Reveal, RevealItem, Stagger } from "@/components/motion/reveal";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Container, SectionHeading } from "@/components/store/section";
import { fetchCategories, fetchProducts, fetchSettings } from "@/lib/store/api";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { whatsappLink } from "@/lib/store/whatsapp";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TONES = ["bg-tone-1", "bg-tone-2", "bg-tone-3", "bg-tone-4"] as const;

export default async function HomePage() {
  const [settings, categories, featured, latest] = await Promise.all([
    fetchSettings(),
    fetchCategories(),
    fetchProducts({ featured: true, limit: 8 }),
    fetchProducts({ sort: "newest", limit: 8 }),
  ]);
  const heroProducts = [
    ...new Map(
      [...featured.items, ...latest.items].map((product) => [
        product.id,
        product,
      ]),
    ).values(),
  ]
    .sort(
      (a, b) => Number(b.imageUrls.length > 0) - Number(a.imageUrls.length > 0),
    )
    .slice(0, 3);
  const shownCategories = categories.slice(0, 6);

  return (
    <>
      <JsonLdScript data={[organizationJsonLd(settings), websiteJsonLd()]} />
      <Container className="pt-6">
        <HomeHero
          products={heroProducts}
          whatsappHref={whatsappLink(
            settings.whatsappNumber,
            "Hello, I have a question.",
          )}
        />
      </Container>

      {shownCategories.length > 0 ? (
        <Container className="pt-14">
          <SectionHeading
            title="Shop by category"
            href="/shop"
            linkLabel="All products"
          />
          <Stagger as="ul" className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {shownCategories.map((category, index) => (
              <RevealItem as="li" key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className={cn(
                    "flex min-h-32 flex-col justify-end gap-1 rounded-md p-5 transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98] md:min-h-40",
                    TONES[index % TONES.length],
                  )}
                >
                  <span className="text-lg font-extrabold">
                    {category.name}
                  </span>
                  <span className="price text-muted-foreground text-sm">
                    {category.productCount}{" "}
                    {category.productCount === 1 ? "product" : "products"}
                  </span>
                </Link>
              </RevealItem>
            ))}
          </Stagger>
        </Container>
      ) : null}

      {featured.items.length > 0 ? (
        <Container className="pt-14">
          <SectionHeading title="Featured" href="/shop" />
          <Stagger className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
            {featured.items.slice(0, 4).map((product, index) => (
              <RevealItem key={product.id} className="min-w-0">
                <ProductCard product={product} index={index} />
              </RevealItem>
            ))}
          </Stagger>
        </Container>
      ) : null}

      <Container className="pt-14">
        <Stagger
          as="section"
          gap="loose"
          className="bg-muted grid gap-6 rounded-lg p-6 md:grid-cols-3 md:p-10"
        >
          <RevealItem className="flex gap-4">
            <TruckIcon className="text-primary size-7 shrink-0" />
            <div>
              <h2 className="font-extrabold">Delivery to every state</h2>
              <p className="text-muted-foreground">
                {settings.freeShippingOver
                  ? `Free shipping on orders above ${formatNaira(settings.freeShippingOver)}.`
                  : "See the fee for your state at checkout."}
              </p>
            </div>
          </RevealItem>
          <RevealItem className="flex gap-4">
            <WalletCardsIcon className="text-primary size-7 shrink-0" />
            <div>
              <h2 className="font-extrabold">Pay your way</h2>
              <p className="text-muted-foreground">
                We confirm your order and share payment details on WhatsApp.
              </p>
            </div>
          </RevealItem>
          <RevealItem className="flex gap-4">
            <MessageCircleIcon className="text-primary size-7 shrink-0" />
            <div>
              <h2 className="font-extrabold">Real people on chat</h2>
              <p className="text-muted-foreground">
                Ask about stock, photos or delivery before you buy.
              </p>
            </div>
          </RevealItem>
        </Stagger>
      </Container>

      {latest.items.length > 0 ? (
        <Container className="pt-14">
          <SectionHeading title="New arrivals" href="/shop?sort=newest" />
          <Stagger className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
            {latest.items.slice(0, 8).map((product, index) => (
              <RevealItem key={product.id} className="min-w-0">
                <ProductCard product={product} index={index} />
              </RevealItem>
            ))}
          </Stagger>
        </Container>
      ) : null}

      {featured.items.length === 0 && latest.items.length === 0 ? (
        <Container className="py-24 text-center">
          <Reveal>
            <h2 className="text-h2 font-extrabold">
              Products are on their way
            </h2>
            <p className="text-muted-foreground mt-2">
              Check back soon, or message us on WhatsApp.
            </p>
          </Reveal>
        </Container>
      ) : null}
    </>
  );
}
