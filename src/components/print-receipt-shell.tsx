import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { PrintPageStyle } from "@/components/print-page-style";
import { PrintSizeSwitcher } from "@/components/print-size-switcher";
import type { AppSettings } from "@/lib/settings";

export function PrintReceiptShell({
  backHref,
  backLabel = "Quay lại",
  printLabel = "In phiếu",
  size = "A4",
  settings,
  children,
}: {
  backHref: string;
  backLabel?: string;
  printLabel?: string;
  size?: string;
  settings: AppSettings;
  children: React.ReactNode;
}) {
  void settings;
  return (
    <div
      className={
        size === "80mm"
          ? "space-y-3 max-w-[320px] mx-auto print:max-w-none print:mx-0"
          : "space-y-4 max-w-3xl mx-auto print:max-w-none print:mx-0"
      }
    >
      <PrintPageStyle size={size} />
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href={backHref}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
        <div className="flex items-center gap-2">
          <PrintSizeSwitcher current={size} />
          <PrintButton label={printLabel} />
        </div>
      </div>
      <div className="print-receipt rounded-lg border bg-card text-card-foreground print:border-0 print:shadow-none print:bg-white">
        {children}
      </div>
    </div>
  );
}

export function ReceiptHeader({
  title,
  code,
  subtitle,
  settings,
  headerNote,
}: {
  title: string;
  code: string;
  subtitle?: string;
  settings: AppSettings;
  headerNote?: string | null;
}) {
  return (
    <div className="receipt-padding border-b p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={settings.shopName}
              width={48}
              height={48}
              className="object-contain max-h-12 print-hide-on-thermal"
              unoptimized
            />
          ) : null}
          <div className="min-w-0">
            <div className="font-bold text-base leading-tight truncate">
              {settings.shopName}
            </div>
            {settings.shopAddress && (
              <div className="text-[11px] text-muted-foreground leading-tight">
                {settings.shopAddress}
              </div>
            )}
            {settings.shopPhone && (
              <div className="text-[11px] text-muted-foreground leading-tight">
                ĐT: {settings.shopPhone}
                {settings.shopEmail ? ` · ${settings.shopEmail}` : ""}
              </div>
            )}
            {headerNote && (
              <div className="text-[11px] text-muted-foreground leading-tight whitespace-pre-line mt-0.5">
                {headerNote}
              </div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-bold uppercase tracking-wide leading-tight">
            {title}
          </div>
          <div className="font-mono text-xs mt-0.5">{code}</div>
          {subtitle && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReceiptSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">
        {title}
      </h3>
      {children}
    </div>
  );
}
