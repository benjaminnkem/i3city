import { TrackForm } from "@/components/store/track-form";
import { Container } from "@/components/store/section";

export const metadata = { title: "Track your order", robots: { index: false } };

export default function TrackPage() {
  return (
    <Container className="max-w-3xl py-10">
      <h1 className="text-h2 mb-2 font-extrabold">Track your order</h1>
      <p className="text-muted-foreground mb-6">
        See where your order is, and who is delivering it.
      </p>
      <TrackForm />
    </Container>
  );
}
