"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  note?: string;
}) {
  try {
    await requireSession();
    const count = await prisma.customer.count();
    const code = `KH${String(count + 1).padStart(5, "0")}`;
    await prisma.customer.create({
      data: {
        code,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        note: data.note || null,
      },
    });
    revalidatePath("/customers");
    return { ok: true as const };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return { ok: false as const, error: "Số điện thoại đã tồn tại" };
    }
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}
