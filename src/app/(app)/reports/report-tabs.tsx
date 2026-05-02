"use client";

import Link from "next/link";
import { BarChart3, ClipboardCheck } from "lucide-react";

export function ReportTabs({
  active,
}: {
  active: "overview" | "shifts";
}) {
  const tabs = [
    {
      key: "overview" as const,
      href: "/reports",
      label: "Tổng quan",
      icon: BarChart3,
    },
    {
      key: "shifts" as const,
      href: "/reports?tab=shifts",
      label: "Đối soát ca trực",
      icon: ClipboardCheck,
    },
  ];
  return (
    <div className="inline-flex h-9 items-center gap-1 rounded-md border bg-muted/30 p-1">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`inline-flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium transition ${
              isActive
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
