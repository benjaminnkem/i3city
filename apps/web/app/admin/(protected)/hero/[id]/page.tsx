import { HeroEditor } from "@/components/admin/hero/hero-editor";

export const metadata = { title: "Edit slide" };

export default async function EditHeroSlidePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <HeroEditor slideId={id} />;
}
