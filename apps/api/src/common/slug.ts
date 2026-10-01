export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

export async function uniqueSlug(
  text: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(text);
  let candidate = base;
  for (let suffix = 2; await exists(candidate); suffix += 1) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
