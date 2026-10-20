import type { HeroSlideProduct, HeroSlideKind, HeroTone } from "@repo/types";
import { HeroImageSlide } from "@/components/store/hero/hero-image-slide";
import { HeroProductsSlide } from "@/components/store/hero/hero-products-slide";

const PREVIEW_WHATSAPP_HREF = "https://wa.me/";

export interface HeroPreviewContent {
  kind: HeroSlideKind;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  imageAlt: string;
  tone: HeroTone | null;
  products: HeroSlideProduct[];
}

export function HeroPreview({
  content,
}: Readonly<{ content: HeroPreviewContent }>) {
  const slide = {
    ...content,
    headline: content.headline.trim() || "Your headline",
    ctaLabel: content.ctaLabel.trim() || "Button",
    subtext: content.subtext.trim(),
  };
  return (
    <div inert className="pointer-events-none select-none">
      {slide.kind === "IMAGE" ? (
        <HeroImageSlide
          slide={{ ...slide, id: "preview", products: [] }}
          whatsappHref={PREVIEW_WHATSAPP_HREF}
          first={false}
        />
      ) : (
        <HeroProductsSlide
          slide={slide}
          whatsappHref={PREVIEW_WHATSAPP_HREF}
          first={false}
        />
      )}
    </div>
  );
}
