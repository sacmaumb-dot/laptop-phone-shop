import { redirect } from "next/navigation";
import { requireShopSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await requireShopSession();
  if (session.role !== "admin") redirect("/dashboard");
  const settings = await getSettings(session.shopId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt cửa hàng</h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình thông tin cửa hàng, logo, favicon và in hoá đơn.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
