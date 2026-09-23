import React, { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Ausencia, Horario, Alumno, Profesor } from "@/lib/dataService";
import FreeHoursWidget from "../widgets/FreeHoursWidget";
import ContactForm from "@/components/ContactForm";
import { TiltCard, GravityText } from "@/components/ui/rare";

interface GeneralTabProps {
  stats: { hoy: number; pendientes: number; total: number };
  ausencias: Ausencia[];
  horarios: Horario[];
  canManageAusencias: boolean;
  currentAlumno?: Alumno | null;
  currentProfesor?: Profesor | null;
  userProfile?: any;
  onNavigateToAusencias: (search?: string) => void;
  onNavigateToHorarios: (curso: string) => void;
  onOpenNewAbsenceModal: () => void;
  onOpenProfile?: () => void;
  showToast: (message: string, type?: "success" | "error") => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  stats,
  ausencias,
  horarios,
  canManageAusencias,
  currentAlumno,
  currentProfesor,
  userProfile,
  onNavigateToAusencias,
  onNavigateToHorarios,
  onOpenNewAbsenceModal,
  onOpenProfile,
  showToast,
}) => {
  const isTeacher = userProfile?.rol === 'profesor';

  // Si el usuario es profesor, filtrar novedades para mostrar ÚNICAMENTE sus propios registros
  const displayedAusencias = useMemo(() => {
    if (isTeacher) {
      const targetId = currentProfesor?.id ? String(currentProfesor.id) : null;
      const targetNombre = currentProfesor?.nombre?.trim().toLowerCase() || userProfile?.nombre?.trim().toLowerCase() || "";

      return ausencias.filter(a => {
        const idMatches = targetId && a.profId && String(a.profId) === targetId;
        const nameMatches = targetNombre && a.profNombre && a.profNombre.trim().toLowerCase() === targetNombre;
        return Boolean(idMatches || nameMatches);
      });
    }
    return ausencias;
  }, [ausencias, isTeacher, currentProfesor, userProfile?.nombre]);

  const statCards = [
    {
      label: isTeacher ? "Mis Ausencias Hoy" : "Ausentes Hoy",
      value: stats.hoy,
      color: "var(--rojo)",
      glowColor: "rgba(239, 68, 68, 0.16)",
      action: () => onNavigateToAusencias("")
    },
    {
      label: isTeacher ? "Mis Pendientes" : "Pendientes",
      value: stats.pendientes,
      color: "var(--amarillo)",
      glowColor: "rgba(245, 158, 11, 0.16)",
      action: () => onNavigateToAusencias("")
    },
    {
      label: isTeacher ? "Mis Registros Totales" : "Total Registros",
      value: stats.total,
      color: "var(--verde)",
      glowColor: "rgba(16, 185, 129, 0.16)",
      action: () => onNavigateToAusencias("")
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* BANNER DE BIENVENIDA */}
      <div className="p-6 sm:p-8 rounded-[32px] border border-[var(--border)] bg-[var(--bg2)] shadow-md">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black title-font text-[var(--text)] tracking-tight">
            <GravityText text="Escuela 713" className="text-[var(--verde)]" />
            <span className="ml-2 font-normal text-[var(--text2)]">· Sistema de Gestión</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[var(--text3)] mt-2 max-w-xl">
            Control de asistencias, licencias docentes y novedades en tiempo real con sincronización directa.
          </p>
        </div>
      </div>

      {stats.pendientes > 0 && canManageAusencias && (
        <div className="bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onNavigateToAusencias("")}>
          <div className="flex items-center gap-3 text-[var(--amarillo)]">
            <span className="text-2xl"></span>
            <div>
              <h4 className="font-black text-sm">Aviso General: Licencias Pendientes</h4>
              <p className="text-xs font-semibold">Hay {stats.pendientes} solicitud(es) de licencia esperando revisión directiva.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-[var(--amarillo)]" />
        </div>
      )}
      
      {/* STATS CON TILT CARDS DE RARE UI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
        {statCards.map((stat, i) => (
          <TiltCard 
            key={i} 
            glowColor={stat.glowColor}
            onClick={stat.action}
            className="p-5 sm:p-7 group"
          >
            <div className="text-3xl sm:text-5xl font-black mb-1.5 transition-transform group-hover:scale-105 origin-left" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-[9px] sm:text-[11px] uppercase tracking-widest font-black text-[var(--text3)] flex items-center justify-between">
              <span>{stat.label}</span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--verde)]" />
            </div>
          </TiltCard>
        ))}
      </div>

      {/* HORAS LIBRES DEL DÍA */}
      <FreeHoursWidget 
        isStudent={userProfile?.rol === 'alumno'}
        currentAlumno={currentAlumno}
        ausencias={ausencias}
        horarios={horarios}
        onNavigateToAusencias={onNavigateToAusencias}
        onNavigateToHorarios={onNavigateToHorarios}
      />

      {/* LISTA COMPACTA */}
      <div className="bg-[var(--bg3)] rounded-[32px] border border-[var(--border)] overflow-hidden shadow-md">
        <div className="p-6 sm:p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="title-font font-black text-xl text-[var(--text)]">
              {isTeacher ? "Mis Novedades Recientes" : "Novedades Recientes"}
            </h2>
            {isTeacher && (
              <p className="text-xs text-[var(--text2)] mt-0.5 font-medium">
                Control exclusivo de tus licencias, ausencias y justificaciones registradas.
              </p>
            )}
          </div>
          {canManageAusencias && (
            <button 
              onClick={onOpenNewAbsenceModal}
              className="w-full md:w-auto bg-[var(--verde)] text-black font-black text-sm px-8 py-3.5 rounded-2xl shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-95 transition-all cursor-pointer"
            >
              + Registrar Ausencia
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg4)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text3)] tracking-[0.2em]">Profesor</th>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text3)] tracking-[0.2em]">Tipo</th>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text3)] tracking-[0.2em]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {displayedAusencias.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-16 text-center text-[var(--text3)] italic">
                    {isTeacher
                      ? "No tenés licencias o novedades registradas recientemente."
                      : "No hay registros recientes."}
                  </td>
                </tr>
              ) : (
                displayedAusencias.slice(0, 5).map((a) => (
                  <tr 
                    key={a.id} 
                    onClick={() => onNavigateToAusencias(isTeacher ? undefined : a.profNombre)}
                    className="hover:bg-[var(--bg3)] transition-colors border-b border-[var(--border)] last:border-none cursor-pointer group"
                    title={isTeacher ? "Ver detalle de mi licencia" : `Ver ausencias de ${a.profNombre}`}
                  >
                    <td className="p-6 font-bold text-[var(--text)] group-hover:text-[var(--verde)] transition-colors flex items-center gap-2">
                      <span>{a.profNombre}</span>
                      <span className="text-[10px] text-[var(--text3)] font-normal group-hover:translate-x-1 transition-transform">→</span>
                    </td>
                    <td className="p-6 text-sm text-[var(--text2)]">{a.tipo}</td>
                    <td className="p-6">
                      <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${
                        a.estado === 'aprobada' ? 'bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]' : 
                        a.estado === 'pendiente' ? 'bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]' : 
                        'bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)]'
                      }`}>
                        {a.estado === 'rechazada' ? 'reprobada' : a.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORMULARIO DE CONSULTAS CONTROLADO */}
      <div className="mt-12 max-w-2xl mx-auto animate-fade-in">
        <ContactForm showToast={showToast} />
      </div>
    </div>
  );
};

export default GeneralTab;
