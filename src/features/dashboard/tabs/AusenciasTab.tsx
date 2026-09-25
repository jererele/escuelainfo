import React, { useMemo } from "react";
import { Search, ShieldAlert, AlertTriangle, FileText, Trash2, Paperclip, Clock, Check } from "lucide-react";
import { Ausencia, Profesor, UserProfile, saveAusencia, logAction, getCertificateFileUrl, calculateAbsenceDays } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";

interface AusenciasTabProps {
  ausencias: Ausencia[];
  filteredAusencias: Ausencia[];
  currentProfesor?: Profesor | null;
  userProfile: UserProfile | null;
  user: any;
  isAdmin: boolean;
  canManageAusencias: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenAbsenceModal: () => void;
  onOpenTeacherReportModal: (tipo: string) => void;
  onChangeStatus: (id: string, status: "pendiente" | "aprobada" | "rechazada") => void;
  onDeleteAbsence: (id: string) => void;
  askConfirm: (
    message: string,
    onConfirm: () => void,
    options?: { title?: string; confirmText?: string; cancelText?: string; variant?: "danger" | "success" | "warning" | "info" }
  ) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  onRefreshAusencias: () => void;
}

export const AusenciasTab: React.FC<AusenciasTabProps> = ({
  ausencias,
  filteredAusencias,
  currentProfesor,
  userProfile,
  user,
  isAdmin,
  canManageAusencias,
  searchQuery,
  setSearchQuery,
  onOpenAbsenceModal,
  onOpenTeacherReportModal,
  onChangeStatus,
  onDeleteAbsence,
  askConfirm,
  showToast,
  onRefreshAusencias,
}) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Cupos anuales del profesor logueado
  const teacherQuotas = useMemo(() => {
    if (!currentProfesor) return null;
    const targetId = String(currentProfesor.id);
    const targetNombre = currentProfesor.nombre.trim().toLowerCase();

    const profAbsences = ausencias.filter(a => {
      const matches = (a.profId && String(a.profId) === targetId) ||
        (a.profNombre && a.profNombre.trim().toLowerCase() === targetNombre);
      if (!matches) return false;
      if (a.estado === "rechazada") return false;
      const y = a.inicio ? parseInt(a.inicio.slice(0, 4), 10) : (a.fechaReg ? new Date(a.fechaReg).getFullYear() : currentYear);
      return y === currentYear;
    });

    const calcUsed = (pattern: string, detail: string) => {
      let days = 0;
      profAbsences.forEach(a => {
        const m = (a.motivo || "").toLowerCase();
        if (m.includes(pattern) || m.includes(detail)) {
          days += calculateAbsenceDays(a.inicio, a.fin);
        }
      });
      return days;
    };

    const art15Used = calcUsed("art. 15", "particulares");
    const art14Used = calcUsed("art. 14", "familiar enfermo");
    const art50Used = calcUsed("art. 50", "corta duración");

    return {
      art15: { max: 6, used: art15Used, remaining: Math.max(0, 6 - art15Used) },
      art14: { max: 20, used: art14Used, remaining: Math.max(0, 20 - art14Used) },
      art50: { max: 30, used: art50Used, remaining: Math.max(0, 30 - art50Used) },
    };
  }, [currentProfesor, ausencias, currentYear]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* PANEL DE AUTOGESTIÓN DOCENTE (Solo para Profesores) */}
      {userProfile?.rol === 'profesor' && currentProfesor && (
        <div className="card glass p-6 sm:p-8 rounded-[32px] border border-[var(--border)] space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="title-font font-black text-xl">Autogestión Docente</h2>
              <p className="text-xs text-[var(--text2)] mt-1">
                Gestioná rápidamente tu asistencia, licencias, paros o avisos urgentes.
              </p>
            </div>
            {teacherQuotas && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-xs flex items-center gap-2" title="Art. 15 - Razones Particulares">
                  <span className="font-mono font-black text-[var(--verde)]">Art. 15</span>
                  <span className="text-[var(--text2)] font-semibold">
                    <strong className="text-[var(--text)]">{teacherQuotas.art15.remaining}</strong>/6 d. libres
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-xs flex items-center gap-2" title="Art. 14 - Familiar Enfermo">
                  <span className="font-mono font-black text-[var(--azul)]">Art. 14</span>
                  <span className="text-[var(--text2)] font-semibold">
                    <strong className="text-[var(--text)]">{teacherQuotas.art14.remaining}</strong>/20 d. libres
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-xs flex items-center gap-2" title="Art. 50 - Enfermedad Corta Duración">
                  <span className="font-mono font-black text-amber-500">Art. 50</span>
                  <span className="text-[var(--text2)] font-semibold">
                    <strong className="text-[var(--text)]">{teacherQuotas.art50.remaining}</strong>/30 d. libres
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* BOTÓN ADHESIÓN AL PARO */}
            <button
              onClick={() => {
                askConfirm("¿Confirmás tu adhesión al Paro Docente para el día de hoy? Esto marcará automáticamente tus materias de hoy como Hora Libre.", async () => {
                  try {
                    const todayStr = new Date().toLocaleDateString("en-CA");
                    const alreadyLogged = ausencias.some(a => 
                      a.profNombre === currentProfesor.nombre && 
                      todayStr >= a.inicio && 
                      todayStr <= a.fin
                    );

                    if (alreadyLogged) {
                      showToast("Ya tenés una inasistencia o paro reportado para hoy.", "error");
                      return;
                    }

                    const newAbsence: Ausencia = {
                      profId: currentProfesor.id!,
                      profNombre: currentProfesor.nombre,
                      tipo: "Paro Docente",
                      inicio: todayStr,
                      fin: todayStr,
                      materias: currentProfesor.materias || [],
                      motivo: "Medida de fuerza gremial / Adhesión al Paro Docente",
                      cert: false,
                      estado: "aprobada",
                      fechaReg: new Date().toISOString()
                    };

                    await saveAusencia(newAbsence);
                    await logAction(user?.email || "desconocido", "REGISTRAR_PARO_DOCENTE", `Profesor: ${currentProfesor.nombre}`);
                    onRefreshAusencias();
                    showToast("Adhesión al paro registrada con éxito", "success");
                  } catch (err) {
                    showToast("Error al registrar adhesión", "error");
                  }
                });
              }}
              className="p-5 rounded-2xl bg-[var(--rojo-bg)]/20 border border-[var(--rojo-border)] hover:bg-[var(--rojo-bg)]/30 active:scale-95 transition-all text-left flex flex-col gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--rojo-bg)] text-[var(--rojo)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[var(--text)]">Adherirse al Paro</h4>
                <p className="text-[11px] text-[var(--text2)] mt-0.5">Notifica al instante adhesión a medida de fuerza.</p>
              </div>
            </button>

            {/* BOTÓN AVISO DE SUSPENSIÓN URGENTE */}
            <button
              onClick={() => {
                onOpenTeacherReportModal("Suspensión (Fuerza Mayor)");
              }}
              className="p-5 rounded-2xl bg-[var(--amarillo-bg)]/20 border border-[var(--amarillo-border)] hover:bg-[var(--amarillo-bg)]/30 active:scale-95 transition-all text-left flex flex-col gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--amarillo-bg)] text-[var(--amarillo)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[var(--text)]">Suspensión Urgente</h4>
                <p className="text-[11px] text-[var(--text2)] mt-0.5">Informa inasistencia de último momento por fuerza mayor.</p>
              </div>
            </button>

            {/* BOTÓN SOLICITAR AUSENCIA */}
            <button
              onClick={onOpenAbsenceModal}
              className="p-5 rounded-2xl bg-[var(--verde-bg)]/20 border border-[var(--verde-border)] hover:bg-[var(--verde-bg)]/30 active:scale-95 transition-all text-left flex flex-col gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[var(--text)]">Solicitar Ausencia</h4>
                <p className="text-[11px] text-[var(--text2)] mt-0.5">Solicita una licencia sujeta a la aprobación directiva.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* BARRA DE FILTRO Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--bg2)] p-4 rounded-[24px] border border-[var(--border)]">
        <div className="relative w-full md:w-96">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]"><Search size={20} /></span>
          <input 
            type="text" 
            placeholder={userProfile?.rol === 'profesor' ? "Buscar en mi historial de inasistencias..." : "Buscar por profesor o tipo..."} 
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[var(--verde)] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {canManageAusencias && (
            <button 
              onClick={onOpenAbsenceModal} 
              className="w-full md:w-auto bg-black text-white dark:bg-white dark:text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all cursor-pointer"
            >
              + Nuevo Registro
            </button>
          )}
        </div>
      </div>

      {/* TABLA PRINCIPAL DE AUSENCIAS */}
      <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg3)]/50">
              <tr>
                <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Profesor</th>
                <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Detalles</th>
                <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Fechas</th>
                <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Estado</th>
                {isAdmin && (
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAusencias.map((a) => {
                const isOwnRecord = userProfile?.rol === 'profesor' ||
                  (currentProfesor && a.profId && String(a.profId) === String(currentProfesor.id)) ||
                  (userProfile?.nombre && a.profNombre.toLowerCase() === userProfile.nombre.toLowerCase());
                // Los certificados médicos y detalles sensibles solo pueden ser vistos por el propio docente o el Equipo Directivo/Admin
                const canViewMedicalCert = canManageAusencias || isOwnRecord;

                return (
                <tr key={a.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)]">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={a.profNombre} size={36} showRing={false} />
                      <div>
                        {userProfile?.rol === 'profesor' ? (
                          <span className="font-bold text-[var(--text)]">{a.profNombre}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSearchQuery(a.profNombre)}
                            className="font-bold text-[var(--text)] hover:text-[var(--verde)] hover:underline transition-colors text-left cursor-pointer"
                            title={`Filtrar por ${a.profNombre}`}
                          >
                            {a.profNombre}
                          </button>
                        )}
                        <div className="text-[10px] text-[var(--text3)] uppercase font-bold tracking-tighter">
                          {Array.isArray(a.materias) ? a.materias.join(", ") : a.materias}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="text-sm font-medium">{a.tipo}</div>
                    <div className="text-xs text-[var(--text2)] italic">
                      {canViewMedicalCert 
                        ? (a.motivo || "Sin motivo especificado") 
                        : "Motivo confidencial · Reservado a Directivos"}
                    </div>
                    {a.certFileId && canViewMedicalCert && (
                      <div className="mt-1.5">
                        <a 
                          href={getCertificateFileUrl(a.certFileId)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[9px] font-black uppercase text-[var(--verde)] hover:bg-[var(--verde)] hover:text-black transition-all"
                          title="Ver archivo adjunto"
                        >
                          <Paperclip size={11} className="shrink-0" />
                          <span>Ver Certificado</span>
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="text-xs font-bold text-[var(--text2)]">Del {a.inicio}</div>
                    <div className="text-xs font-bold text-[var(--text2)]">Al {a.fin}</div>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-1.5 items-center">
                      {[
                        { value: "pendiente", label: "Pendiente", activeClass: "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]", inactiveClass: "bg-transparent text-[var(--text3)] border-[var(--border)] hover:bg-[var(--bg3)] hover:text-[var(--text)]" },
                        { value: "aprobada", label: "Aprobado", activeClass: "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] font-black", inactiveClass: "bg-transparent text-[var(--text3)] border-[var(--border)] hover:bg-[var(--bg3)] hover:text-[var(--text)]" },
                        { value: "rechazada", label: "Rechazado", activeClass: "bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)] font-black", inactiveClass: "bg-transparent text-[var(--text3)] border-[var(--border)] hover:bg-[var(--bg3)] hover:text-[var(--text)]" }
                      ].map((opt) => {
                        const isSelected = a.estado === opt.value;
                        const isEditable = canManageAusencias && a.estado === "pendiente";
                        if (!isEditable && !isSelected) return null;
                        
                        return (
                          <button
                            key={opt.value}
                            disabled={!isEditable}
                            onClick={() => {
                              if (opt.value === "pendiente") return;
                              const isAprobar = opt.value === "aprobada";
                              const verb = isAprobar ? "aprobar" : "rechazar";
                              const btnText = isAprobar ? "Aprobar" : "Rechazar";
                              const variant = isAprobar ? "success" : "danger";
                              const title = isAprobar ? "Aprobar Licencia" : "Rechazar Licencia";

                              askConfirm(
                                `¿Estás seguro de ${verb} esta licencia?`,
                                () => {
                                  onChangeStatus(a.id!, opt.value as any);
                                },
                                {
                                  title,
                                  confirmText: btnText,
                                  variant,
                                }
                              );
                            }}
                            className={`px-2 py-1 text-[9px] font-black uppercase rounded border transition-all duration-150 shrink-0 ${
                              !isEditable ? "cursor-default opacity-80" : "active:scale-95 cursor-pointer"
                            } ${
                              isSelected ? opt.activeClass : opt.inactiveClass
                            }`}
                          >
                            {opt.label === "Rechazado" && !canManageAusencias ? "Reprobada" : opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  {canManageAusencias && (
                    <td className="p-5 text-right space-x-2">
                      <button 
                        onClick={() => onDeleteAbsence(a.id!)}
                        className="p-2 hover:bg-[var(--rojo-bg)] text-[var(--rojo)] rounded-lg transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AusenciasTab;
