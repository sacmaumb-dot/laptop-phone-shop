import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";

export function PrintReceiptShell({
  backHref,
  backLabel = "Quay lại",
  printLabel = "In phiếu",
  children,
}: {
  backHref: string;
  backLabel?: string;
  printLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto print:max-w-none print:mx-0">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link
          href={backHref}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
        <PrintButton label={printLabel} />
      </div>
      <div className="rounded-lg border bg-card text-card-foreground print:border-0 print:shadow-none print:bg-white">
        {children}
      </div>
    </div>
  );
}

export function ReceiptHeader({
  title,
  code,
  subtitle,
}: {
  title: string;
  code: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-bold tracking-tight">{title}</div>
          <div className="font-mono text-sm text-muted-foreground mt-1">
            {code}
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
          )}
        </div>
        <div className="text-right text-sm">
          <div className="font-bold text-base">TechShop</div>
          <div className="text-muted-foreground">Laptop & Điện thoại</div>
          <div className="text-muted-foreground">Hotline: 1900 1234</div>
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
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
        {title}
      </h3>
      {children}
    </div>
  );
}
