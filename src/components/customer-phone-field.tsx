"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CustomerLite = {
  id: string;
  code: string;
  name: string;
  phone: string;
};

export type CustomerSelection =
  | { mode: "none" }
  | { mode: "existing"; customer: CustomerLite }
  | { mode: "new"; name: string; phone: string };

export function CustomerPhoneField({
  customers,
  value,
  onChange,
  className,
  required = false,
  label = "Khách hàng (SĐT)",
}: {
  customers: CustomerLite[];
  value: CustomerSelection;
  onChange: (s: CustomerSelection) => void;
  className?: string;
  required?: boolean;
  label?: string;
}) {
  const [phone, setPhone] = useState(
    value.mode === "existing"
      ? value.customer.phone
      : value.mode === "new"
        ? value.phone
        : "",
  );
  const [name, setName] = useState(value.mode === "new" ? value.name : "");
  const [open, setOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const matched = useMemo(() => {
    if (!phone.trim()) return [];
    const q = phone.trim();
    return customers
      .filter(
        (c) =>
          c.phone.includes(q) ||
          c.name.toLowerCase().includes(q.toLowerCase()),
      )
      .slice(0, 8);
  }, [phone, customers]);

  const exact = matched.find((c) => c.phone === phone.trim());

  function selectCustomer(c: CustomerLite) {
    setPhone(c.phone);
    setName("");
    setShowNewForm(false);
    setOpen(false);
    onChange({ mode: "existing", customer: c });
  }

  function clear() {
    setPhone("");
    setName("");
    setShowNewForm(false);
    onChange({ mode: "none" });
  }

  function startNew() {
    setShowNewForm(true);
    setOpen(false);
    onChange({ mode: "new", name, phone: phone.trim() });
  }

  function updatePhone(v: string) {
    setPhone(v);
    setOpen(true);
    if (showNewForm) {
      onChange({ mode: "new", name, phone: v.trim() });
    } else {
      const found = customers.find((c) => c.phone === v.trim());
      if (found) {
        onChange({ mode: "existing", customer: found });
      } else {
        onChange({ mode: "none" });
      }
    }
  }

  function updateName(v: string) {
    setName(v);
    onChange({ mode: "new", name: v, phone: phone.trim() });
  }

  return (
    <div ref={containerRef} className={cn("space-y-2", className)}>
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="relative">
        <Input
          inputMode="tel"
          placeholder="Nhập số điện thoại..."
          value={phone}
          onFocus={() => setOpen(true)}
          onChange={(e) => updatePhone(e.target.value)}
          className="pr-9"
        />
        {phone && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-6 grid place-items-center text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
        {open && phone.trim() && (matched.length > 0 || !exact) && (
          <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-md border bg-popover shadow-lg overflow-hidden">
            {matched.length > 0 && (
              <div className="max-h-56 overflow-y-auto">
                {matched.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between gap-2 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.phone} · {c.code}
                      </div>
                    </div>
                    {value.mode === "existing" && value.customer.id === c.id && (
                      <Check className="size-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
            {!exact && (
              <button
                type="button"
                onClick={startNew}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 border-t bg-muted/50"
              >
                <UserPlus className="size-4 text-primary" />
                <span>
                  Thêm khách hàng mới với SĐT{" "}
                  <span className="font-mono font-medium">{phone}</span>
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {value.mode === "existing" && (
        <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/30 p-2 flex items-center justify-between gap-2 text-sm">
          <div className="min-w-0">
            <div className="font-medium truncate">
              {value.customer.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {value.customer.phone} · {value.customer.code}
            </div>
          </div>
          <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        </div>
      )}

      {showNewForm && value.mode === "new" && (
        <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <UserPlus className="size-3.5" />
            Khách hàng mới
          </div>
          <Input
            autoFocus
            placeholder="Tên khách hàng *"
            value={name}
            onChange={(e) => updateName(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clear}
              className="h-7 text-xs text-muted-foreground"
            >
              Huỷ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
