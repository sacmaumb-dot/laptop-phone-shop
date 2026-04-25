"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type Item = {
  productId: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  imei?: string;
};

export async function createSale(input: {
  items: Item[];
  customerId: string | null;
  paymentMethod: string;
  discount: number;
  note: string;
}) {
  try {
    const session = await requireSession();
    if (input.items.length === 0) {
      return { ok: false as const, error: "Giỏ hàng trống" };
    }

    // Validate stock
    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });
    for (const item of input.items) {
      const p = products.find((x) => x.id === item.productId);
      if (!p) return { ok: false as const, error: "Sản phẩm không tồn tại" };
      if (p.category.type !== "service" && p.stock < item.quantity) {
        return {
          ok: false as const,
          error: `"${p.name}" không đủ tồn kho (còn ${p.stock})`,
        };
      }
    }

    const subtotal = input.items.reduce(
      (s, i) => s + i.unitPrice * i.quantity - (i.discount || 0),
      0,
    );
    const total = Math.max(0, subtotal - (input.discount || 0));

    // Generate code
    const lastSale = await prisma.sale.findFirst({
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });
    const nextNum = lastSale ? parseInt(lastSale.code.replace(/\D/g, "")) + 1 : 1;
    const code = `HD${String(nextNum).padStart(5, "0")}`;

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          code,
          subtotal,
          discount: input.discount || 0,
          total,
          paid: total,
          paymentMethod: input.paymentMethod,
          status: "paid",
          note: input.note || null,
          customerId: input.customerId || null,
          userId: session.id,
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount || 0,
              subtotal: i.unitPrice * i.quantity - (i.discount || 0),
              imei: i.imei || null,
            })),
          },
        },
      });

      // Reduce stock for non-service items
      for (const item of input.items) {
        const p = products.find((x) => x.id === item.productId);
        if (p && p.category.type !== "service") {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return created;
    });

    revalidatePath("/");
    revalidatePath("/sales");
    revalidatePath("/products");
    return { ok: true as const, id: sale.id, code: sale.code };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra khi tạo hoá đơn" };
  }
}
