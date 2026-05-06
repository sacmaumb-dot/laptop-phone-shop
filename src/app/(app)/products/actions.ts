"use server";

import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createProduct(data: {
  sku: string;
  name: string;
  brand?: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  warranty: number;
  description?: string;
}) {
  try {
    const session = await requireShopSession();
    const cat = await prisma.category.findFirst({
      where: { id: data.categoryId, shopId: session.shopId },
      select: { id: true },
    });
    if (!cat) return { ok: false as const, error: "Danh mục không hợp lệ" };
    await prisma.product.create({
      data: {
        shopId: session.shopId,
        sku: data.sku,
        name: data.name,
        brand: data.brand || null,
        categoryId: data.categoryId,
        price: data.price,
        costPrice: data.costPrice,
        stock: data.stock,
        warranty: data.warranty,
        description: data.description || null,
      },
    });
    revalidatePath("/products");
    revalidatePath("/pos");
    return { ok: true as const };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return { ok: false as const, error: "SKU đã tồn tại" };
    }
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}

export async function updateProduct(
  id: string,
  data: {
    sku: string;
    name: string;
    brand?: string;
    categoryId: string;
    price: number;
    costPrice: number;
    stock: number;
    warranty: number;
    description?: string;
  },
) {
  try {
    const session = await requireShopSession();
    const existing = await prisma.product.findFirst({
      where: { id, shopId: session.shopId },
      select: { id: true },
    });
    if (!existing) return { ok: false as const, error: "Sản phẩm không tồn tại" };
    const cat = await prisma.category.findFirst({
      where: { id: data.categoryId, shopId: session.shopId },
      select: { id: true },
    });
    if (!cat) return { ok: false as const, error: "Danh mục không hợp lệ" };
    await prisma.product.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        brand: data.brand || null,
        categoryId: data.categoryId,
        price: data.price,
        costPrice: data.costPrice,
        stock: data.stock,
        warranty: data.warranty,
        description: data.description || null,
      },
    });
    revalidatePath("/products");
    revalidatePath("/pos");
    return { ok: true as const };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return { ok: false as const, error: "SKU đã tồn tại" };
    }
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}

export async function deleteProduct(id: string) {
  try {
    const session = await requireShopSession();
    const existing = await prisma.product.findFirst({
      where: { id, shopId: session.shopId },
      select: { id: true },
    });
    if (!existing) return { ok: false as const, error: "Sản phẩm không tồn tại" };
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/products");
    revalidatePath("/pos");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}
