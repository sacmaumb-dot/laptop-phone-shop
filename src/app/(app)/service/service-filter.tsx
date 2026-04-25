"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { SERVICE_STATUSES } from "@/components/service-status-badge";

export function ServiceFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const status = params.get("status") || "all";

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params);
      if (q) sp.set("q", q);
      else sp.delete("q");
      router.replace(`/service?${sp.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setStatus(value: string | null) {
    const sp = new URLSearchParams(params);
    if (value && value !== "all") sp.set("status", value);
    else sp.delete("status");
    router.replace(`/service?${sp.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo mã phiếu, IMEI, tên/SĐT khách..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          {SERVICE_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
