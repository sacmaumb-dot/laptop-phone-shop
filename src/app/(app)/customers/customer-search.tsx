"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function CustomerSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params);
      if (q) sp.set("q", q);
      else sp.delete("q");
      router.replace(`/customers?${sp.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="relative mt-2">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        placeholder="Tìm khách hàng..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
