"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "admin") return null;
  return s;
}

const SETTING_ID = "singleton";

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
    if (!(await requireAdmin())) {
      return { ok: false as const, error: "Không có quyền" };
    }
    await prisma.appSetting.upsert({
      where: { id: SETTING_ID },
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
        id: SETTING_ID,
        shopName: data.shopName,
        siteTitle: data.siteTitle,
        shopTagline: data.shopTagline,
        shopAddress: data.shopAddress || null,
        shopPhone: data.shopPhone || null,
        shopEmail: data.shopEmail || null,
        printSize: data.printSize,
      },
    });
    updateTag("app-settings");
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}

export async function uploadAsset(formData: FormData) {
  try {
    if (!(await requireAdmin())) {
      return { ok: false as const, error: "Không có quyền" };
    }
    const file = formData.get("file") as File | null;
    const kind = formData.get("kind") as string | null; // logo | favicon
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
    const fileName = `${kind}-${Date.now()}.${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buf);
    const url = `/uploads/${fileName}`;
    await prisma.appSetting.upsert({
      where: { id: SETTING_ID },
      update: kind === "favicon" ? { faviconUrl: url } : { logoUrl: url },
      create: {
        id: SETTING_ID,
        ...(kind === "favicon" ? { faviconUrl: url } : { logoUrl: url }),
      },
    });
    updateTag("app-settings");
    revalidatePath("/", "layout");
    return { ok: true as const, url };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Lỗi upload file" };
  }
}

export async function clearAsset(kind: "logo" | "favicon") {
  try {
    if (!(await requireAdmin())) {
      return { ok: false as const, error: "Không có quyền" };
    }
    await prisma.appSetting.upsert({
      where: { id: SETTING_ID },
      update: kind === "favicon" ? { faviconUrl: null } : { logoUrl: null },
      create: {
        id: SETTING_ID,
        ...(kind === "favicon" ? { faviconUrl: null } : { logoUrl: null }),
      },
    });
    updateTag("app-settings");
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}
