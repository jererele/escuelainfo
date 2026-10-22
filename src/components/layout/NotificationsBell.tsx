"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  X, 
  UserCheck, 
  AlertTriangle, 
  Send, 
  UserPlus, 
  ShieldCheck, 
  Trash2,
  Sparkles
} from "lucide-react";
import { 
  NotificacionSistema, 
  NotificacionTipo,
  subscribeToNotificaciones, 
  markNotificacionAsRead, 
  markAllNotificacionesAsRead,
  deleteNotificacion 
} from "@/lib/dataService";
import { notify } from "@/lib/notify";

interface NotificationsBellProps {
  userEmail?: string;
  userRole?: string;
  schoolId?: string;
  onOpenCoverageModal?: (notif: NotificacionSistema) => void;
}

// Reproducción de tono sutil y amigable con Web Audio API (cero dependencias externas)
const playChimeSound = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
};

export default function NotificationsBell({
  userEmail,
  userRole,
  schoolId,
  onOpenCoverageModal,
}: NotificationsBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificacionSistema[]>([]);
  const [filterTab, setFilterTab] = useState<"todas" | "no_leidas">("todas");
  const containerRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToNotificaciones(userEmail, userRole, (list, newArrival) => {
      setNotifications(list);

      // Notificación emergente Toast y sonido en tiempo real al recibir un aviso nuevo
      if (newArrival && !newArrival.leida && !seenIdsRef.current.has(newArrival.id)) {
        seenIdsRef.current.add(newArrival.id);
        if (!isInitialMountRef.current) {
          const ageSec = (Date.now() - new Date(newArrival.fecha).getTime()) / 1000;
          if (ageSec < 45) {
            playChimeSound();
            notify.info(newArrival.titulo, {
              description: newArrival.mensaje,
              duration: 6000,
            });
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              try { navigator.vibrate([100, 50, 100]); } catch {}
            }
          }
        }
      }
      isInitialMountRef.current = false;
    }, schoolId);

    return () => unsubscribe();
  }, [userEmail, userRole, schoolId]);

  // Cerrar al hacer clic fuera
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

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.leida).length;
  }, [notifications]);

  const displayedNotifications = useMemo(() => {
    if (filterTab === "no_leidas") {
      return notifications.filter((n) => !n.leida);
    }
    return notifications;
  }, [notifications, filterTab]);

  const handleMarkAllRead = async () => {
    await markAllNotificacionesAsRead(userEmail, userRole, schoolId);
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const handleClickItem = async (n: NotificacionSistema) => {
    if (!n.leida) {
      await markNotificacionAsRead(n.id, schoolId);
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, leida: true } : item)));
    }
    if (n.tipo === "licencia_preceptor_aprobada" && onOpenCoverageModal) {
      onOpenCoverageModal(n);
      setIsOpen(false);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotificacion(id, schoolId);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const getNotificationIcon = (tipo: NotificacionTipo) => {
    switch (tipo) {
      case "licencia_preceptor_aprobada":
        return {
          icon: <Clock size={14} strokeWidth={2.5} />,
          className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        };
      case "cobertura_asignada":
        return {
          icon: <UserCheck size={14} strokeWidth={2.5} />,
          className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        };
      case "inasistencia_docente":
        return {
          icon: <AlertTriangle size={14} strokeWidth={2.5} />,
          className: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
        };
      case "aviso_general":
        return {
          icon: <Send size={14} strokeWidth={2.5} />,
          className: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
        };
      case "nuevo_usuario_pendiente":
        return {
          icon: <UserPlus size={14} strokeWidth={2.5} />,
          className: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
        };
      case "rol_actualizado":
        return {
          icon: <ShieldCheck size={14} strokeWidth={2.5} />,
          className: "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]",
        };
      default:
        return {
          icon: <ShieldAlert size={14} strokeWidth={2.5} />,
          className: "bg-[var(--bg3)] text-[var(--text2)] border border-[var(--border)]",
        };
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Botón Campana con Insignia Pulsante */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]/80 transition-all cursor-pointer active:scale-95"
        title="Notificaciones en Tiempo Real"
        aria-label="Abrir notificaciones"
      >
        <Bell size={16} className={unreadCount > 0 ? "text-[var(--verde)]" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[var(--rojo)] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--bg)] animate-pulse shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop en móviles para cerrar al tocar fuera */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[140] sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Menú Flotante de Notificaciones */}
      {isOpen && (
        <div className="fixed inset-x-3 top-[calc(3.5rem+env(safe-area-inset-top,0px)+8px)] max-w-sm mx-auto sm:max-w-none sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl bg-[var(--bg2)]/95 backdrop-blur-xl border border-[var(--border)] shadow-2xl z-[150] overflow-hidden animate-fade-in flex flex-col max-h-[82vh]">
          {/* Header */}
          <div className="p-3.5 px-4 bg-[var(--bg3)]/40 border-b border-[var(--border)] flex items-center justify-between shrink-0">
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

          {/* Filtros de Pestaña */}
          <div className="flex items-center gap-1 p-2 bg-[var(--bg)]/40 border-b border-[var(--border)] shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setFilterTab("todas")}
              className={`flex-1 py-1 px-2.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filterTab === "todas"
                  ? "bg-[var(--bg2)] text-[var(--text)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text3)] hover:text-[var(--text)]"
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("no_leidas")}
              className={`flex-1 py-1 px-2.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filterTab === "no_leidas"
                  ? "bg-[var(--bg2)] text-[var(--verde)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text3)] hover:text-[var(--text)]"
              }`}
            >
              No leídas ({unreadCount})
            </button>
          </div>

          {/* Listado de Notificaciones con Scroll */}
          <div className="overflow-y-auto divide-y divide-[var(--border)] flex-1 custom-scrollbar">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg3)] text-[var(--text3)] flex items-center justify-center mx-auto">
                  <Sparkles size={18} />
                </div>
                <p className="text-xs font-bold text-[var(--text)]">Estás al día</p>
                <p className="text-[11px] text-[var(--text3)]">
                  {filterTab === "no_leidas"
                    ? "No tenés notificaciones sin leer."
                    : "No hay notificaciones registradas en tu casilla."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => {
                const iconMeta = getNotificationIcon(n.tipo);
                const isCoverageAction = n.tipo === "licencia_preceptor_aprobada";

                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickItem(n)}
                    className={`p-3.5 transition-all cursor-pointer group relative ${
                      n.leida
                        ? "bg-transparent opacity-80 hover:bg-[var(--bg3)]/30 hover:opacity-100"
                        : "bg-[var(--bg3)]/40 hover:bg-[var(--bg3)]/60"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Icono temático */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconMeta.className}`}>
                        {iconMeta.icon}
                      </div>

                      {/* Contenido */}
                      <div className="space-y-1 flex-1 min-w-0 pr-6">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-[var(--text)] truncate">
                            {n.titulo}
                          </span>
                          {!n.leida && (
                            <span className="w-2 h-2 rounded-full bg-[var(--verde)] shrink-0 animate-pulse" />
                          )}
                        </div>

                        <p className="text-[11px] text-[var(--text2)] leading-relaxed line-clamp-3">
                          {n.mensaje}
                        </p>

                        {isCoverageAction && (
                          <div className="pt-1 flex items-center gap-1 text-[10px] font-black uppercase text-amber-400">
                            <span>Asignar Cobertura</span>
                            <ArrowRight size={11} />
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[9px] text-[var(--text3)] pt-0.5">
                          <Clock size={10} />
                          <span>
                            {new Date(n.fecha).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                      </div>

                      {/* Botón para descartar / borrar notificación */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, n.id)}
                        className="absolute top-3 right-3 text-[var(--text3)] hover:text-[var(--rojo)] p-1 rounded hover:bg-black/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Descartar notificación"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer de Estado de Conexión Realtime */}
          <div className="p-2.5 bg-[var(--bg)]/90 border-t border-[var(--border)] px-4 flex items-center justify-between text-[10px] text-[var(--text3)] shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--verde)] animate-ping" />
              <span>Sincronización en Tiempo Real</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[var(--text3)] hover:text-[var(--text)] font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
