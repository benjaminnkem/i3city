import {
  isPlaceholderWhatsApp,
  type PublicProduct,
  type PublicProductDetail,
  type PublicSettings,
} from "@repo/types";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "./site";

export type JsonLd = Record<string, unknown>;

const RETURN_DAYS = 3;

function money(amount: number): string {
  return amount.toFixed(2);
}

function transitDays(settings: PublicSettings): { min: number; max: number } {
  const days = settings.shippingRates
    .flatMap((rate) => rate.etaDays?.match(/\d+/g) ?? [])
    .map(Number)
    .filter((day) => day > 0);
  if (days.length === 0) return { min: 1, max: 7 };
  return { min: Math.min(...days), max: Math.max(...days) };
}

export function organizationJsonLd(settings: PublicSettings): JsonLd {
  const hasPhone = !isPlaceholderWhatsApp(settings.whatsappNumber);
  return {
    "@type": "Store",
    "@id": absoluteUrl("/#store"),
    name: settings.storeName || SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    image: absoluteUrl("/opengraph-image"),
    logo: absoluteUrl("/icon"),
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
    paymentAccepted: "Credit Card, Debit Card, Bank Transfer",
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
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: "en-NG",
    description: SITE_DESCRIPTION,
    publisher: { "@id": absoluteUrl("/#store") },
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
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function offerJsonLd(
  product: PublicProductDetail,
  settings: PublicSettings,
): JsonLd {
  const url = absoluteUrl(`/product/${product.slug}`);
  const transit = transitDays(settings);
  return {
    "@type": "Offer",
    url,
    priceCurrency: "NGN",
    price: money(product.price),
    itemCondition: "https://schema.org/NewCondition",
    availability:
      product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    seller: { "@id": absoluteUrl("/#store") },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "NG",
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: RETURN_DAYS,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      merchantReturnLink: absoluteUrl("/returns-policy"),
    },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: money(settings.defaultShippingFee),
        currency: "NGN",
      },
      ...(settings.freeShippingOver !== null
        ? {
            freeShippingThreshold: {
              "@type": "MonetaryAmount",
              value: money(settings.freeShippingOver),
              currency: "NGN",
            },
          }
        : {}),
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "NG",
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: 0,
          maxValue: 1,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: transit.min,
          maxValue: transit.max,
          unitCode: "DAY",
        },
      },
    },
  };
}

export function productJsonLd(
  product: PublicProductDetail,
  settings: PublicSettings,
): JsonLd {
  const url = absoluteUrl(`/product/${product.slug}`);
  return {
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
    sku: product.sku || product.id,
    offers: offerJsonLd(product, settings),
  };
}

export function itemListJsonLd(
  name: string,
  products: ReadonlyArray<PublicProduct>,
): JsonLd {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/product/${product.slug}`),
      name: product.name,
    })),
  };
}

