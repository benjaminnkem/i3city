"use client";

import {
  HERO_LIMITS,
  HERO_TONES,
  type AdminHeroSlide,
  type HeroSlideInput,
  type HeroSlideKind,
  type HeroSlideProduct,
  type HeroTone,
} from "@repo/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { HERO_TONE_CLASS } from "@/components/store/hero/hero-link";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { notifyError } from "@/lib/admin/errors";
import {
  createHeroSlide,
  heroFormSchema,
  heroKeys,
  updateHeroSlide,
} from "@/lib/admin/hero";
import { cn } from "@/lib/utils";
import { DeleteHeroDialog, type HeroDeleteTarget } from "./delete-hero-dialog";
import { HeroImageField, type HeroImage } from "./hero-image-field";
import { HeroLinkField } from "./hero-link-field";
import { HeroPreview } from "./hero-preview";
import { HeroProductPicker } from "./hero-product-picker";

interface FormState {
  kind: HeroSlideKind;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  image: HeroImage | null;
  imageAlt: string;
  products: HeroSlideProduct[];
  tone: HeroTone | null;
  active: boolean;
  startDate: string;
  endDate: string;
}

type ErrorKey =
  | "headline"
  | "subtext"
  | "ctaLabel"
  | "ctaHref"
  | "image"
  | "imageAlt"
  | "productIds"
  | "startDate"
  | "endDate";

type Errors = Partial<Record<ErrorKey, string>>;

const NO_TONE = "none";

const TONE_LABEL: Record<HeroTone, string> = {
  1: "Lilac",
  2: "Pink",
  3: "Periwinkle",
  4: "Peach",
};

function initialState(slide: AdminHeroSlide | null): FormState {
  if (!slide) {
    return {
      kind: "PRODUCTS",
      headline: "",
      subtext: "",
      ctaLabel: "Shop now",
      ctaHref: "/shop",
      image: null,
      imageAlt: "",
      products: [],
      tone: null,
      active: true,
      startDate: "",
      endDate: "",
    };
  }
  return {
    kind: slide.kind,
    headline: slide.headline,
    subtext: slide.subtext,
    ctaLabel: slide.ctaLabel,
    ctaHref: slide.ctaHref,
    image:
      slide.image && slide.imageUrl
        ? { key: slide.image, url: slide.imageUrl }
        : null,
    imageAlt: slide.imageAlt,
    products: slide.products,
    tone: slide.tone,
    active: slide.active,
    startDate: slide.startDate ?? "",
    endDate: slide.endDate ?? "",
  };
}

function toInput(state: FormState): HeroSlideInput {
  return {
    kind: state.kind,
    headline: state.headline.trim(),
    subtext: state.subtext.trim(),
    ctaLabel: state.ctaLabel.trim(),
    ctaHref: state.ctaHref.trim(),
    image: state.kind === "IMAGE" ? (state.image?.key ?? null) : null,
    imageAlt: state.kind === "IMAGE" ? state.imageAlt.trim() : "",
    productIds:
      state.kind === "PRODUCTS"
        ? state.products.map((product) => product.id)
        : [],
    tone: state.tone,
    active: state.active,
    startDate: state.startDate || null,
    endDate: state.endDate || null,
  };
}

function isErrorKey(key: unknown): key is ErrorKey {
  return (
    key === "headline" ||
    key === "subtext" ||
    key === "ctaLabel" ||
    key === "ctaHref" ||
    key === "image" ||
    key === "imageAlt" ||
    key === "productIds" ||
    key === "startDate" ||
    key === "endDate"
  );
}

