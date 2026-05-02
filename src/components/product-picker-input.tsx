"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = React.useState(false);
  const [rect, setRect] = React.useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    function update() {
      const wrap = ref.current;
      if (!wrap) return;
      const el = wrap.querySelector("input");
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.bottom + 4, width: r.width });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

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

  const dropdown =
    mounted && open && rect ? (
      <div
        style={{
          position: "fixed",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          zIndex: 100,
        }}
        className="rounded-md border bg-popover shadow-lg overflow-hidden max-h-72 overflow-y-auto"
      >
        {matches.length > 0 ? (
          matches.map((p, idx) => (
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
          ))
        ) : value.trim() ? (
          <div className="p-3 text-xs text-muted-foreground">
            Không có sản phẩm khớp. Sẽ lưu dưới dạng mô tả tự do.
          </div>
        ) : null}
      </div>
    ) : null;

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
      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
