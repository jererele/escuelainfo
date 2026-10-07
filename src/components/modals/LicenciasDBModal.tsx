import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  BookOpen,
  Scale,
  Clock,
  ShieldCheck,
  Building2,
  CheckCircle,
  Copy,
  Check,
  FileText,
  AlertCircle,
  ArrowRight,
  Filter,
  Layers,
  ChevronDown,
  Sparkles,
  Info
} from "lucide-react";
import {
  LicenciaItem,
  TipoPersonal,
  CategoriaLicencia,
  CATEGORIAS_INFO,
  LICENCIAS_METADATA,
  TODAS_LAS_LICENCIAS,
  LICENCIAS_DOCENTES,
  LICENCIAS_AUXILIARES,
  buscarLicencias,
  getStatsLicenciasDB
} from "@/lib/licenciasDB";

interface LicenciasDBModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLicencia?: (licencia: LicenciaItem) => void;
  initialTipoPersonal?: TipoPersonal | "todos";
  initialArticulo?: string;
}

export const LicenciasDBModal: React.FC<LicenciasDBModalProps> = ({
  isOpen,
  onClose,
  onSelectLicencia,
  initialTipoPersonal = "todos",
  initialArticulo = ""
}) => {
  const [searchQuery, setSearchQuery] = useState(initialArticulo);
  const [tipoPersonal, setTipoPersonal] = useState<TipoPersonal | "todos">(initialTipoPersonal);
  const [categoria, setCategoria] = useState<CategoriaLicencia | "todas">("todas");
  const [filtroGoce, setFiltroGoce] = useState<"todos" | "con_goce" | "sin_goce" | "parcial">("todos");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => getStatsLicenciasDB(), []);

  const resultados = useMemo(() => {
    return buscarLicencias(searchQuery, {
      tipoPersonal,
      categoria,
      conGoce: filtroGoce
    });
  }, [searchQuery, tipoPersonal, categoria, filtroGoce]);

  const handleCopy = (lic: LicenciaItem) => {
    const text = `[Régimen Chubut] ${lic.articulo} - ${lic.motivoSae} (${lic.tipoPersonal.toUpperCase()})\n` +
      `Descripción: ${lic.descripcion}\n` +
      `Duración Máxima: ${lic.duracionMaxima}\n` +
      `Goce de Haberes: ${lic.goceHaberes}\n` +
      `Condiciones: ${lic.condicionesRequisitos}\n` +
      `Autoridad: ${lic.autoridadOtorga}\n` +
      `Marco Normativo: ${lic.marcoNormativo}`;

    navigator.clipboard.writeText(text);
    setCopiedId(lic.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[var(--bg)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden text-[var(--text)] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] bg-[var(--bg2)]/60 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="title-font font-black text-lg sm:text-xl text-[var(--text)]">
                  Base Normativa de Licencias (SAE)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]">
                  Chubut Oficial
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg3)] text-[var(--text2)] border border-[var(--border)]">
                  {resultados.length} de {stats.total} artículos
                </span>
              </div>
              <p className="text-xs text-[var(--text2)] mt-1 font-medium">
                Estatuto del Docente (Ley 2838 / Dto. 604), Paritarias y CCT de Auxiliares de la Educación.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* FILTROS Y CONTROLES */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--bg)]/90 space-y-3.5">
          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por artículo (ej: 5A, 12C, 15, 31), motivo SAE, requisitos, normativa..."
              className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-2xl py-3 pl-11 pr-10 text-sm font-medium outline-none focus:border-[var(--verde)] transition-all placeholder:text-[var(--text3)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] p-1 rounded-lg"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Selector de Tipo de Personal y Goce */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Pestañas de Personal */}
            <div className="flex items-center gap-1.5 p-1 bg-[var(--bg2)] border border-[var(--border)] rounded-2xl">
              <button
                type="button"
                onClick={() => setTipoPersonal("todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tipoPersonal === "todos"
                    ? "bg-[var(--text)] text-[var(--bg)] font-black shadow-sm"
                    : "text-[var(--text2)] hover:text-[var(--text)]"
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setTipoPersonal("docente")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tipoPersonal === "docente"
                    ? "bg-[var(--verde)] text-black font-black shadow-sm"
                    : "text-[var(--text2)] hover:text-[var(--text)]"
                }`}
              >
                Docentes ({stats.docentesTotal})
              </button>
              <button
                type="button"
                onClick={() => setTipoPersonal("auxiliar")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tipoPersonal === "auxiliar"
                    ? "bg-[var(--azul)] text-white font-black shadow-sm"
                    : "text-[var(--text2)] hover:text-[var(--text)]"
                }`}
              >
                Auxiliares ({stats.auxiliaresTotal})
              </button>
            </div>

            {/* Filtro Goce de Haberes */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[11px] font-black uppercase text-[var(--text3)] mr-1 hidden sm:inline">
                Haberes:
              </span>
              {[
                { id: "todos", label: "Cualquiera" },
                { id: "con_goce", label: "Con Goce 100%" },
                { id: "sin_goce", label: "Sin Goce" },
                { id: "parcial", label: "Parcial / 50%" }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroGoce(f.id as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shrink-0 ${
                    filtroGoce === f.id
                      ? "bg-[var(--bg3)] text-[var(--text)] border-[var(--text2)] font-black"
                      : "bg-[var(--bg2)] text-[var(--text3)] border-[var(--border)] hover:text-[var(--text)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categorías en Carrusel Horizontal */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setCategoria("todas")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                categoria === "todas"
                  ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] font-black"
                  : "bg-[var(--bg2)] text-[var(--text2)] border-[var(--border)] hover:bg-[var(--bg3)]"
              }`}
            >
              Todas las categorías
            </button>
            {Object.entries(CATEGORIAS_INFO).map(([key, info]) => {
              const isSelected = categoria === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategoria(key as CategoriaLicencia)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? `${info.bgClass} ${info.textClass} font-black`
                      : "bg-[var(--bg2)] text-[var(--text2)] border-[var(--border)] hover:bg-[var(--bg3)]"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTADO DE RESULTADOS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar">
          {resultados.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] text-[var(--text3)] flex items-center justify-center mx-auto">
                <AlertCircle size={28} />
              </div>
              <h4 className="font-bold text-base text-[var(--text)]">No se encontraron artículos con esos filtros</h4>
              <p className="text-xs text-[var(--text2)] max-w-md mx-auto">
                Probá buscando por otro término (ej: &quot;salud&quot;, &quot;2A&quot;, &quot;maternidad&quot;, &quot;examen&quot;) o limpiando los filtros seleccionados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setTipoPersonal("todos");
                  setCategoria("todas");
                  setFiltroGoce("todos");
                }}
                className="px-4 py-2 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-xs font-bold hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] transition-all cursor-pointer"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            resultados.map((lic) => {
              const catInfo = CATEGORIAS_INFO[lic.categoria];
              const isExpanded = expandedId === lic.id;
              const isDocente = lic.tipoPersonal === "docente";

              return (
                <div
                  key={lic.id}
                  className={`card glass rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "border-[var(--verde)]/50 shadow-md bg-[var(--bg2)]/80"
                      : "border-[var(--border)] hover:border-[var(--border2)] bg-[var(--bg2)]/40"
                  }`}
                >
                  {/* Resumen del Artículo */}
                  <div
                    onClick={() => setExpandedId(prev => prev === lic.id ? null : lic.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Código de Artículo */}
                      <div className="flex flex-col items-start gap-1 shrink-0">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase font-mono tracking-tight border ${
                          isDocente
                            ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]"
                            : "bg-[var(--azul-bg)] text-[var(--azul)] border-[var(--azul-border)]"
                        }`}>
                          Art. {lic.articulo}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text3)] pl-0.5">
                          {isDocente ? "Docente" : "Auxiliar"}
                        </span>
                      </div>

                      {/* Motivo SAE y Categoría */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-[var(--text)] group-hover:text-[var(--verde)]">
                            {lic.motivoSae}
                          </h4>
                          {lic.descripcion && lic.descripcion !== lic.motivoSae && (
                            <span className="text-xs text-[var(--text2)] font-semibold truncate hidden sm:inline">
                              — {lic.descripcion}
                            </span>
                          )}
                        </div>

                        {/* Badges de soporte */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {/* Categoría */}
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${catInfo.bgClass} ${catInfo.textClass}`}>
                            {catInfo.label}
                          </span>

                          {/* Haberes */}
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                            lic.conGoce === true
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : lic.conGoce === false
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}>
                            {lic.goceHaberes}
                          </span>

                          {/* Duración */}
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[var(--bg3)] text-[var(--text2)] border border-[var(--border)] flex items-center gap-1">
                            <Clock size={11} className="shrink-0" />
                            <span className="truncate max-w-[200px]">{lic.duracionMaxima}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción rápida */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(lic);
                        }}
                        className="p-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-all cursor-pointer"
                        title="Copiar datos normativos"
                      >
                        {copiedId === lic.id ? (
                          <Check size={15} className="text-emerald-500" />
                        ) : (
                          <Copy size={15} />
                        )}
                      </button>

                      {onSelectLicencia && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLicencia(lic);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--verde)] text-black font-black text-xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Solicitar esta licencia"
                        >
                          <span>Solicitar</span>
                          <ArrowRight size={13} />
                        </button>
                      )}

                      <div className={`p-1.5 text-[var(--text3)] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Detalle Desplegable */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[var(--border)]/60 bg-[var(--bg3)]/30 space-y-3.5 text-xs">
                      {/* Grid de Requisitos y Autoridad */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                        {/* Condiciones */}
                        <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-1">
                          <div className="flex items-center gap-1.5 text-[var(--amarillo)] font-extrabold text-[11px] uppercase tracking-wider">
                            <AlertCircle size={13} />
                            <span>Condiciones y Requisitos</span>
                          </div>
                          <p className="text-[var(--text)] font-medium leading-relaxed">
                            {lic.condicionesRequisitos}
                          </p>
                        </div>

                        {/* Autoridad y Marco Normativo */}
                        <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-[var(--azul)] font-extrabold text-[11px] uppercase tracking-wider">
                              <Building2 size={13} />
                              <span>Autoridad que Otorga</span>
                            </div>
                            <p className="text-[var(--text)] font-semibold mt-0.5">
                              {lic.autoridadOtorga}
                            </p>
                          </div>

                          <div className="pt-1 border-t border-[var(--border)]/60">
                            <div className="flex items-center gap-1.5 text-[var(--verde)] font-extrabold text-[11px] uppercase tracking-wider">
                              <Scale size={13} />
                              <span>Marco Normativo</span>
                            </div>
                            <p className="text-[var(--text2)] font-mono text-[11px] mt-0.5">
                              {lic.marcoNormativo}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pie con badge de Certificado */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[var(--text3)]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">ID Reglamentario:</span>
                          <code className="font-mono bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">{lic.id}</code>
                          {lic.requiereCertificado && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--amarillo-bg)] text-[var(--amarillo)] font-bold border border-[var(--amarillo-border)]">
                              Requiere Certificado / Documentación
                            </span>
                          )}
                        </div>

                        {onSelectLicencia && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectLicencia(lic);
                              onClose();
                            }}
                            className="text-[var(--verde)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ir al formulario con este artículo</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--bg2)]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text2)]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--verde)] shrink-0" />
            <span>
              Catálogo sincronizado con la normativa oficial del Ministerio de Educación de la Provincia del Chubut.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] font-bold hover:bg-[var(--bg3)] transition-all cursor-pointer w-full sm:w-auto text-center"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenciasDBModal;
