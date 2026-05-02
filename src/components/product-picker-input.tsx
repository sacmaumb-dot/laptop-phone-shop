"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type PickerProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  categoryType: string;
};

export function ProductPickerInput({
  products,
  value,
  onSelect,
  onTextChange,
  placeholder,
  className,
}: {
  products: PickerProduct[];
  value: string;
  onSelect: (p: PickerProduct) => void;
  onTextChange: (text: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [products, value]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        placeholder={placeholder ?? "Tìm dịch vụ / sản phẩm..."}
        onChange={(e) => {
          onTextChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(matches.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter") {
            const m = matches[active];
            if (m) {
              e.preventDefault();
              onSelect(m);
              setOpen(false);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="pl-8"
      />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border bg-popover shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {matches.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(p);
                setOpen(false);
              }}
              onMouseEnter={() => setActive(idx)}
              className={cn(
                "w-full px-2.5 py-1.5 text-left flex items-center gap-2 text-xs",
                idx === active ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <span
                className={cn(
                  "shrink-0 rounded text-[9px] px-1 py-0.5 font-mono",
                  p.categoryType === "service"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {p.sku}
              </span>
              <span className="flex-1 truncate font-medium">{p.name}</span>
              <span className="shrink-0 font-semibold text-primary">
                {new Intl.NumberFormat("vi-VN").format(p.price)}₫
              </span>
            </button>
          ))}
        </div>
      )}
      {open && value.trim() && matches.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border bg-popover shadow-lg p-3 text-xs text-muted-foreground">
          Không có sản phẩm khớp. Sẽ lưu dưới dạng mô tả tự do.
        </div>
      )}
    </div>
  );
}
