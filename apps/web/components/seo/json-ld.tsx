import type { JsonLd } from "@/lib/seo/json-ld";

export function JsonLdScript({ data }: Readonly<{ data: JsonLd | JsonLd[] }>) {
  const payload = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data }
    : { "@context": "https://schema.org", ...data };
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
