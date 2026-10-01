import { buildOrderMessage, whatsappLink } from "./whatsapp.js";

const order = {
  code: "I3-ABC234",
  customerName: "Ada Obi",
  items: [
    { name: "Nova X5", quantity: 1, price: 148000 },
    { name: "Armor case", quantity: 2, price: 6500 },
  ],
  subtotal: 161000,
  shippingFee: 3500,
  total: 164500,
  address: "12 Allen Avenue",
  city: "Ikeja",
  state: "Lagos",
  trackingUrl: "https://shop.test/order/I3-ABC234",
};

describe("whatsapp order message", () => {
  it("lists items, totals, the delivery address and a tracking link", () => {
    const message = buildOrderMessage(order);
    expect(message).toContain("order I3-ABC234");
    expect(message).toContain("- 2 x Armor case (₦13,000)");
    expect(message).toContain("Subtotal: ₦161,000");
    expect(message).toContain("Delivery: ₦3,500");
    expect(message).toContain("Total: ₦164,500");
    expect(message).toContain("12 Allen Avenue, Ikeja, Lagos");
    expect(message).toContain("https://shop.test/order/I3-ABC234");
  });

  it("builds a wa.me link with the international number and an encoded message", () => {
    const link = whatsappLink("2348012345678", "Hi there & welcome");
    expect(link).toBe(
      "https://wa.me/2348012345678?text=Hi%20there%20%26%20welcome",
    );
  });

  it("strips a leading plus from the number", () => {
    expect(whatsappLink("+2348012345678", "x")).toBe(
      "https://wa.me/2348012345678?text=x",
    );
  });
});
