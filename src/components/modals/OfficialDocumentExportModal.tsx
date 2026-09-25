"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Printer, 
  FileSpreadsheet, 
  X, 
  Calendar, 
  Users, 
  ClipboardCheck, 
  Building2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Alumno, Curso, MesaExamen } from "@/lib/dataService";
import { 
  printOfficialAttendanceSheet, 
  printOfficialExamBoardMinutes 
} from "@/lib/officialPrintService";
import { 
  exportStudentsToExcel, 
  exportExamBoardToExcel 
} from "@/lib/excelService";

interface OfficialDocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumnos: Alumno[];
  cursos: Curso[];
  mesas?: MesaExamen[];
  initialDocType?: "asistencia" | "acta" | "padron";
}

const MESES = [
  "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function OfficialDocumentExportModal({
  isOpen,
  onClose,
  alumnos,
  cursos,
  mesas = [],
  initialDocType = "asistencia",
}: OfficialDocumentExportModalProps) {
  const [docType, setDocType] = useState<"asistencia" | "acta" | "padron">(initialDocType);
  const [selectedCurso, setSelectedCurso] = useState<string>(cursos[0]?.nombre || "");
  const [selectedMes, setSelectedMes] = useState<string>("Septiembre");
  const [selectedAnio, setSelectedAnio] = useState<number>(2026);
  const [selectedMesaId, setSelectedMesaId] = useState<string>(mesas[0]?.id || "");
  const [libroNumero, setLibroNumero] = useState<string>("14");
  const [folioNumero, setFolioNumero] = useState<string>("82");

  if (!isOpen) return null;

  const currentCourseStudents = alumnos.filter(a => a.curso === selectedCurso);
  const selectedMesa = mesas.find(m => m.id === selectedMesaId) || mesas[0];

  const handlePrint = () => {
    if (docType === "asistencia") {
      const diasEnMes = 30; // Promedio estándar de cuadrícula mensual
      const formattedStudents = currentCourseStudents.map(al => {
        const asistenciasPorDia: Record<number, "P" | "A" | "M" | "T" | "R" | "J" | ""> = {};
        // Inicializar cuadrícula en blanco/P
        for (let d = 1; d <= diasEnMes; d++) {
          asistenciasPorDia[d] = "";
        }
        return {
          nombre: al.nombre,
          dni: al.dni,
          asistenciasPorDia,
        };
      });

      printOfficialAttendanceSheet({
        curso: selectedCurso,
        mesNombre: selectedMes,
        anio: selectedAnio,
        diasEnMes,
        alumnos: formattedStudents,
        preceptorNombre: "Preceptoría de Turno",
      });
    } else if (docType === "acta") {
      if (!selectedMesa) return;

      const registered = (selectedMesa.alumnosInscriptos || []).map((dniOrName) => {
        const found = alumnos.find(a => a.dni === dniOrName || a.nombre.toLowerCase() === dniOrName.toLowerCase());
        return {
          nombre: found ? found.nombre : dniOrName,
          dni: found ? found.dni : "—",
          escrito: "",
          oral: "",
          calificacion: "",
          calificacionLetras: "",
          condicion: "" as any,
        };
      });

      printOfficialExamBoardMinutes({
        materia: selectedMesa.materia,
        fecha: selectedMesa.fecha,
        hora: selectedMesa.hora,
        aula: selectedMesa.aula,
        libroNumero,
        folioNumero,
        turno: "Ordinario",
        presidenteNombre: selectedMesa.presidenteNombre,
        vocal1Nombre: selectedMesa.vocal1Nombre,
        vocal2Nombre: selectedMesa.vocal2Nombre,
        alumnosInscriptos: registered,
      });
    } else if (docType === "padron") {
      exportStudentsToExcel(alumnos, selectedCurso);
    }
  };

  const handleExportExcel = () => {
    if (docType === "padron" || docType === "asistencia") {
      exportStudentsToExcel(alumnos, selectedCurso);
    } else if (docType === "acta") {
      exportExamBoardToExcel(mesas);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[var(--bg)] border border-[var(--border)] rounded-[28px] sm:rounded-[36px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg2)]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shrink-0">
              <FileText size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black title-font text-[var(--text)]">
                Emisión de Documentación Oficial
              </h2>
              <p className="text-xs text-[var(--text2)] font-semibold">
                Planillas ministeriales, actas volantes y padrones con membrete oficial de Chubut
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--bg3)] hover:bg-[var(--bg4)] flex items-center justify-center text-[var(--text2)] cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SELECTOR DE TIPO DE DOCUMENTO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDocType("asistencia")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                docType === "asistencia"
                  ? "bg-[var(--verde-bg)] border-[var(--verde-border)] text-[var(--text)] ring-2 ring-[var(--verde)]/30"
                  : "bg-[var(--bg2)] border-[var(--border)] text-[var(--text3)] hover:bg-[var(--bg3)]"
              }`}
            >
              <Calendar size={18} className={docType === "asistencia" ? "text-[var(--verde)]" : "text-[var(--text3)]"} />
              <div className="font-black text-xs sm:text-sm mt-2">Planilla Mensual de Asistencia</div>
              <p className="text-[10px] mt-0.5 opacity-80">Cuadrícula oficial días 1 a 31 por curso</p>
            </button>

            <button
              type="button"
              onClick={() => setDocType("acta")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                docType === "acta"
                  ? "bg-[var(--verde-bg)] border-[var(--verde-border)] text-[var(--text)] ring-2 ring-[var(--verde)]/30"
                  : "bg-[var(--bg2)] border-[var(--border)] text-[var(--text3)] hover:bg-[var(--bg3)]"
              }`}
            >
              <ClipboardCheck size={18} className={docType === "acta" ? "text-[var(--verde)]" : "text-[var(--text3)]"} />
              <div className="font-black text-xs sm:text-sm mt-2">Acta Volante de Exámenes</div>
              <p className="text-[10px] mt-0.5 opacity-80">Tribunal, libro matriz, folio y firmas</p>
            </button>

            <button
              type="button"
              onClick={() => setDocType("padron")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                docType === "padron"
                  ? "bg-[var(--verde-bg)] border-[var(--verde-border)] text-[var(--text)] ring-2 ring-[var(--verde)]/30"
                  : "bg-[var(--bg2)] border-[var(--border)] text-[var(--text3)] hover:bg-[var(--bg3)]"
              }`}
            >
              <Users size={18} className={docType === "padron" ? "text-[var(--verde)]" : "text-[var(--text3)]"} />
              <div className="font-black text-xs sm:text-sm mt-2">Padrón Oficial de Alumnos</div>
              <p className="text-[10px] mt-0.5 opacity-80">Nómina matriculada por división</p>
            </button>
          </div>

          {/* PARÁMETROS DEL DOCUMENTO SELECCIONADO */}
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text2)] flex items-center gap-2">
              <Building2 size={14} className="text-[var(--verde)]" /> Parámetros Institucionales
            </h3>

            {docType === "asistencia" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-[var(--text)]">Curso / División</label>
                  <select
                    value={selectedCurso}
                    onChange={(e) => setSelectedCurso(e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-2 px-3 outline-none focus:border-[var(--verde)]"
                  >
                    {cursos.map(c => (
                      <option key={c.id || c.nombre} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-[var(--text)]">Mes</label>
                  <select
                    value={selectedMes}
                    onChange={(e) => setSelectedMes(e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-2 px-3 outline-none focus:border-[var(--verde)]"
                  >
                    {MESES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-[var(--text)]">Ciclo Lectivo</label>
                  <input
                    type="number"
                    value={selectedAnio}
                    onChange={(e) => setSelectedAnio(Number(e.target.value))}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-2 px-3 outline-none focus:border-[var(--verde)] font-mono"
                  />
                </div>
              </div>
            )}

            {docType === "acta" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-[var(--text)]">Mesa de Examen</label>
                  <select
                    value={selectedMesaId}
                    onChange={(e) => setSelectedMesaId(e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-2 px-3 outline-none focus:border-[var(--verde)]"
                  >
                    {mesas.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.materia} · {m.fecha} ({m.hora} hs) · Pres: {m.presidenteNombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1 text-[var(--text)]">Libro Matriz N°</label>
                    <input
                      type="text"
                      value={libroNumero}
                      onChange={(e) => setLibroNumero(e.target.value)}
                      placeholder="Ej: 14"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-2 px-3 outline-none focus:border-[var(--verde)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-[var(--text)]">Folio N°</label>
                    <input
                      type="text"
                      value={folioNumero}
                      onChange={(e) => setFolioNumero(e.target.value)}
                      placeholder="Ej: 82"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-2 px-3 outline-none focus:border-[var(--verde)] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {docType === "padron" && (
              <div className="text-xs">
                <label className="font-bold block mb-1 text-[var(--text)]">Filtrar por Curso</label>
                <select
                  value={selectedCurso}
                  onChange={(e) => setSelectedCurso(e.target.value)}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-2 px-3 outline-none focus:border-[var(--verde)]"
                >
                  <option value="todos">Todos los Cursos (Padrón Institucional Completo)</option>
                  {cursos.map(c => (
                    <option key={c.id || c.nombre} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* MEMBRETE PREVIEW */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-1">
            <div className="font-bold text-[var(--verde)] flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Membrete Oficial Certificado
            </div>
            <p className="text-[var(--text2)]">
              Provincia del Chubut · Ministerio de Educación · Escuela N° 713 &quot;Juan Abdala Chayep&quot; (CUE 2600214-00).
              Incluye cuadrícula reglamentaria, casilleros de firmas de preceptoría, secretaría y equipo directivo.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-6 border-t border-[var(--border)] bg-[var(--bg2)]/60 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold hover:bg-[var(--bg3)] transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] text-xs font-bold hover:border-[var(--verde)] hover:text-[var(--verde)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet size={15} />
              <span>Exportar Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[var(--verde)] text-black text-xs font-black hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer size={15} />
              <span>Imprimir / PDF Oficial</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
