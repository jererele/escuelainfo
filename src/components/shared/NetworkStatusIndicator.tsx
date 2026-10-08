"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, Check } from "lucide-react";

export default function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] pointer-events-none transition-all duration-300 transform translate-y-0"
    >
      {!isOnline ? (
        <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 backdrop-blur-md shadow-lg text-xs font-semibold">
          <WifiOff size={16} className="shrink-0 animate-pulse" />
          <span>Modo sin conexión · Navegando con datos locales en caché</span>
        </div>
      ) : showReconnected ? (
        <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 backdrop-blur-md shadow-lg text-xs font-semibold animate-fade-in">
          <Wifi size={16} className="shrink-0" />
          <span>Conexión restablecida · Sincronizando con la plataforma</span>
        </div>
      ) : null}
    </div>
  );
}
