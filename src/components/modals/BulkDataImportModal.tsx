"use client";

import React, { useState, useRef } from "react";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  RefreshCw, 
  X, 
  Search,
  Users,
  GraduationCap
} from "lucide-react";
import { 
  downloadStudentImportTemplate, 
  downloadTeacherImportTemplate, 
  parseStudentExcelFile, 
  parseTeacherExcelFile, 
  ParsedStudentRow, 
  ParsedTeacherRow 
} from "@/lib/excelService";
import { saveAlumno, saveProfesor, logAction } from "@/lib/dataService";
import { notify } from "@/lib/notify";

interface BulkDataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "alumnos" | "profesores";
  existingDnis: Set<string>;
  userEmail: string;
  onSuccess: () => void;
}

export default function BulkDataImportModal({
  isOpen,
  onClose,
  entityType,
  existingDnis,
  userEmail,
  onSuccess,
}: BulkDataImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [studentRows, setStudentRows] = useState<ParsedStudentRow[]>([]);
  const [teacherRows, setTeacherRows] = useState<ParsedTeacherRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "warning" | "error">("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    try {
      if (entityType === "alumnos") {
        const rows = await parseStudentExcelFile(selectedFile, existingDnis);
        setStudentRows(rows);
      } else {
        const rows = await parseTeacherExcelFile(selectedFile, existingDnis);
        setTeacherRows(rows);
      }
    } catch (err: any) {
      notify.error("Error al leer el archivo. Verifique que sea una planilla Excel válida (.xlsx, .xls o .csv).");
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const resetFile = () => {
    setFile(null);
    setStudentRows([]);
    setTeacherRows([]);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isStudent = entityType === "alumnos";
  const totalRows = isStudent ? studentRows.length : teacherRows.length;
  const validRows = isStudent
    ? studentRows.filter(r => r.status === "valid").length
    : teacherRows.filter(r => r.status === "valid").length;
  const warningRows = isStudent
    ? studentRows.filter(r => r.status === "warning").length
    : teacherRows.filter(r => r.status === "warning").length;
  const errorRows = isStudent
    ? studentRows.filter(r => r.status === "error").length
    : teacherRows.filter(r => r.status === "error").length;

  const filteredStudentRows = studentRows.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.nombre.toLowerCase().includes(q) || r.dni.includes(q) || r.curso.toLowerCase().includes(q);
  });

  const filteredTeacherRows = teacherRows.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.nombre.toLowerCase().includes(q) || r.dni.includes(q) || r.materias.some(m => m.toLowerCase().includes(q));
  });

  const handleStartImport = async () => {
    const rowsToImport = isStudent
      ? studentRows.filter(r => r.status !== "error")
      : teacherRows.filter(r => r.status !== "error");

    if (rowsToImport.length === 0) {
      notify.error("No hay registros válidos para importar.");
      return;
    }

    setIsImporting(true);
    setProgress(0);

    let successCount = 0;
    let failCount = 0;

    const BATCH_SIZE = 4;
    for (let i = 0; i < rowsToImport.length; i += BATCH_SIZE) {
      const batch = rowsToImport.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          try {
            if (isStudent) {
              const sRow = row as ParsedStudentRow;
              await saveAlumno({
                nombre: sRow.nombre,
                dni: sRow.dni,
                curso: sRow.curso || "pendiente",
                email: sRow.email || "",
              });
            } else {
              const tRow = row as ParsedTeacherRow;
              await saveProfesor({
                nombre: tRow.nombre,
                dni: tRow.dni,
                email: tRow.email,
                materias: tRow.materias,
              });
            }
            successCount++;
          } catch {
            failCount++;
          }
        })
      );

      const percent = Math.round(((i + batch.length) / rowsToImport.length) * 100);
      setProgress(percent);
    }

    await logAction(
      userEmail,
      "MI_D",
      `Importación masiva: ${successCount} ${isStudent ? "alumnos" : "docentes"} importados exitosamente${failCount > 0 ? `, ${failCount} fallidos` : ""}.`
    );

    setIsImporting(false);
    notify.success(`¡Se importaron ${successCount} ${isStudent ? "alumnos" : "profesores"} correctamente!`);
    onSuccess();
    onClose();
    resetFile();
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-4xl bg-[var(--bg)] border border-[var(--border)] rounded-[28px] sm:rounded-[36px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg2)]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shrink-0">
              {isStudent ? <Users size={22} strokeWidth={2.2} /> : <GraduationCap size={22} strokeWidth={2.2} />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black title-font text-[var(--text)]">
                Importador Masivo de {isStudent ? "Alumnos" : "Profesores"}
              </h2>
              <p className="text-xs text-[var(--text2)] font-semibold">
                Carga automática de nóminas oficiales mediante planillas Excel (.xlsx, .xls) o CSV
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
          {/* BOTÓN DESCARGAR PLANTILLA OFICIAL */}
          <div className="bg-[var(--bg3)]/50 border border-[var(--border)] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet size={20} className="text-[var(--verde)] shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[var(--text)]">¿No tenés el formato exacto?</span>
                <p className="text-[var(--text3)]">Descargá la plantilla modelo institucional lista para completar.</p>
              </div>
            </div>
            <button
              onClick={isStudent ? downloadStudentImportTemplate : downloadTeacherImportTemplate}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-xs font-bold hover:bg-[var(--verde)] hover:text-black transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download size={14} />
              <span>Descargar Plantilla Oficial (.xlsx)</span>
            </button>
          </div>

          {/* DROPZONE / SELECCIÓN DE ARCHIVO */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging 
                  ? "border-[var(--verde)] bg-[var(--verde-bg)]/20 scale-[0.99]" 
                  : "border-[var(--border)] hover:border-[var(--verde)] bg-[var(--bg2)]/40 hover:bg-[var(--bg2)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg3)] text-[var(--verde)] flex items-center justify-center mx-auto mb-4 border border-[var(--border)] shadow-sm">
                <UploadCloud size={32} />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[var(--text)] mb-1">
                Arrastrá tu archivo Excel aquí o hacé clic para explorar
              </h3>
              <p className="text-xs text-[var(--text3)] max-w-sm mx-auto font-medium">
                Soporta archivos .xlsx, .xls o .csv con columnas de Nombre, DNI, {isStudent ? "Curso y Email" : "Materias e Email"}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* FICHA DEL ARCHIVO CARGADO */}
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-[var(--text)] truncate">{file.name}</div>
                    <div className="text-[11px] text-[var(--text3)]">
                      {(file.size / 1024).toFixed(1)} KB · {totalRows} filas detectadas
                    </div>
                  </div>
                </div>
                <button
                  onClick={resetFile}
                  disabled={isImporting}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--rojo-bg)] hover:text-[var(--rojo)] hover:border-[var(--rojo-border)] transition-colors cursor-pointer"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* BARRA DE FILTROS Y ESTADÍSTICAS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-between cursor-pointer transition-all ${
                    filterStatus === "all" ? "bg-[var(--bg3)] border-[var(--verde)] text-[var(--text)]" : "border-[var(--border)] text-[var(--text3)]"
                  }`}
                >
                  <span>Total Detectados</span>
                  <span className="font-mono text-xs">{totalRows}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus("valid")}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-between cursor-pointer transition-all ${
                    filterStatus === "valid" ? "bg-[var(--verde-bg)] border-[var(--verde-border)] text-[var(--verde)]" : "border-[var(--border)] text-[var(--text3)]"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={13} /> Listos</span>
                  <span className="font-mono text-xs text-[var(--verde)]">{validRows}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus("warning")}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-between cursor-pointer transition-all ${
                    filterStatus === "warning" ? "bg-[var(--amarillo-bg)] border-[var(--amarillo-border)] text-[var(--amarillo)]" : "border-[var(--border)] text-[var(--text3)]"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><AlertTriangle size={13} /> Avisos</span>
                  <span className="font-mono text-xs text-[var(--amarillo)]">{warningRows}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus("error")}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-between cursor-pointer transition-all ${
                    filterStatus === "error" ? "bg-[var(--rojo-bg)] border-[var(--rojo-border)] text-[var(--rojo)]" : "border-[var(--border)] text-[var(--text3)]"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><XCircle size={13} /> Errores</span>
                  <span className="font-mono text-xs text-[var(--rojo)]">{errorRows}</span>
                </button>
              </div>

              {/* BUSCADOR DENTRO DE LA PREVIA */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                <input
                  type="text"
                  placeholder="Buscar en las filas analizadas por nombre o DNI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-[var(--verde)] text-[var(--text)]"
                />
              </div>

              {/* TABLA PREVIEW DE VALIDACIÓN */}
              <div className="border border-[var(--border)] rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--bg3)] sticky top-0 border-b border-[var(--border)] z-10">
                    <tr>
                      <th className="p-3 text-[10px] font-black uppercase text-[var(--text3)]">Estado</th>
                      <th className="p-3 text-[10px] font-black uppercase text-[var(--text3)]">Nombre y Apellido</th>
                      <th className="p-3 text-[10px] font-black uppercase text-[var(--text3)]">DNI</th>
                      <th className="p-3 text-[10px] font-black uppercase text-[var(--text3)]">
                        {isStudent ? "Curso" : "Materias"}
                      </th>
                      <th className="p-3 text-[10px] font-black uppercase text-[var(--text3)]">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isStudent ? (
                      filteredStudentRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-[var(--text3)] italic">
                            No hay alumnos que coincidan con el filtro actual.
                          </td>
                        </tr>
                      ) : (
                        filteredStudentRows.map((r, i) => (
                          <tr key={i} className="border-b border-[var(--border)]/50 last:border-none hover:bg-white/5">
                            <td className="p-3">
                              {r.status === "valid" && <span className="inline-flex items-center gap-1 text-[var(--verde)] font-bold text-[10px]"><CheckCircle2 size={12} /> Listo</span>}
                              {r.status === "warning" && <span className="inline-flex items-center gap-1 text-[var(--amarillo)] font-bold text-[10px]"><AlertTriangle size={12} /> Aviso</span>}
                              {r.status === "error" && <span className="inline-flex items-center gap-1 text-[var(--rojo)] font-bold text-[10px]"><XCircle size={12} /> Error</span>}
                            </td>
                            <td className="p-3 font-semibold text-[var(--text)]">{r.nombre || "—"}</td>
                            <td className="p-3 font-mono">{r.dni || "—"}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-[var(--bg3)] text-[10px] font-bold">
                                {r.curso}
                              </span>
                            </td>
                            <td className="p-3 text-[10px] text-[var(--text3)]">{r.statusMessage}</td>
                          </tr>
                        ))
                      )
                    ) : (
                      filteredTeacherRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-[var(--text3)] italic">
                            No hay docentes que coincidan con el filtro actual.
                          </td>
                        </tr>
                      ) : (
                        filteredTeacherRows.map((r, i) => (
                          <tr key={i} className="border-b border-[var(--border)]/50 last:border-none hover:bg-white/5">
                            <td className="p-3">
                              {r.status === "valid" && <span className="inline-flex items-center gap-1 text-[var(--verde)] font-bold text-[10px]"><CheckCircle2 size={12} /> Listo</span>}
                              {r.status === "warning" && <span className="inline-flex items-center gap-1 text-[var(--amarillo)] font-bold text-[10px]"><AlertTriangle size={12} /> Aviso</span>}
                              {r.status === "error" && <span className="inline-flex items-center gap-1 text-[var(--rojo)] font-bold text-[10px]"><XCircle size={12} /> Error</span>}
                            </td>
                            <td className="p-3 font-semibold text-[var(--text)]">{r.nombre || "—"}</td>
                            <td className="p-3 font-mono">{r.dni || "—"}</td>
                            <td className="p-3">
                              <span className="text-[10px] text-[var(--text2)]">
                                {r.materias.length > 0 ? r.materias.join(", ") : "Sin materias asignadas"}
                              </span>
                            </td>
                            <td className="p-3 text-[10px] text-[var(--text3)]">{r.statusMessage}</td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* BARRA DE PROGRESO DE IMPORTACIÓN */}
              {isImporting && (
                <div className="space-y-1.5 bg-[var(--bg3)] p-3 rounded-xl border border-[var(--border)]">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-[var(--verde)]">
                      <RefreshCw size={13} className="animate-spin" /> Guardando en la base de datos...
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-[var(--bg)] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[var(--verde)] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-6 border-t border-[var(--border)] bg-[var(--bg2)]/60 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-[var(--text3)] text-center sm:text-left">
            {file && (
              <span>
                Se omitirán las filas con error. Filas importables: <strong>{validRows + warningRows}</strong>.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold hover:bg-[var(--bg3)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleStartImport}
              disabled={!file || isImporting || (validRows + warningRows === 0)}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[var(--verde)] text-black text-xs font-black hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <span>Comenzar Importación ({validRows + warningRows})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
