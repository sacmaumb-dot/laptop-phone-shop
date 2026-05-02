"use client";

import { useEffect } from "react";

export function PrintPageStyle({ size }: { size: string }) {
  useEffect(() => {
    document.body.dataset.printSize = size;
    return () => {
      delete document.body.dataset.printSize;
    };
  }, [size]);

  // @page rules cannot use attribute selectors so we emit the matching rule directly.
  const pageRule =
    size === "80mm"
      ? "@page { size: 80mm auto; margin: 0; } @media print { html, body { width: 80mm; } }"
      : "@page { size: A4; margin: 10mm 12mm; }";

  return <style dangerouslySetInnerHTML={{ __html: pageRule }} />;
}
