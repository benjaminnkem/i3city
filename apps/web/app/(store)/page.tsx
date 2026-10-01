import { formatNaira } from "@repo/types";
import { TruckIcon, WalletCardsIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { ProductImage } from "@/components/store/product-image";
import { Container, SectionHeading } from "@/components/store/section";
import { fetchCategories, fetchProducts, fetchSettings } from "@/lib/store/api";
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
  const hero =
    featured.items.find((product) => product.imageUrls.length > 0) ??
    featured.items[0];
  const shownCategories = categories.slice(0, 6);

  return (
    <>
      <Container className="pt-6">
        <section
          aria-label="Welcome"
          className="bg-tone-1 grid items-center gap-8 overflow-hidden rounded-lg md:grid-cols-[1.1fr_1fr]"
        >
          <div className="flex flex-col gap-5 p-6 md:p-14">
            <h1 className="text-h1 max-w-[11ch] font-extrabold">
              Gadgets that earn their place.
            </h1>
            <p className="text-muted-foreground max-w-[34ch] text-lg">
              Phones, audio and everyday accessories, delivered anywhere in
              Nigeria.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/shop" />}
              >
                Shop all products
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={whatsappLink(
                      settings.whatsappNumber,
                      "Hello, I have a question.",
                    )}
                  />
                }
              >
                Ask on WhatsApp
              </Button>
            </div>
          </div>
          {hero ? (
            <Link
              href={`/product/${hero.slug}`}
              className="bg-tone-2 relative m-6 mt-0 flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-md p-5 md:m-8 md:ml-0"
            >
              <ProductImage
                src={hero.imageUrls[0]}
                alt={hero.name}
                sizes="(min-width: 768px) 40vw, 90vw"
                priority
              />
              <div className="bg-background/95 relative w-fit rounded-md px-4 py-3 shadow-sm">
                <p className="font-extrabold">{hero.name}</p>
                <p className="price text-primary font-bold">
                  {formatNaira(hero.price)}
                </p>
              </div>
            </Link>
          ) : null}
        </section>
      </Container>

      {shownCategories.length > 0 ? (
        <Container className="pt-14">
          <SectionHeading
            title="Shop by category"
            href="/shop"
            linkLabel="All products"
          />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {shownCategories.map((category, index) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className={cn(
                    "flex min-h-32 flex-col justify-end gap-1 rounded-md p-5 transition-transform hover:-translate-y-0.5 md:min-h-40",
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
              </li>
            ))}
          </ul>
        </Container>
      ) : null}

      {featured.items.length > 0 ? (
        <Container className="pt-14">
          <SectionHeading title="Featured" href="/shop" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
            {featured.items.slice(0, 4).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </Container>
      ) : null}

      <Container className="pt-14">
        <section
          aria-label="Delivery and support"
          className="bg-muted grid gap-6 rounded-lg p-6 md:grid-cols-3 md:p-10"
        >
          <div className="flex gap-4">
            <TruckIcon className="text-primary size-7 shrink-0" />
            <div>
              <h2 className="font-extrabold">Delivery to every state</h2>
              <p className="text-muted-foreground">
                {settings.freeShippingOver
                  ? `Free shipping on orders above ${formatNaira(settings.freeShippingOver)}.`
                  : "See the fee for your state at checkout."}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <WalletCardsIcon className="text-primary size-7 shrink-0" />
            <div>
              <h2 className="font-extrabold">Pay your way</h2>
              <p className="text-muted-foreground">
                We confirm your order and share payment details on WhatsApp.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <MessageCircleIcon className="text-primary size-7 shrink-0" />
            <div>
              <h2 className="font-extrabold">Real people on chat</h2>
              <p className="text-muted-foreground">
                Ask about stock, photos or delivery before you buy.
              </p>
            </div>
          </div>
        </section>
      </Container>

      {latest.items.length > 0 ? (
        <Container className="pt-14">
          <SectionHeading title="New arrivals" href="/shop?sort=newest" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
            {latest.items.slice(0, 8).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </Container>
      ) : null}

      {featured.items.length === 0 && latest.items.length === 0 ? (
        <Container className="py-24 text-center">
          <h2 className="text-h2 font-extrabold">Products are on their way</h2>
          <p className="text-muted-foreground mt-2">
            Check back soon, or message us on WhatsApp.
          </p>
        </Container>
      ) : null}
    </>
  );
}
