import React from "react";
import { ChevronRight } from "lucide-react";
import { Ausencia, Horario, Alumno } from "@/lib/dataService";
import FreeHoursWidget from "../widgets/FreeHoursWidget";
import ContactForm from "@/components/ContactForm";

interface GeneralTabProps {
  stats: { hoy: number; pendientes: number; total: number };
  ausencias: Ausencia[];
  horarios: Horario[];
  canManageAusencias: boolean;
  currentAlumno?: Alumno | null;
  onNavigateToAusencias: (search?: string) => void;
  onNavigateToHorarios: (curso: string) => void;
  onOpenNewAbsenceModal: () => void;
  showToast: (message: string, type?: "success" | "error") => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  stats,
  ausencias,
  horarios,
  canManageAusencias,
  currentAlumno,
  onNavigateToAusencias,
  onNavigateToHorarios,
  onOpenNewAbsenceModal,
  showToast,
}) => {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 md:gap-8">
        {[
          { label: "Ausentes Hoy", value: stats.hoy, color: "var(--rojo)", bg: "var(--rojo-bg)", action: () => onNavigateToAusencias("") },
          { label: "Pendientes", value: stats.pendientes, color: "var(--amarillo)", bg: "var(--amarillo-bg)", action: () => onNavigateToAusencias("") },
          { label: "Total Registros", value: stats.total, color: "var(--verde)", bg: "var(--verde-bg)", action: () => onNavigateToAusencias("") },
        ].map((stat, i) => (
          <button 
            key={i} 
            type="button"
            onClick={stat.action}
            className="p-3 sm:p-6 rounded-2xl sm:rounded-[28px] border border-[var(--border)] bg-[var(--bg3)]/80 backdrop-blur-md group cursor-pointer text-center sm:text-left shadow-sm hover:scale-[1.02] hover:border-[var(--verde)] transition-all duration-300 active:scale-95"
            title={`Ver ${stat.label} en ausencias`}
          >
            <div className="text-xl sm:text-4xl font-black mb-0.5 sm:mb-1 transition-transform group-hover:scale-110 origin-left" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-[7px] sm:text-[11px] uppercase tracking-widest font-black text-[var(--text3)] leading-tight flex items-center justify-between">
              <span>{stat.label}</span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block text-[var(--verde)]" />
            </div>
          </button>
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
      <div className="bg-[var(--bg3)]/80 backdrop-blur-md rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm content-visibility-auto will-change-gpu">
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
            <thead className="bg-[var(--bg2)]">
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
      <div className="mt-12 max-w-2xl mx-auto animate-fade-in content-visibility-auto will-change-gpu">
        <ContactForm showToast={showToast} />
      </div>
    </div>
  );
};

export default GeneralTab;
