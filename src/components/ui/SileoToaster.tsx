"use client";

import React, { useEffect, useState } from "react";
import { Toaster } from "sileo";
import "sileo/styles.css";

export default function SileoToaster() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);

    const updateState = () => {
      setIsMobile(window.innerWidth < 640);
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    updateState();
    window.addEventListener("resize", updateState);

    // Observar cambios en el atributo class del elemento html para sincronizar modo oscuro/claro
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("resize", updateState);
      observer.disconnect();
    };
  }, []);

  if (!mounted) return null;

  return (
    <Toaster
      key={isMobile ? "mobile" : "desktop"}
      position={isMobile ? "top-center" : "top-right"}
      theme={theme}
      offset={
        isMobile
          ? { top: "max(calc(env(safe-area-inset-top, 0px) + 68px), 72px)" }
          : { top: 24, right: 24 }
      }
      options={{
        roundness: 18,
        duration: 4000,
      }}
    />
  );
}
