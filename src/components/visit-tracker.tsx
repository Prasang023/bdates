"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    void fetch("/api/v1/analytics/visit", { method: "POST", keepalive: true });
  }, [pathname]);

  return null;
}
