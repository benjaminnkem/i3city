import { topProducts } from "./top-products.js";

describe("topProducts", () => {
  it("adds up units and revenue per product and ranks by revenue", () => {
    const result = topProducts(
      [
        { name: "Cable", price: 3000, quantity: 2 },
        { name: "Phone", price: 100000, quantity: 1 },
        { name: "Cable", price: 3000, quantity: 1 },
        { name: "Case", price: 6000, quantity: 1 },
      ],
      2,
    );
    expect(result).toEqual([
      { name: "Phone", units: 1, revenue: 100000 },
      { name: "Cable", units: 3, revenue: 9000 },
    ]);
  });

  it("returns nothing when there are no sales", () => {
    expect(topProducts([], 5)).toEqual([]);
  });
});
