"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Clock, ShieldAlert, ArrowRight, X } from "lucide-react";
import { NotificacionSistema, getNotificaciones, markNotificacionAsRead, markAllNotificacionesAsRead } from "@/lib/dataService";

interface NotificationsBellProps {
  userEmail?: string;
  userRole?: string;
  onOpenCoverageModal?: (notif: NotificacionSistema) => void;
}

export default function NotificationsBell({
  userEmail,
  userRole,
  onOpenCoverageModal,
}: NotificationsBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificacionSistema[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const reload = () => {
    const list = getNotificaciones(userEmail, userRole);
    setNotifications(list);
  };

  useEffect(() => {
    reload();

    const handleUpdate = () => reload();
    window.addEventListener("escuelainfo:notificaciones-updated", handleUpdate);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel("escuelainfo-realtime");
        bc.onmessage = (event) => {
          if (event.data?.type === "notificaciones") reload();
        };
      } catch {}
    }

    return () => {
      window.removeEventListener("escuelainfo:notificaciones-updated", handleUpdate);
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }, [userEmail, userRole]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.leida).length;

  const handleMarkAllRead = () => {
    markAllNotificacionesAsRead(userEmail, userRole);
    reload();
  };

  const handleClickItem = (n: NotificacionSistema) => {
    if (!n.leida) {
      markNotificacionAsRead(n.id);
      reload();
    }
    if (n.tipo === "licencia_preceptor_aprobada" && onOpenCoverageModal) {
      onOpenCoverageModal(n);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]/80 transition-all cursor-pointer active:scale-95"
        title="Notificaciones"
        aria-label="Abrir notificaciones"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[var(--rojo)] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--bg)] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg2)]/95 backdrop-blur-xl border border-[var(--border)] shadow-2xl z-[150] overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-3.5 px-4 bg-[var(--bg3)]/40 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs uppercase tracking-wider text-[var(--text)]">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-[9px] font-black">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-[var(--text3)] hover:text-[var(--verde)] flex items-center gap-1 transition-colors cursor-pointer"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={12} />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border)]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text3)]">
                No tenés notificaciones pendientes
              </div>
            ) : (
              notifications.map((n) => {
                const isCoverageAction = n.tipo === "licencia_preceptor_aprobada";
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickItem(n)}
                    className={`p-3.5 transition-colors cursor-pointer ${
                      n.leida ? "bg-transparent opacity-75 hover:bg-[var(--bg3)]/30" : "bg-[var(--bg3)]/20 hover:bg-[var(--bg3)]/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          n.tipo === "cobertura_asignada"
                            ? "bg-[var(--azul-bg)] text-[var(--azul)] border border-[var(--azul-border)]"
                            : n.tipo === "licencia_preceptor_aprobada"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]"
                        }`}
                      >
                        <ShieldAlert size={14} />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-[var(--text)] truncate">
                            {n.titulo}
                          </span>
                          {!n.leida && (
                            <span className="w-2 h-2 rounded-full bg-[var(--azul)] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text2)] leading-relaxed line-clamp-3">
                          {n.mensaje}
                        </p>
                        {isCoverageAction && (
                          <div className="pt-1 flex items-center gap-1 text-[10px] font-black uppercase text-[var(--azul)]">
                            <span>Asignar Cobertura</span>
                            <ArrowRight size={11} />
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[9px] text-[var(--text3)] pt-0.5">
                          <Clock size={10} />
                          <span>{new Date(n.fecha).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
