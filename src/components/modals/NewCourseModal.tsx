"use client";

import { useEffect, useState, useMemo } from "react";
import { account } from "@/lib/appwrite";
import { saveCurso, checkCursoExists, logAction } from "@/lib/dataService";
import { X, AlertCircle, Sparkles, Compass, Calendar, Layers, Clock } from "lucide-react";
import { 
  ORIENTACIONES_OFICIALES, 
  DIVISIONES_OFICIALES, 
  TURNOS_OFICIALES, 
  formatOfficialCourseName, 
  OrientacionItem 
} from "@/lib/curriculum";

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export default function NewCourseModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [isGuidedMode, setIsGuidedMode] = useState(true);

  // Estados del Constructor Guiado Oficial
  const [orientacionId, setOrientacionId] = useState<string>("ciclo_basico");
  const [anio, setAnio] = useState<string>("1°");
  const [division, setDivision] = useState<string>("1ra");
  const [turno, setTurno] = useState<"Mañana" | "Tarde" | "Doble Turno">("Mañana");

  // Estado para modo manual
  const [nombreManual, setNombreManual] = useState("");
  const [error, setError] = useState("");

  const orientacionActual = useMemo<OrientacionItem>(() => {
    return ORIENTACIONES_OFICIALES.find(o => o.id === orientacionId) || ORIENTACIONES_OFICIALES[0];
  }, [orientacionId]);

  // Actualizar año si la orientación cambia y el año no es compatible
  useEffect(() => {
    if (!orientacionActual.anios.includes(anio)) {
      setAnio(orientacionActual.anios[0]);
    }
  }, [orientacionActual, anio]);

  // Nombre resultante sugerido
  const nombreGenerado = useMemo(() => {
    if (!isGuidedMode) return nombreManual.trim();
    return formatOfficialCourseName(anio, division, orientacionActual.shortName, turno);
  }, [isGuidedMode, anio, division, orientacionActual, turno, nombreManual]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const finalName = nombreGenerado.trim();
    if (!finalName) { 
      setError("Por favor configurá el nombre del curso."); 
      return; 
    }

    setLoading(true);
    try {
      const exists = await checkCursoExists(finalName);
      if (exists) { 
        setError(`El curso "${finalName}" ya se encuentra registrado en el sistema.`); 
        setLoading(false); 
        return; 
      }

      await saveCurso({ nombre: finalName });

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(userEmail, "CREAR_CURSO", `Curso: ${finalName}`);

      onSuccess();
      onClose();
      setNombreManual("");
    } catch { 
      setError("Error al guardar el curso. Intentá de nuevo."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] overflow-y-auto custom-scrollbar mt-auto sm:mt-0">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-black title-font text-[var(--text)]">Agregar Nuevo Curso</h2>
            <p className="text-[var(--text2)] text-xs mt-1 font-bold uppercase tracking-wider">
              Configurá Orientación, Año y División oficial
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Selector de Modo: Constructor Guiado vs Tipeo Libre */}
        <div className="flex p-1 bg-[var(--bg3)] border border-[var(--border)] rounded-2xl mt-4">
          <button
            type="button"
            onClick={() => setIsGuidedMode(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              isGuidedMode ? "bg-[var(--verde)] text-black shadow-sm" : "text-[var(--text2)] hover:text-[var(--text)]"
            }`}
          >
            <Sparkles size={13} />
            <span>Por Orientación, Año y Div.</span>
          </button>
          <button
            type="button"
            onClick={() => setIsGuidedMode(false)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              !isGuidedMode ? "bg-[var(--verde)] text-black shadow-sm" : "text-[var(--text2)] hover:text-[var(--text)]"
            }`}
          >
            <span>Texto Personalizado</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mt-4">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {isGuidedMode ? (
            <>
              {/* 1. Orientación / Especialidad */}
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2 flex items-center gap-1.5">
                  <Compass size={12} className="text-[var(--verde)]" />
                  <span>1. Orientación / Especialidad</span>
                </label>
                <select
                  required
                  value={orientacionId}
                  onChange={(e) => setOrientacionId(e.target.value)}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3.5 outline-none font-bold text-xs sm:text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer"
                >
                  {ORIENTACIONES_OFICIALES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.tipo})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Año y División en Grid de 2 Columnas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2 flex items-center gap-1.5">
                    <Calendar size={12} className="text-[var(--verde)]" />
                    <span>2. Año</span>
                  </label>
                  <select
                    required
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3.5 outline-none font-bold text-xs sm:text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer"
                  >
                    {orientacionActual.anios.map((a) => (
                      <option key={a} value={a}>
                        {a} Año
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2 flex items-center gap-1.5">
                    <Layers size={12} className="text-[var(--verde)]" />
                    <span>3. División</span>
                  </label>
                  <select
                    required
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3.5 outline-none font-bold text-xs sm:text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer"
                  >
                    {DIVISIONES_OFICIALES.map((d) => (
                      <option key={d} value={d}>
                        División {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Turno Horario */}
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2 flex items-center gap-1.5">
                  <Clock size={12} className="text-[var(--verde)]" />
                  <span>4. Turno Horario</span>
                </label>
                <select
                  required
                  value={turno}
                  onChange={(e) => setTurno(e.target.value as "Mañana" | "Tarde" | "Doble Turno")}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3.5 outline-none font-bold text-xs sm:text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer"
                >
                  {TURNOS_OFICIALES.map((t) => (
                    <option key={t} value={t}>
                      Turno {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vista Previa del Nombre Oficial */}
              <div className="p-3.5 rounded-2xl bg-[var(--verde-bg)]/30 border border-[var(--verde-border)] space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--verde)] block">
                  Nombre Oficial del Curso:
                </span>
                <span className="font-mono font-black text-sm text-[var(--text)] block">
                  {nombreGenerado}
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Nombre del Curso / División</label>
                <input required type="text" placeholder="Ej: 6to 1ra - Informática (Mañana)"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                  value={nombreManual} onChange={(e) => setNombreManual(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Turno Horario</label>
                <select required
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                  value={turno} onChange={(e) => setTurno(e.target.value as "Mañana" | "Tarde" | "Doble Turno")}>
                  <option value="Mañana">Mañana (Turno Mañana)</option>
                  <option value="Tarde">Tarde (Turno Tarde)</option>
                  <option value="Doble Turno">Doble Turno (Mañana y Tarde)</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] text-[var(--text)] transition-all active:scale-95 text-xs sm:text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all text-xs sm:text-sm">
              {loading ? "Guardando..." : "Crear Curso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
