"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PrintSizeSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  function setSize(s: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("size", s);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-md border overflow-hidden">
      <Button
        type="button"
        variant={current === "A4" ? "default" : "ghost"}
        size="sm"
        className="rounded-none h-8 px-2.5 text-xs"
        onClick={() => setSize("A4")}
      >
        A4
      </Button>
      <Button
        type="button"
        variant={current === "80mm" ? "default" : "ghost"}
        size="sm"
        className="rounded-none h-8 px-2.5 text-xs"
        onClick={() => setSize("80mm")}
      >
        80mm
      </Button>
    </div>
  );
}
