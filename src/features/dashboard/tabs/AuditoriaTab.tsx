"use client";

import React, { useState, useMemo } from "react";
import { Search, Clock, ShieldCheck, Activity } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";

interface LogEntry {
  usuarioEmail: string;
  accion: string;
  detalles: string;
  fecha: string;
}

interface AuditoriaTabProps {
  logs: LogEntry[];
}

export const AuditoriaTab: React.FC<AuditoriaTabProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("todas");

  // Lista única de acciones para el selector de filtro
  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.accion) set.add(l.accion.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtrado de logs por búsqueda y acción
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return logs.filter(log => {
      const matchAction = selectedAction === "todas" || (log.accion && log.accion.trim().toUpperCase() === selectedAction);
      if (!matchAction) return false;
      if (!q) return true;
      return (
        (log.usuarioEmail || "").toLowerCase().includes(q) ||
        (log.accion || "").toLowerCase().includes(q) ||
        (log.detalles || "").toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery, selectedAction]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black title-font flex items-center gap-3 text-[var(--text)]">
            <span className="p-2.5 rounded-2xl bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] inline-flex items-center justify-center">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </span>
            Logs de Seguridad y Auditoría
          </h2>
          <p className="text-[var(--text2)] text-sm mt-1">Historial cronológico de acciones ejecutadas en la plataforma.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-xs font-bold text-[var(--text2)] self-start sm:self-center">
          <Activity size={14} className="text-[var(--verde)]" />
          <span>{filteredLogs.length} eventos registrados</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Buscar por usuario, acción o detalles..."
            className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-2xl py-3 pl-11 pr-4 outline-none font-bold text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {uniqueActions.length > 0 && (
          <div className="sm:w-56">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-2xl py-3 px-4 outline-none font-bold text-xs text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer shadow-sm"
            >
              <option value="todas">Todas las acciones ({logs.length})</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VISTA MÓVIL (< md): Tarjetas completas con visualización total de detalles */}
      <div className="md:hidden space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="card glass rounded-2xl border border-[var(--border)] p-10 text-center text-[var(--text3)] italic text-sm">
            No se encontraron registros de auditoría.
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className="card glass rounded-2xl border border-[var(--border)] p-4 space-y-3 bg-[var(--bg2)]/60 shadow-sm">
              {/* Usuario y Acción */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar email={log.usuarioEmail} name={log.usuarioEmail ? log.usuarioEmail.split("@")[0] : "Usuario"} size={32} showRing={false} />
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[var(--text)] truncate">{log.usuarioEmail}</div>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase font-mono tracking-wider bg-[var(--bg3)] text-[var(--verde)] border border-[var(--verde-border)]">
                  {log.accion}
                </span>
              </div>

              {/* Contenedor de Detalles (Texto completo sin recortes) */}
              <div className="p-3 rounded-xl bg-[var(--bg3)]/60 border border-[var(--border)] text-xs text-[var(--text)] font-medium leading-relaxed break-words">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)] block mb-1">Detalles:</span>
                {log.detalles || "Sin detalles adicionales"}
              </div>

              {/* Fecha y Hora */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text3)] pt-1 border-t border-[var(--border)]/40">
                <Clock size={12} className="shrink-0 text-[var(--verde)]" />
                <span>{new Date(log.fecha).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "medium" })}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* VISTA ESCRITORIO (>= md): Tabla completa con scroll horizontal garantizado */}
      <div className="hidden md:block card glass rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[760px]">
            <thead className="bg-[var(--bg3)]/80 border-b border-[var(--border)]">
              <tr>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-[var(--text2)] w-[240px]">Usuario</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-[var(--text2)] w-[140px]">Acción</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-[var(--text2)]">Detalles</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-[var(--text2)] w-[180px] whitespace-nowrap">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-[var(--text3)] italic">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-none hover:bg-[var(--bg3)]/20 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <UserAvatar email={log.usuarioEmail} name={log.usuarioEmail ? log.usuarioEmail.split("@")[0] : "Usuario"} size={32} showRing={false} />
                        <span className="font-bold text-xs text-[var(--text)] truncate max-w-[200px]" title={log.usuarioEmail}>
                          {log.usuarioEmail}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider bg-[var(--bg3)] text-[var(--verde)] border border-[var(--verde-border)] shadow-sm">
                        {log.accion}
                      </span>
                    </td>
                    <td className="p-5 text-xs text-[var(--text)] font-medium leading-relaxed break-words max-w-[400px]">
                      {log.detalles}
                    </td>
                    <td className="p-5 text-xs font-semibold text-[var(--text2)] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={12} className="text-[var(--text3)] shrink-0" />
                        {new Date(log.fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "medium" })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaTab;
