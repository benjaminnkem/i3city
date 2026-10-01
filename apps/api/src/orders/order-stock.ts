import type { Prisma } from "../generated/prisma/client.js";

export async function restockItems(
  tx: Prisma.TransactionClient,
  items: { productId: string | null; quantity: number }[],
): Promise<void> {
  for (const item of items) {
    if (item.productId) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }
}
