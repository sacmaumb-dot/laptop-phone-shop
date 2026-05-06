"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin" || !session.shopId) {
    return null;
  }
  return session as typeof session & { shopId: string };
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  try {
    const s = await requireAdmin();
    if (!s) return { ok: false as const, error: "Không có quyền" };
    const hash = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: {
        shopId: s.shopId,
        name: data.name,
        email: data.email,
        password: hash,
        role: data.role,
      },
    });
    revalidatePath("/users");
    return { ok: true as const };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return { ok: false as const, error: "Email đã tồn tại" };
    }
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}

export async function updateUser(
  id: string,
  data: {
    name: string;
    email: string;
    role: string;
    active: boolean;
    password?: string;
  },
) {
  try {
    const s = await requireAdmin();
    if (!s) return { ok: false as const, error: "Không có quyền" };
    const update: {
      name: string;
      email: string;
      role: string;
      active: boolean;
      password?: string;
    } = {
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.active,
    };
    if (data.password && data.password.trim()) {
      update.password = await bcrypt.hash(data.password, 10);
    }
    const owned = await prisma.user.findFirst({
      where: { id, shopId: s.shopId },
      select: { id: true },
    });
    if (!owned) return { ok: false as const, error: "Không tìm thấy" };
    await prisma.user.update({ where: { id }, data: update });
    revalidatePath("/users");
    return { ok: true as const };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return { ok: false as const, error: "Email đã tồn tại" };
    }
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}

export async function deleteUser(id: string) {
  try {
    const s = await requireAdmin();
    if (!s) return { ok: false as const, error: "Không có quyền" };
    if (s.id === id) {
      return {
        ok: false as const,
        error: "Không thể xoá tài khoản đang đăng nhập",
      };
    }
    const used = await prisma.user.findFirst({
      where: { id, shopId: s.shopId },
      include: {
        sales: { select: { id: true }, take: 1 },
        serviceTickets: { select: { id: true }, take: 1 },
        serviceAssigned: { select: { id: true }, take: 1 },
      },
    });
    if (!used) return { ok: false as const, error: "Không tìm thấy" };
    if (
      used.sales.length ||
      used.serviceTickets.length ||
      used.serviceAssigned.length
    ) {
      return {
        ok: false as const,
        error: "Tài khoản đã có giao dịch, hãy tạm khoá thay vì xoá",
      };
    }
    await prisma.user.delete({ where: { id } });
    revalidatePath("/users");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}
