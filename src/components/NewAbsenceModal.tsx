"use client";

import { useState, useEffect, useRef } from "react";
import { account } from "@/lib/appwrite";
import { saveAusencia, Ausencia, getProfesores, Profesor, logAction, uploadCertificateFile, deleteCertificateFile } from "@/lib/dataService";
import { X, AlertCircle, Search, ChevronDown, Upload, Check } from "lucide-react";

interface NewAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lockedProfesor?: Profesor;
}

// ——— Catálogo local de artículos (fácilmente reemplazable por consulta a Appwrite) ———
const ARTICULOS_LICENCIA = [
  { codigo: "Art. 14", detalle: "Familiar Enfermo", limite: "Máx. 20 días/año" },
  { codigo: "Art. 15", detalle: "Razones Particulares", limite: "Máx. 6 días/año" },
  { codigo: "Art. 16", detalle: "Donación de Sangre", limite: "1 día" },
  { codigo: "Art. 17", detalle: "Mudanza", limite: "Máx. 2 días" },
  { codigo: "Art. 18", detalle: "Examen Universitario", limite: "Máx. 10 días/año" },
  { codigo: "Art. 19", detalle: "Fallecimiento Familiar Directo", limite: "Máx. 5 días" },
  { codigo: "Art. 20", detalle: "Fallecimiento Familiar Indirecto", limite: "Máx. 2 días" },
  { codigo: "Art. 21", detalle: "Casamiento", limite: "Máx. 10 días" },
  { codigo: "Art. 43", detalle: "Licencia Gremial", limite: "Según acuerdo sindical" },
  { codigo: "Art. 50", detalle: "Enfermedad Corta Duración", limite: "Máx. 30 días c/goce" },
  { codigo: "Art. 51", detalle: "Enfermedad Larga Duración", limite: "Máx. 2 años" },
  { codigo: "Art. 55", detalle: "Maternidad / Paternidad", limite: "Según normativa vigente" },
  { codigo: "Otro", detalle: "Otro Tipo de Artículo", limite: "" },
];