export function HeroForm({
  slide,
}: Readonly<{ slide: AdminHeroSlide | null }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<FormState>(() => initialState(slide));
  const [errors, setErrors] = useState<Errors>({});
  const [deleting, setDeleting] = useState<HeroDeleteTarget | null>(null);
  const editing = slide !== null;

  const save = useMutation({
    mutationFn: (input: HeroSlideInput) =>
      slide ? updateHeroSlide(slide.id, input) : createHeroSlide(input),
    onSuccess: async (saved) => {
      queryClient.setQueryData(heroKeys.detail(saved.id), saved);
      await queryClient.invalidateQueries({ queryKey: heroKeys.all });
      toast.success(editing ? "Slide saved" : "Slide added");
      if (!editing) router.push("/admin/hero");
    },
    onError: notifyError,
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
    const errorKey = key === "products" ? "productIds" : key;
    if (isErrorKey(errorKey)) {
      setErrors((current) => ({ ...current, [errorKey]: undefined }));
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toInput(state);
    const parsed = heroFormSchema.safeParse({
      ...input,
      startDate: state.startDate,
      endDate: state.endDate,
    });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (isErrorKey(key) && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Check the highlighted fields");
      return;
    }
    setErrors({});
    save.mutate(input);
  }

  const invalid = (key: ErrorKey) => (errors[key] ? true : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <PageHeader
        title={editing ? "Edit slide" : "New slide"}
        description="One slide of the hero at the top of the home page."
        actions={
          <>
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/admin/hero" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              All slides
            </Button>
            {slide ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  setDeleting({ id: slide.id, headline: slide.headline })
                }
              >
                <Trash2Icon data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            How the slide looks on a large screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HeroPreview
            content={{
              kind: state.kind,
              headline: state.headline,
              subtext: state.subtext,
              ctaLabel: state.ctaLabel,
              ctaHref: state.ctaHref,
              imageUrl: state.image?.url ?? null,
              imageAlt: state.imageAlt,
              tone: state.tone,
              products: state.products,
            }}
          />
        </CardContent>
      </Card>

      <div className="flex max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Slide type</CardTitle>
            <CardDescription>
              Show products from your store, or upload your own banner artwork.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              variant="outline"
              value={[state.kind]}
              onValueChange={(value) => {
                const next = value[0];
                if (next === "PRODUCTS" || next === "IMAGE") set("kind", next);
              }}
              aria-label="Slide type"
            >
              <ToggleGroupItem value="PRODUCTS">Products</ToggleGroupItem>
              <ToggleGroupItem value="IMAGE">Banner image</ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Words</CardTitle>
            <CardDescription>
              Keep the headline short. It is shown very large.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={invalid("headline")}>
                <FieldLabel htmlFor="headline">Headline</FieldLabel>
                <Input
                  id="headline"
                  value={state.headline}
                  maxLength={HERO_LIMITS.headline}
                  placeholder="Black Friday deals on earbuds"
                  onChange={(event) => set("headline", event.target.value)}
                  aria-invalid={invalid("headline")}
                />
                <FieldError>{errors.headline}</FieldError>
              </Field>
              <Field data-invalid={invalid("subtext")}>
                <FieldLabel htmlFor="subtext">Supporting line</FieldLabel>
                <Textarea
                  id="subtext"
                  rows={2}
                  value={state.subtext}
                  maxLength={HERO_LIMITS.subtext}
                  onChange={(event) => set("subtext", event.target.value)}
                  aria-invalid={invalid("subtext")}
                />
                <FieldDescription>Optional.</FieldDescription>
                <FieldError>{errors.subtext}</FieldError>
              </Field>
              <Field data-invalid={invalid("ctaLabel")}>
                <FieldLabel htmlFor="ctaLabel">Button text</FieldLabel>
                <Input
                  id="ctaLabel"
                  value={state.ctaLabel}
                  maxLength={HERO_LIMITS.ctaLabel}
                  onChange={(event) => set("ctaLabel", event.target.value)}
                  aria-invalid={invalid("ctaLabel")}
                />
                <FieldError>{errors.ctaLabel}</FieldError>
              </Field>
              <HeroLinkField
                value={state.ctaHref}
                error={errors.ctaHref}
                onChange={(value) => set("ctaHref", value)}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        {state.kind === "PRODUCTS" ? (
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Pick up to {HERO_LIMITS.products}. The first one is shown
                largest. Hidden products are skipped on the store.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <HeroProductPicker
                selected={state.products}
                onChange={(products) => set("products", products)}
              />
              {errors.productIds ? (
                <p role="alert" className="text-destructive text-small">
                  {errors.productIds}
                </p>
              ) : null}
              <Field>
                <FieldLabel>Background</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  value={[state.tone === null ? NO_TONE : String(state.tone)]}
                  onValueChange={(value) => {
                    const next = Number(value[0]);
                    const tone = HERO_TONES.find((item) => item === next);
                    set("tone", tone ?? null);
                  }}
                  aria-label="Background"
                  className="flex-wrap"
                >
                  <ToggleGroupItem value={NO_TONE}>None</ToggleGroupItem>
                  {HERO_TONES.map((tone) => (
                    <ToggleGroupItem key={tone} value={String(tone)}>
                      <span
                        aria-hidden
                        className={cn(
                          "border-border size-4 rounded-pill border",
                          HERO_TONE_CLASS[tone],
                        )}
                      />
                      {TONE_LABEL[tone]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Banner image</CardTitle>
              <CardDescription>
                The headline and button sit on a card over the image.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <HeroImageField
                  image={state.image}
                  invalid={invalid("image")}
                  onChange={(image) => set("image", image)}
                />
                {errors.image ? (
                  <p role="alert" className="text-destructive text-small">
                    {errors.image}
                  </p>
                ) : null}
                <Field data-invalid={invalid("imageAlt")}>
                  <FieldLabel htmlFor="imageAlt">Image description</FieldLabel>
                  <Input
                    id="imageAlt"
                    value={state.imageAlt}
                    maxLength={HERO_LIMITS.imageAlt}
                    placeholder="Three phones in clear cases on a white table"
                    onChange={(event) => set("imageAlt", event.target.value)}
                    aria-invalid={invalid("imageAlt")}
                  />
                  <FieldDescription>
                    Read aloud to customers using screen readers. Describe what
                    is in the picture.
                  </FieldDescription>
                  <FieldError>{errors.imageAlt}</FieldError>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>When it shows</CardTitle>
            <CardDescription>
              Dates use Lagos time. Leave them empty to show the slide until you
              turn it off.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <Switch
                  id="active"
                  checked={state.active}
                  onCheckedChange={(checked) => set("active", checked)}
                />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="active">Show this slide</FieldLabel>
                  <FieldDescription>
                    Turn it off to hide it without deleting it.
                  </FieldDescription>
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={invalid("startDate")}>
                  <FieldLabel htmlFor="startDate">From</FieldLabel>
                  <Input
                    id="startDate"
                    type="date"
                    value={state.startDate}
                    onChange={(event) => set("startDate", event.target.value)}
                    aria-invalid={invalid("startDate")}
                  />
                  <FieldError>{errors.startDate}</FieldError>
                </Field>
                <Field data-invalid={invalid("endDate")}>
                  <FieldLabel htmlFor="endDate">Until the end of</FieldLabel>
                  <Input
                    id="endDate"
                    type="date"
                    value={state.endDate}
                    min={state.startDate || undefined}
                    onChange={(event) => set("endDate", event.target.value)}
                    aria-invalid={invalid("endDate")}
                  />
                  <FieldError>{errors.endDate}</FieldError>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <div>
          <Button type="submit" size="lg" disabled={save.isPending}>
            {save.isPending ? "Saving" : editing ? "Save slide" : "Add slide"}
          </Button>
        </div>
      </div>

      <DeleteHeroDialog
        target={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => router.push("/admin/hero")}
      />
    </form>
  );
}
