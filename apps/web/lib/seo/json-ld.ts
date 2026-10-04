import {
  isPlaceholderWhatsApp,
  type PublicProduct,
  type PublicProductDetail,
  type PublicSettings,
} from "@repo/types";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "./site";

export type JsonLd = Record<string, unknown>;

export function organizationJsonLd(settings: PublicSettings): JsonLd {
  const hasPhone = !isPlaceholderWhatsApp(settings.whatsappNumber);
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": absoluteUrl("/#store"),
    name: settings.storeName || SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    image: absoluteUrl("/opengraph-image"),
    slogan: SITE_TAGLINE,
    knowsAbout: [
      "Smartphones",
      "Smartwatches",
      "Earbuds",
      "Phone chargers",
      "Power banks",
      "Phone accessories",
    ],
    areaServed: { "@type": "Country", name: "Nigeria" },
    currenciesAccepted: "NGN",
    ...(hasPhone ? { telephone: `+${settings.whatsappNumber}` } : {}),
    ...(settings.supportEmail ? { email: settings.supportEmail } : {}),
    ...(settings.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            addressCountry: "NG",
          },
        }
      : {}),
    ...(settings.openingHours ? { openingHours: settings.openingHours } : {}),
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: "en-NG",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/shop")}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  trail: ReadonlyArray<{ name: string; path: string }>,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product: PublicProductDetail): JsonLd {
  const url = absoluteUrl(`/product/${product.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    url,
    ...(product.description ? { description: product.description } : {}),
    ...(product.imageUrls.length > 0 ? { image: product.imageUrls } : {}),
    ...(product.brand
      ? { brand: { "@type": "Brand", name: product.brand } }
      : {}),
    ...(product.category ? { category: product.category.name } : {}),
    sku: product.id,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "NGN",
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@id": absoluteUrl("/#store") },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "NG",
        },
      },
    },
  };
}

export function itemListJsonLd(
  name: string,
  products: ReadonlyArray<PublicProduct>,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/product/${product.slug}`),
      name: product.name,
    })),
  };
}
