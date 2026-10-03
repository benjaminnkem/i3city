import Link from "next/link";
import { fetchCategories, fetchSettings } from "@/lib/store/api";
import { whatsappLink } from "@/lib/store/whatsapp";

export async function StoreFooter() {
  const [settings, categories] = await Promise.all([
    fetchSettings().catch(() => null),
    fetchCategories().catch(() => []),
  ]);
  return (
    <footer className="bg-muted text-muted-foreground mt-16">
      <div className="mx-auto grid w-full max-w-page gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4 md:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-foreground text-2xl font-extrabold tracking-tight">
            i3<span className="text-primary">city</span>
          </p>
          <p className="max-w-[30ch]">
            Phones, accessories and gadgets, delivered across Nigeria.
          </p>
        </div>
        <nav aria-label="Shop" className="flex flex-col">
          <h2 className="text-foreground font-bold">Shop</h2>
          <Link
            href="/shop"
            className="hover:text-primary flex min-h-11 items-center"
          >
            All products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="hover:text-primary flex min-h-11 items-center"
            >
              {category.name}
            </Link>
          ))}
        </nav>
        <nav aria-label="Help" className="flex flex-col">
          <h2 className="text-foreground font-bold">Help</h2>
          <Link
            href="/track"
            className="hover:text-primary flex min-h-11 items-center"
          >
            Track your order
          </Link>
          <Link
            href="/cart"
            className="hover:text-primary flex min-h-11 items-center"
          >
            Your cart
          </Link>
          <Link
            href="/delivery-policy"
            className="hover:text-primary flex min-h-11 items-center"
          >
            Delivery policy
          </Link>
          <Link
            href="/returns-policy"
            className="hover:text-primary flex min-h-11 items-center"
          >
            Returns policy
          </Link>
          <Link
            href="/privacy"
            className="hover:text-primary flex min-h-11 items-center"
          >
            Privacy policy
          </Link>
          {settings?.supportEmail ? (
            <a
              href={`mailto:${settings.supportEmail}`}
              className="hover:text-primary flex min-h-11 items-center"
            >
              {settings.supportEmail}
            </a>
          ) : null}
        </nav>
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground font-bold">Visit the store</h2>
          <address className="text-foreground not-italic">
            {settings?.storeName ?? "i3City"}
            <br />
            {settings?.address ?? "Egbeda, Ibadan, Oyo State"}
          </address>
          {settings?.openingHours ? <p>{settings.openingHours}</p> : null}
          {settings ? (
            <a
              href={whatsappLink(
                settings.whatsappNumber,
                "Hello, I have a question.",
              )}
              className="bg-primary text-primary-foreground mt-2 inline-flex h-11 w-fit items-center rounded-pill px-5 font-bold"
            >
              Chat on WhatsApp
            </a>
          ) : null}
        </div>
      </div>
      <div className="border-border border-t">
        <div className="mx-auto flex w-full max-w-page flex-col justify-between gap-1 px-4 py-4 text-sm sm:flex-row md:px-8">
          <span>
            © {new Date().getFullYear()} i3City. Prices in Nigerian naira.
          </span>
          <span>Pay by transfer or card, arranged on WhatsApp</span>
        </div>
      </div>
    </footer>
  );
}
