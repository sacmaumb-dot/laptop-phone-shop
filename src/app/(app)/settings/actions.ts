"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { settingsTag } from "@/lib/settings";
import { revalidatePath, updateTag } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "admin" || !s.shopId) return null;
  return s as typeof s & { shopId: string };
}

export async function updateSettings(data: {
  shopName: string;
  siteTitle: string;
  shopTagline: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  printSize: string;
}) {
  try {
    const s = await requireAdmin();
    if (!s) return { ok: false as const, error: "Không có quyền" };
    await prisma.appSetting.upsert({
      where: { shopId: s.shopId },
      update: {
        shopName: data.shopName,
        siteTitle: data.siteTitle,
        shopTagline: data.shopTagline,
        shopAddress: data.shopAddress || null,
        shopPhone: data.shopPhone || null,
        shopEmail: data.shopEmail || null,
        printSize: data.printSize,
      },
      create: {
        shopId: s.shopId,
        shopName: data.shopName,
        siteTitle: data.siteTitle,
        shopTagline: data.shopTagline,
        shopAddress: data.shopAddress || null,
        shopPhone: data.shopPhone || null,
        shopEmail: data.shopEmail || null,
        printSize: data.printSize,
      },
    });
    updateTag(settingsTag(s.shopId));
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}

export async function uploadAsset(formData: FormData) {
  try {
    const s = await requireAdmin();
    if (!s) return { ok: false as const, error: "Không có quyền" };
    const file = formData.get("file") as File | null;
    const kind = formData.get("kind") as string | null;
    if (!file || !kind) {
      return { ok: false as const, error: "Thiếu file" };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false as const, error: "File tối đa 2MB" };
    }
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const safeExt = ["png", "jpg", "jpeg", "webp", "svg", "ico"].includes(ext)
      ? ext
      : "png";
    const fileName = `${kind}-${s.shopId}-${Date.now()}.${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buf);
    const url = `/uploads/${fileName}`;
    await prisma.appSetting.upsert({
      where: { shopId: s.shopId },
      update: kind === "favicon" ? { faviconUrl: url } : { logoUrl: url },
      create: {
        shopId: s.shopId,
        ...(kind === "favicon" ? { faviconUrl: url } : { logoUrl: url }),
      },
    });
    updateTag(settingsTag(s.shopId));
    revalidatePath("/", "layout");
    return { ok: true as const, url };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Lỗi upload file" };
  }
}

export async function clearAsset(kind: "logo" | "favicon") {
  try {
    const s = await requireAdmin();
    if (!s) return { ok: false as const, error: "Không có quyền" };
    await prisma.appSetting.upsert({
      where: { shopId: s.shopId },
      update: kind === "favicon" ? { faviconUrl: null } : { logoUrl: null },
      create: {
        shopId: s.shopId,
        ...(kind === "favicon" ? { faviconUrl: null } : { logoUrl: null }),
      },
    });
    updateTag(settingsTag(s.shopId));
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}
