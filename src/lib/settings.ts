import { prisma } from "./prisma";
import { unstable_cache } from "next/cache";
import { getShopFromSubdomain } from "./tenant";

export type AppSettings = {
  shopName: string;
  siteTitle: string;
  shopTagline: string;
  shopAddress: string | null;
  shopPhone: string | null;
  shopEmail: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  printSize: string; // "A4" | "80mm"
};

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: "MyPOS",
  siteTitle: "MyPOS - Quản lý cửa hàng",
  shopTagline: "Laptop & Điện thoại",
  shopAddress: null,
  shopPhone: null,
  shopEmail: null,
  logoUrl: null,
  faviconUrl: null,
  printSize: "A4",
};

async function loadSettingsRaw(shopId: string): Promise<AppSettings> {
  const s = await prisma.appSetting.findUnique({ where: { shopId } });
  if (!s) return DEFAULT_SETTINGS;
  return {
    shopName: s.shopName,
    siteTitle: s.siteTitle,
    shopTagline: s.shopTagline,
    shopAddress: s.shopAddress,
    shopPhone: s.shopPhone,
    shopEmail: s.shopEmail,
    logoUrl: s.logoUrl,
    faviconUrl: s.faviconUrl,
    printSize: s.printSize,
  };
}

/**
 * Per-shop settings, cached by shopId. Use settingsTag(shopId) when calling
 * revalidateTag from a server action that mutates settings.
 */
export function getSettings(shopId: string): Promise<AppSettings> {
  const cached = unstable_cache(
    () => loadSettingsRaw(shopId),
    ["app-settings", shopId],
    { tags: [settingsTag(shopId)] },
  );
  return cached();
}

export function settingsTag(shopId: string): string {
  return `app-settings:${shopId}`;
}

/**
 * Resolve settings for the request. If a shop subdomain is present and matches
 * a shop, returns that shop's settings; otherwise returns brand defaults
 * (used for landing/marketing pages).
 */
export async function getRequestSettings(): Promise<AppSettings> {
  const shop = await getShopFromSubdomain();
  if (shop) return getSettings(shop.id);
  return DEFAULT_SETTINGS;
}
