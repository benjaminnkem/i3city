import type { JsonLd } from "@/lib/seo/json-ld";

export function JsonLdScript({ data }: Readonly<{ data: JsonLd | JsonLd[] }>) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
