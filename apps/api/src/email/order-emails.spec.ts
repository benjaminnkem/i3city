import {
  customerConfirmationEmail,
  customerShippedEmail,
  ownerNewOrderEmail,
  type OrderEmailData,
} from "./order-emails.js";

const order: OrderEmailData = {
  code: "I3-ABC234",
  customerName: "Ada <script>",
  phone: "0801 234 5678",
  email: "ada@example.com",
  address: "12 Allen Avenue",
  city: "Ikeja",
  state: "Lagos",
  note: null,
  items: [{ name: "Nova X5", quantity: 2, price: 148000 }],
  subtotal: 296000,
  shippingFee: 0,
  total: 296000,
  paymentMethod: "WHATSAPP",
};

describe("order emails", () => {
  it("tells the owner who ordered what and where it goes", () => {
    const email = ownerNewOrderEmail(order, "https://shop.test/admin/orders/1");
    expect(email.subject).toBe("New order I3-ABC234, ₦296,000");
    expect(email.text).toContain("2 x Nova X5 (₦296,000)");
    expect(email.text).toContain("12 Allen Avenue, Ikeja, Lagos");
    expect(email.text).toContain("https://shop.test/admin/orders/1");
  });

  it("escapes customer text in the html version", () => {
    const email = customerConfirmationEmail(
      order,
      "i3City",
      "https://shop.test/order/I3-ABC234",
    );
    expect(email.html).toContain("Ada &lt;script&gt;");
    expect(email.html).not.toContain("<script>");
  });

  it("includes courier details in the shipped notice", () => {
    const email = customerShippedEmail(
      order,
      "i3City",
      "https://shop.test/o",
      "GIG Logistics",
      "GIG123",
    );
    expect(email.text).toContain("Courier: GIG Logistics");
    expect(email.text).toContain("Tracking number: GIG123");
  });
});
