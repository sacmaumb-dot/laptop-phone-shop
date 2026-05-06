"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Store, Printer } from "lucide-react";
import type { AppSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";
import { PrintTemplatesForm } from "./print-templates-form";

export function SettingsTabs({
  initial,
  initialTab,
}: {
  initial: AppSettings;
  initialTab: string;
}) {
  const [tab, setTab] = useState(initialTab);
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
      <TabsList>
        <TabsTrigger value="shop">
          <Store className="size-4" />
          Cửa hàng
        </TabsTrigger>
        <TabsTrigger value="print">
          <Printer className="size-4" />
          Mẫu in
        </TabsTrigger>
      </TabsList>
      <TabsContent value="shop">
        <SettingsForm initial={initial} />
      </TabsContent>
      <TabsContent value="print">
        <PrintTemplatesForm initial={initial} />
      </TabsContent>
    </Tabs>
  );
}
