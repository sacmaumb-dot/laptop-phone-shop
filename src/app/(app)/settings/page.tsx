import { redirect } from "next/navigation";
import { requireShopSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireShopSession();
  if (session.role !== "admin") redirect("/dashboard");
  const settings = await getSettings(session.shopId);
  const sp = await searchParams;
  const initialTab = sp.tab === "print" ? "print" : "shop";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt cửa hàng</h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình thông tin cửa hàng, logo, favicon và mẫu in.
        </p>
      </div>
      <SettingsTabs initial={settings} initialTab={initialTab} />
    </div>
  );
}
