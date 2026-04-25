"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createServiceTicket(input: {
  customerMode: "existing" | "new";
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deviceType: string;
  deviceBrand?: string;
  deviceModel?: string;
  imei?: string;
  accessories?: string;
  appearance?: string;
  problem: string;
  diagnosis?: string;
  estimatedCost: number;
  deposit: number;
  assignedToId?: string;
  promisedAt?: string | null;
  note?: string;
}) {
  try {
    const session = await requireSession();

    let customerId = input.customerId || null;
    if (input.customerMode === "new") {
      // upsert by phone
      const phone = (input.customerPhone || "").trim();
      const existing = phone
        ? await prisma.customer.findUnique({ where: { phone } })
        : null;
      if (existing) {
        customerId = existing.id;
      } else {
        const count = await prisma.customer.count();
        const code = `KH${String(count + 1).padStart(5, "0")}`;
        const c = await prisma.customer.create({
          data: {
            code,
            name: input.customerName || "Khách hàng",
            phone,
            email: input.customerEmail || null,
          },
        });
        customerId = c.id;
      }
    }

    if (!customerId) {
      return { ok: false as const, error: "Khách hàng không hợp lệ" };
    }

    const last = await prisma.serviceTicket.findFirst({
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });
    const nextNum = last ? parseInt(last.code.replace(/\D/g, "")) + 1 : 1;
    const code = `SC${String(nextNum).padStart(5, "0")}`;

    const ticket = await prisma.serviceTicket.create({
      data: {
        code,
        customerId,
        createdById: session.id,
        assignedToId: input.assignedToId || null,
        deviceType: input.deviceType,
        deviceBrand: input.deviceBrand || null,
        deviceModel: input.deviceModel || null,
        imei: input.imei || null,
        accessories: input.accessories || null,
        appearance: input.appearance || null,
        problem: input.problem,
        diagnosis: input.diagnosis || null,
        estimatedCost: input.estimatedCost,
        deposit: input.deposit,
        promisedAt: input.promisedAt ? new Date(input.promisedAt) : null,
        note: input.note || null,
        status: "received",
        history: {
          create: {
            status: "received",
            note: "Tiếp nhận thiết bị",
          },
        },
      },
    });

    revalidatePath("/service");
    revalidatePath("/");
    return { ok: true as const, id: ticket.id, code: ticket.code };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra khi tạo phiếu" };
  }
}

export async function updateServiceStatus(
  ticketId: string,
  status: string,
  note: string,
) {
  try {
    await requireSession();
    await prisma.$transaction(async (tx) => {
      const data: {
        status: string;
        completedAt?: Date;
        deliveredAt?: Date;
      } = { status };
      if (status === "completed") data.completedAt = new Date();
      if (status === "delivered") data.deliveredAt = new Date();
      await tx.serviceTicket.update({
        where: { id: ticketId },
        data,
      });
      await tx.serviceStatusHistory.create({
        data: { ticketId, status, note: note || null },
      });
    });
    revalidatePath(`/service/${ticketId}`);
    revalidatePath("/service");
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Cập nhật thất bại" };
  }
}

export async function updateServiceTicket(
  ticketId: string,
  data: {
    diagnosis?: string;
    solution?: string;
    estimatedCost?: number;
    finalCost?: number;
    paid?: number;
    warranty?: number;
    assignedToId?: string;
    promisedAt?: string | null;
    note?: string;
  },
) {
  try {
    await requireSession();
    await prisma.serviceTicket.update({
      where: { id: ticketId },
      data: {
        ...data,
        promisedAt: data.promisedAt ? new Date(data.promisedAt) : undefined,
        assignedToId: data.assignedToId || null,
      },
    });
    revalidatePath(`/service/${ticketId}`);
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Cập nhật thất bại" };
  }
}
