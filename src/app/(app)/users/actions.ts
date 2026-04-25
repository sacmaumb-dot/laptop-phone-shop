"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { ok: false as const, error: "Không có quyền" };
    }
    const hash = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: {
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
