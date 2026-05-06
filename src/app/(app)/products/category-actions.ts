"use server";

import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const VALID_TYPES = new Set(["laptop", "phone", "accessory", "service"]);

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function requireAdmin() {
  const s = await requireShopSession();
  if (s.role !== "admin") return null;
  return s;
}

export async function createCategory(data: { name: string; type: string }) {
  const s = await requireAdmin();
  if (!s) return { ok: false as const, error: "Không có quyền" };
  const name = data.name.trim();
  if (!name) return { ok: false as const, error: "Vui lòng nhập tên danh mục" };
  if (!VALID_TYPES.has(data.type))
    return { ok: false as const, error: "Loại danh mục không hợp lệ" };

  const baseSlug = slugify(name) || "danh-muc";
  let slug = baseSlug;
  let i = 1;
  while (
    await prisma.category.findFirst({
      where: { shopId: s.shopId, slug },
      select: { id: true },
    })
  ) {
    i += 1;
    slug = `${baseSlug}-${i}`;
    if (i > 50) return { ok: false as const, error: "Không tạo được slug" };
  }
  await prisma.category.create({
    data: { shopId: s.shopId, name, slug, type: data.type },
  });
  revalidatePath("/products");
  return { ok: true as const };
}

export async function updateCategory(
  id: string,
  data: { name: string; type: string },
) {
  const s = await requireAdmin();
  if (!s) return { ok: false as const, error: "Không có quyền" };
  const existing = await prisma.category.findFirst({
    where: { id, shopId: s.shopId },
    select: { id: true },
  });
  if (!existing) return { ok: false as const, error: "Danh mục không tồn tại" };
  const name = data.name.trim();
  if (!name) return { ok: false as const, error: "Vui lòng nhập tên danh mục" };
  if (!VALID_TYPES.has(data.type))
    return { ok: false as const, error: "Loại danh mục không hợp lệ" };
  await prisma.category.update({
    where: { id },
    data: { name, type: data.type },
  });
  revalidatePath("/products");
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  const s = await requireAdmin();
  if (!s) return { ok: false as const, error: "Không có quyền" };
  const existing = await prisma.category.findFirst({
    where: { id, shopId: s.shopId },
    select: { id: true, _count: { select: { products: true } } },
  });
  if (!existing) return { ok: false as const, error: "Danh mục không tồn tại" };
  if (existing._count.products > 0)
    return {
      ok: false as const,
      error: `Không thể xoá: danh mục đang chứa ${existing._count.products} sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước.`,
    };
  await prisma.category.delete({ where: { id } });
  revalidatePath("/products");
  return { ok: true as const };
}
