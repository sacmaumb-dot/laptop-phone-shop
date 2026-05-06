"use server";

import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
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
  customerId?: string;
  newCustomer?: { name: string; phone: string };
  paymentMethod: string;
  discount: number;
  note: string;
}) {
  try {
    const session = await requireShopSession();
    const shopId = session.shopId;
    if (input.items.length === 0) {
      return { ok: false as const, error: "Giỏ hàng trống" };
    }

    let resolvedCustomerId: string | null = input.customerId || null;
    if (resolvedCustomerId) {
      const owned = await prisma.customer.findFirst({
        where: { id: resolvedCustomerId, shopId },
        select: { id: true },
      });
      if (!owned) {
        return { ok: false as const, error: "Khách hàng không thuộc cửa hàng này" };
      }
    }
    if (!resolvedCustomerId && (!input.newCustomer || !input.newCustomer.phone?.trim() || !input.newCustomer.name?.trim())) {
      return {
        ok: false as const,
        error: "Vui lòng chọn hoặc thêm khách hàng (SĐT + tên)",
      };
    }
    if (!resolvedCustomerId && input.newCustomer && input.newCustomer.name.trim()) {
      const phone = input.newCustomer.phone.trim();
      const name = input.newCustomer.name.trim();
      if (!phone) {
        return { ok: false as const, error: "SĐT khách hàng không hợp lệ" };
      }
      const existing = await prisma.customer.findFirst({ where: { shopId, phone } });
      if (existing) {
        resolvedCustomerId = existing.id;
      } else {
        const allCust = await prisma.customer.findMany({
          where: { shopId },
          select: { code: true },
        });
        const maxCustNum = allCust.reduce((m, c) => {
          const n = parseInt(c.code.replace(/\D/g, "")) || 0;
          return n > m ? n : m;
        }, 0);
        const created = await prisma.customer.create({
          data: {
            shopId,
            code: `KH${String(maxCustNum + 1).padStart(5, "0")}`,
            name,
            phone,
          },
        });
        resolvedCustomerId = created.id;
      }
    }

    // Validate stock — also verifies products belong to this shop
    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, shopId },
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

    const allSales = await prisma.sale.findMany({
      where: { shopId },
      select: { code: true },
    });
    const maxNum = allSales.reduce((m, s) => {
      const n = parseInt(s.code.replace(/\D/g, "")) || 0;
      return n > m ? n : m;
    }, 0);
    const code = `HD${String(maxNum + 1).padStart(5, "0")}`;

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          shopId,
          code,
          subtotal,
          discount: input.discount || 0,
          total,
          paid: total,
          paymentMethod: input.paymentMethod,
          status: "paid",
          note: input.note || null,
          customerId: resolvedCustomerId,
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
