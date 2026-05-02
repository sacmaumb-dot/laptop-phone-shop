import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");
  const settings = await getSettings();

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
