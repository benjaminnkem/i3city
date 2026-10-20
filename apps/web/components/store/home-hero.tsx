import type { PublicHeroSlide, PublicProduct } from "@repo/types";
import { HeroCarousel } from "./hero/hero-carousel";
import { HeroImageSlide } from "./hero/hero-image-slide";
import { HeroProductsSlide, toTileProduct } from "./hero/hero-products-slide";

function Slide({
  slide,
  whatsappHref,
  first,
}: Readonly<{
  slide: PublicHeroSlide;
  whatsappHref: string;
  first: boolean;
}>) {
  return slide.kind === "IMAGE" ? (
    <HeroImageSlide slide={slide} whatsappHref={whatsappHref} first={first} />
  ) : (
    <HeroProductsSlide
      slide={{ ...slide, products: slide.products.map(toTileProduct) }}
      whatsappHref={whatsappHref}
      first={first}
    />
  );
}

export function HomeHero({
  slides,
  fallbackProducts,
  whatsappHref,
}: Readonly<{
  slides: PublicHeroSlide[];
  fallbackProducts: PublicProduct[];
  whatsappHref: string;
}>) {
  const [only] = slides;
  if (slides.length === 0 || !only) {
    return (
      <section aria-label="Welcome">
        <HeroProductsSlide
          first
          whatsappHref={whatsappHref}
          slide={{
            headline: "Gadgets that earn their place.",
            subtext:
              "Phones, audio and everyday accessories, delivered anywhere in Nigeria.",
            ctaLabel: "Shop all products",
            ctaHref: "/shop",
            tone: null,
            products: fallbackProducts.map(toTileProduct),
          }}
        />
      </section>
    );
  }
  if (slides.length === 1) {
    return (
      <section aria-label="Welcome">
        <Slide slide={only} whatsappHref={whatsappHref} first />
      </section>
    );
  }
  return (
    <HeroCarousel
      labels={slides.map((slide) => slide.headline)}
      slides={slides.map((slide, index) => (
        <Slide
          key={slide.id}
          slide={slide}
          whatsappHref={whatsappHref}
          first={index === 0}
        />
      ))}
    />
  );
}