export default function NewAbsenceModal({ isOpen, onClose, onSuccess, lockedProfesor }: NewAbsenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [selectedProfId, setSelectedProfId] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    tipo: "Licencia Médica",
    inicio: "",
    fin: "",
    materias: "",
    motivo: "",
    cert: false
  });

  interface Feriado {
    fecha: string;
    tipo: string;
    nombre: string;
  }

  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const currentHoliday = (() => {
    if (!formData.inicio || !formData.fin) return null;
    return feriados.find(f => f.fecha >= formData.inicio && f.fecha <= formData.fin) || null;
  })();

  // — Estados para el buscador de artículos —
  const [articuloQuery, setArticuloQuery] = useState("");
  const [showArticuloDropdown, setShowArticuloDropdown] = useState(false);
  const articuloRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (articuloRef.current && !articuloRef.current.contains(e.target as Node)) {
        setShowArticuloDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowArticuloDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (lockedProfesor) {
        setSelectedProfId(lockedProfesor.id!);
        setFormData(prev => ({ ...prev, materias: lockedProfesor.materias.join(", ") }));
      } else {
        getProfesores().then(setProfesores);
      }
      // Resetear buscador al abrir
      setArticuloQuery("");
      setShowArticuloDropdown(false);

      // Fetch feriados nacionales
      fetch("/api/feriados")
        .then((res) => {
          if (!res.ok) throw new Error("Error loading holidays");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setFeriados(data);
          }
        })
        .catch((err) => console.error("Error al cargar feriados:", err));
    }
  }, [isOpen, lockedProfesor]);

  // Artículos filtrados por búsqueda
  const articulosFiltrados = ARTICULOS_LICENCIA.filter(a =>
    articuloQuery.trim() === ""
      ? true
      : `${a.codigo} ${a.detalle}`.toLowerCase().includes(articuloQuery.toLowerCase())
  );

  const handleSelectArticulo = (art: typeof ARTICULOS_LICENCIA[0]) => {
    const label = art.limite
      ? `${art.codigo} - ${art.detalle} (${art.limite})`
      : `${art.codigo} - ${art.detalle}`;
    setFormData(prev => ({ ...prev, motivo: label }));
    setArticuloQuery(art.codigo + " - " + art.detalle);
    setShowArticuloDropdown(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleProfChange = (id: string) => {
    setSelectedProfId(id);
    const prof = profesores.find(p => p.id === id);
    if (prof) setFormData(prev => ({ ...prev, materias: prof.materias.join(", ") }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedProfId) { setError("Seleccioná un profesor antes de continuar."); return; }

    if (currentHoliday) {
      setError(`No se puede registrar ausencias que contengan un día feriado: ${currentHoliday.nombre}`);
      return;
    }

    setLoading(true);
    const prof = lockedProfesor || profesores.find(p => p.id === selectedProfId);
    
    let uploadedFileId = "";
    if (formData.cert && selectedFile) {
      try {
        uploadedFileId = await uploadCertificateFile(selectedFile);
      } catch (err) {
        setError("Error al subir el archivo del certificado. Por favor, intentá de nuevo.");
        setLoading(false);
        return;
      }
    }

    try {
      const newAusencia: Ausencia = {
        profId: selectedProfId,
        profNombre: prof?.nombre || "Desconocido",
        tipo: formData.tipo,
        inicio: formData.inicio,
        fin: formData.fin,
        materias: formData.materias.split(",").map(m => m.trim()).filter(Boolean),
        motivo: formData.motivo,
        cert: formData.cert,
        certFileId: uploadedFileId,
        estado: "pendiente",
        fechaReg: new Date().toISOString()
      };

      await saveAusencia(newAusencia);

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(
        userEmail, "REGISTRAR_AUSENCIA",
        `Profesor: ${newAusencia.profNombre}, Tipo: ${newAusencia.tipo}, Fechas: ${newAusencia.inicio} a ${newAusencia.fin}`
      );

      onSuccess();
      onClose();
    } catch (saveErr) {
      // Rollback: delete uploaded file if database document creation fails
      if (uploadedFileId) {
        await deleteCertificateFile(uploadedFileId);
      }
      setError("Error al guardar el registro de ausencia. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass w-full max-w-lg rounded-[24px] border border-[var(--border)] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-zoom-in">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)] flex-shrink-0">
          <h2 className="title-font font-bold text-xl">Registrar Nueva Ausencia</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold flex-shrink-0">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        {currentHoliday && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-bold animate-fade-in flex-shrink-0">
            <AlertCircle size={14} className="shrink-0" />
            <span>El rango seleccionado contiene un día feriado: <span className="underline">{currentHoliday.nombre}</span> ({currentHoliday.tipo})</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          {!lockedProfesor ? (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Seleccionar Profesor</label>
              <select required
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all font-bold"
                value={selectedProfId} onChange={(e) => handleProfChange(e.target.value)}>
                <option value="">Elegir docente...</option>
                {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Profesor</label>
              <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 font-bold text-[var(--text)] cursor-not-allowed opacity-80">
                {lockedProfesor.nombre}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Tipo de Ausencia</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Licencia Médica", "Artículo", "Capacitación", "Otro"].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: t })}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 text-center ${
                    formData.tipo === t
                      ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] shadow-sm font-black scale-[1.02]"
                      : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {formData.tipo === "Artículo" && (
            <div className="relative space-y-2 animate-fade-in z-20" ref={articuloRef}>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Buscar Artículo de Licencia</label>
              {/* ✅ Barra de búsqueda única y aislada con relative */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ej: Art. 14, Art. 43, Gremial..."
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl pl-9 pr-10 py-3 outline-none focus:border-[var(--verde)] transition-all font-semibold text-sm text-[var(--text)]"
                  value={articuloQuery}
                  onChange={(e) => {
                    setArticuloQuery(e.target.value);
                    setShowArticuloDropdown(true);
                    if (!e.target.value) setFormData(prev => ({ ...prev, motivo: "" }));
                  }}
                  onFocus={() => setShowArticuloDropdown(true)}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowArticuloDropdown(prev => !prev);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors p-1"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showArticuloDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown filtrado absoluto flotante */}
                {showArticuloDropdown && articulosFiltrados.length > 0 && (
                  <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden animate-fade-in max-h-56 overflow-y-auto custom-scrollbar">
                    {articulosFiltrados.map((art) => (
                      <button
                        key={art.codigo}
                        type="button"
                        onClick={() => handleSelectArticulo(art)}
                        className="w-full text-left px-4 py-3 hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] transition-colors border-b border-[var(--border)] last:border-none flex items-start justify-between gap-3 group"
                      >
                        <div>
                          <span className="font-black text-xs text-[var(--text)] group-hover:text-[var(--verde)]">{art.codigo}</span>
                          <span className="mx-2 text-[var(--text3)]">·</span>
                          <span className="text-xs font-semibold text-[var(--text2)] group-hover:text-[var(--verde)]">{art.detalle}</span>
                        </div>
                        {art.limite && (
                          <span className="text-[9px] font-black uppercase text-[var(--amarillo)] bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] px-2 py-0.5 rounded-lg shrink-0">
                            {art.limite}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sin resultados absoluto flotante */}
                {showArticuloDropdown && articulosFiltrados.length === 0 && (
                  <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-xl p-4 text-center animate-fade-in">
                    <p className="text-xs text-[var(--text3)] font-semibold">No se encontraron artículos para «{articuloQuery}»</p>
                  </div>
                )}
              </div>

              {/* Artículo seleccionado */}
              {formData.motivo && (
                <div className="flex items-center gap-2 bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] px-3 py-2 rounded-xl text-[10px] font-black animate-fade-in">
                  <span className="shrink-0">✓ Seleccionado:</span>
                  <span className="truncate">{formData.motivo}</span>
                </div>
              )}
              <p className="text-[10px] font-semibold text-[var(--amarillo)] ml-1">Atención: Verificar cupo límite en el sistema de liquidaciones.</p>
            </div>
          )}

          {/* SECCIÓN DE CARGA DE CERTIFICADO (Aislado físicamente abajo y estilizado como Dropzone) */}
          <div className="space-y-3 z-10">
            <label className="flex items-center gap-3 cursor-pointer select-none py-3.5 px-4 bg-[var(--bg3)] border border-[var(--border)] rounded-2xl w-full hover:bg-[var(--bg4)]/40 transition-colors">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-[var(--border)] bg-[var(--bg)] checked:bg-[var(--verde)] checked:border-[var(--verde)] transition-all cursor-pointer accent-[var(--verde)]"
                checked={formData.cert}
                onChange={(e) => setFormData({ ...formData, cert: e.target.checked })}
              />
              <span className="text-sm font-bold text-[var(--text2)]">¿Adjuntar Certificado Médico / Justificativo?</span>
            </label>

            {formData.cert && (
              <div className="animate-fade-in">
                <label className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border)] hover:border-[var(--verde-border)] bg-[var(--bg3)] hover:bg-[var(--verde-bg)]/10 rounded-2xl cursor-pointer transition-all duration-300 p-4 text-center">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  {selectedFile ? (
                    <div className="space-y-1">
                      <div className="mx-auto w-10 h-10 rounded-full bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] group-hover:scale-110 transition-transform">
                        <Check size={18} />
                      </div>
                      <p className="text-xs font-bold text-[var(--text)] truncate max-w-[280px] mt-1">
                        {selectedFile.name}
                      </p>
                      <p className="text-[9px] font-semibold text-[var(--text3)] uppercase tracking-wider">
                        Hacé clic para cambiar el archivo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="mx-auto w-10 h-10 rounded-full bg-[var(--bg4)] border border-[var(--border)] flex items-center justify-center text-[var(--text2)] group-hover:scale-110 group-hover:border-[var(--verde-border)] group-hover:text-[var(--verde)] transition-all">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-[var(--text2)] group-hover:text-[var(--text)] transition-colors mt-1">
                        Subir certificado (Imagen o PDF)
                      </p>
                      <p className="text-[9px] text-[var(--text3)]">
                        Arrastrá el archivo o hacé clic para explorar
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Desde</label>
              <input required type="date"
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all"
                value={formData.inicio} onChange={(e) => setFormData({ ...formData, inicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Hasta</label>
              <input required type="date"
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all"
                value={formData.fin} onChange={(e) => setFormData({ ...formData, fin: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Materias Afectadas</label>
            <input type="text"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all"
              placeholder="Se autocompleta según el profesor"
              value={formData.materias} onChange={(e) => setFormData({ ...formData, materias: e.target.value })} />
          </div>

          <div className="pt-2 flex gap-4 border-t border-[var(--border)]">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg3)] transition-all font-bold active:scale-95">Cancelar</button>
            <button type="submit" disabled={loading || !!currentHoliday}
              className="flex-1 px-6 py-3 rounded-xl bg-[var(--verde)] text-black font-bold shadow-[0_4px_15px_-4px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50">
              {loading ? "Guardando..." : "Confirmar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
