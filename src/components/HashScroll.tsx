"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Desplaza a anclas (#categorias, etc.) tras navegar con Next.js */
export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    const scrollToHash = () => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const timer = window.setTimeout(scrollToHash, 50);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}