import { prisma } from "./prisma";
import { unstable_cache } from "next/cache";

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
  shopName: "TechShop",
  siteTitle: "TechShop - Quản lý cửa hàng Laptop & Điện thoại",
  shopTagline: "Laptop & Điện thoại",
  shopAddress: null,
  shopPhone: null,
  shopEmail: null,
  logoUrl: null,
  faviconUrl: null,
  printSize: "A4",
};

async function loadSettingsRaw(): Promise<AppSettings> {
  const s = await prisma.appSetting.findUnique({ where: { id: "singleton" } });
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

export const getSettings = unstable_cache(loadSettingsRaw, ["app-settings"], {
  tags: ["app-settings"],
});
