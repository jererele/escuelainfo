import React from "react";
import { ChevronRight } from "lucide-react";
import { Ausencia, Horario, Alumno } from "@/lib/dataService";
import FreeHoursWidget from "../widgets/FreeHoursWidget";
import ContactForm from "@/components/ContactForm";
import { TiltCard, GravityText, FluidOrb } from "@/components/ui/rare";

interface GeneralTabProps {
  stats: { hoy: number; pendientes: number; total: number };
  ausencias: Ausencia[];
  horarios: Horario[];
  canManageAusencias: boolean;
  currentAlumno?: Alumno | null;
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
  userProfile,
  onNavigateToAusencias,
  onNavigateToHorarios,
  onOpenNewAbsenceModal,
  onOpenProfile,
  showToast,
}) => {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* BANNER DE BIENVENIDA CON RARE UI (GravityText + FluidOrb) */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-[32px] border border-[var(--border)] bg-[var(--bg2)] shadow-md">
        <FluidOrb color="rgba(16, 185, 129, 0.22)" size={320} className="-top-24 -right-16" />
        <FluidOrb color="rgba(99, 102, 241, 0.16)" size={260} className="-bottom-20 left-1/4" />
        <div className="relative z-10">
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
        {[
          { label: "Ausentes Hoy", value: stats.hoy, color: "var(--rojo)", glowColor: "rgba(239, 68, 68, 0.16)", action: () => onNavigateToAusencias("") },
          { label: "Pendientes", value: stats.pendientes, color: "var(--amarillo)", glowColor: "rgba(245, 158, 11, 0.16)", action: () => onNavigateToAusencias("") },
          { label: "Total Registros", value: stats.total, color: "var(--verde)", glowColor: "rgba(16, 185, 129, 0.16)", action: () => onNavigateToAusencias("") },
        ].map((stat, i) => (
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
        isStudent={false}
        currentAlumno={currentAlumno}
        ausencias={ausencias}
        horarios={horarios}
        onNavigateToAusencias={onNavigateToAusencias}
        onNavigateToHorarios={onNavigateToHorarios}
      />

      {/* LISTA COMPACTA */}
      <div className="bg-[var(--bg3)] rounded-[32px] border border-[var(--border)] overflow-hidden shadow-md">
        <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="title-font font-black text-xl text-[var(--text)]">Novedades Recientes</h2>
          {canManageAusencias && (
            <button 
              onClick={onOpenNewAbsenceModal}
              className="w-full md:w-auto bg-[var(--verde)] text-black font-black text-sm px-8 py-3.5 rounded-2xl shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-95 transition-all"
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
              {ausencias.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-20 text-center text-[var(--text3)] italic">
                    No hay registros recientes.
                  </td>
                </tr>
              ) : (
                ausencias.slice(0, 5).map((a) => (
                  <tr 
                    key={a.id} 
                    onClick={() => onNavigateToAusencias(a.profNombre)}
                    className="hover:bg-[var(--bg3)] transition-colors border-b border-[var(--border)] last:border-none cursor-pointer group"
                    title={`Ver ausencias de ${a.profNombre}`}
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
