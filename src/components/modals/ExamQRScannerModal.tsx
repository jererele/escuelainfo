"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  QrCode, 
  ScanLine,
  UserCheck
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "student" | "manager";
  onMesaScanned?: (mesaId: string) => void | Promise<void>;
  onStudentScanned?: (scannedText: string) => void | Promise<void>;
  title?: string;
  subtitle?: string;
  lastAddedStudent?: string;
}

export default function ExamQRScannerModal({
  isOpen,
  onClose,
  mode,
  onMesaScanned,
  onStudentScanned,
  title,
  subtitle,
  lastAddedStudent,
}: Props) {
  const [scannerStatus, setScannerStatus] = useState<
    "initializing" | "scanning" | "processing" | "success" | "error" | "permission_denied"
  >("initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ title: string; detail: string } | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const containerId = "exam-qr-reader-container";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("[Exam QR Scanner] Error al detener escáner:", err);
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  const handleDecodedText = useCallback(
    async (decodedText: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setScannerStatus("processing");

      try {
        const raw = decodedText.trim();

        if (mode === "student") {
          // El alumno escaneó el QR de una mesa
          await stopScanner();

          let mesaId = "";
          if (raw.startsWith("ESCUELA713_MESA:")) {
            mesaId = raw.replace("ESCUELA713_MESA:", "").trim();
          } else if (raw.includes("mesaId=")) {
            const match = raw.match(/mesaId=([^&]+)/);
            if (match) mesaId = match[1];
          } else {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.mesaId) mesaId = parsed.mesaId;
            } catch {
              mesaId = raw;
            }
          }

          if (!mesaId) {
            throw new Error("El código QR escaneado no corresponde a una mesa de examen válida.");
          }

          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([80, 40, 80]);
          }

          if (onMesaScanned) {
            await onMesaScanned(mesaId);
          }

          setSuccessInfo({
            title: "¡Mesa de Examen Identificada!",
            detail: "Inscribiendo y autocompletando planilla con tu usuario...",
          });
          setScannerStatus("success");
        } else {
          // El docente/preceptor escaneó el QR o credencial de un alumno
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(100);
          }

          if (onStudentScanned) {
            await onStudentScanned(raw);
          }

          setSuccessInfo({
            title: "¡Alumno Identificado!",
            detail: "Se cargó automáticamente en la planilla de la mesa.",
          });
          setScannerStatus("success");

          // Permitir escaneo continuo después de una breve pausa
          setTimeout(() => {
            isProcessingRef.current = false;
            setScannerStatus("scanning");
          }, 1600);
        }
      } catch (err: any) {
        console.error("[Exam QR Scanner Error]:", err);
        setErrorMessage(err?.message || "No se pudo procesar el código escaneado.");
        setScannerStatus("error");
      } finally {
        if (mode === "student") {
          isProcessingRef.current = false;
        }
      }
    },
    [mode, onMesaScanned, onStudentScanned, stopScanner]
  );

  const startScanner = useCallback(
    async (cameraIdOrFacingMode?: string | { facingMode: string }) => {
      try {
        setScannerStatus("initializing");
        setErrorMessage("");
        await stopScanner();

        const element = document.getElementById(containerId);
        if (!element) return;

        const html5Qr = new Html5Qrcode(containerId);
        scannerRef.current = html5Qr;

        try {
          const availableDevices = await Html5Qrcode.getCameras();
          if (availableDevices && availableDevices.length > 0) {
            setCameras(availableDevices);
          }
        } catch {
          // Ignorar si getCameras falla antes de permisos
        }

        const cameraConfig = cameraIdOrFacingMode || { facingMode: "environment" };

        await html5Qr.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decoded) => handleDecodedText(decoded),
          () => {}
        );

        setScannerStatus("scanning");
      } catch (err: any) {
        console.error("[Exam QR Scanner Init Error]:", err);
        const msg = err?.message || String(err);
        if (msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowedError")) {
          setScannerStatus("permission_denied");
        } else {
          setErrorMessage("No se pudo iniciar la cámara. Verificá que no esté en uso.");
          setScannerStatus("error");
        }
      }
    },
    [stopScanner, handleDecodedText]
  );

  const handleToggleCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(nextIndex);
    await startScanner(cameras[nextIndex].id);
  };

  useEffect(() => {
    if (isOpen) {
      isProcessingRef.current = false;
      setSuccessInfo(null);
      setErrorMessage("");
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopScanner();
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden animate-zoom-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Escáner */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg2)]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shrink-0">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black title-font text-[var(--text)]">
                {title || (mode === "student" ? "Escanear QR de Mesa" : "Escanear Alumno")}
              </h2>
              <p className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider">
                {subtitle || (mode === "student" ? "Inscripción instantánea" : "Carga a planilla")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {cameras.length > 1 && scannerStatus === "scanning" && (
              <button
                type="button"
                onClick={handleToggleCamera}
                className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg3)] hover:bg-[var(--bg4)] text-[var(--text)] transition-colors active:scale-95"
                title="Cambiar cámara"
              >
                <RefreshCw size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)] transition-colors active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Escáner */}
        <div className="p-5 flex flex-col items-center">
          {/* Mensajes de Estado */}
          {scannerStatus === "success" && (
            <div className="w-full mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-3 animate-fade-in">
              <CheckCircle2 size={24} className="shrink-0" />
              <div className="text-left">
                <p className="font-black text-sm">{successInfo?.title || "¡Operación Exitosa!"}</p>
                <p className="text-xs font-semibold opacity-90">{successInfo?.detail || "Datos actualizados en la planilla."}</p>
              </div>
            </div>
          )}

          {scannerStatus === "error" && (
            <div className="w-full mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3 animate-fade-in">
              <AlertCircle size={24} className="shrink-0" />
              <div className="text-left text-xs font-semibold">
                <p className="font-bold">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => startScanner()}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] underline font-black"
                >
                  <RefreshCw size={12} /> Reintentar
                </button>
              </div>
            </div>
          )}

          {scannerStatus === "permission_denied" && (
            <div className="w-full mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-center text-xs space-y-2 animate-fade-in">
              <AlertCircle size={28} className="mx-auto" />
              <p className="font-bold">Permiso de cámara denegado</p>
              <p className="text-[11px] opacity-90">Autorizá el uso de la cámara en el navegador para escanear.</p>
              <button
                type="button"
                onClick={() => startScanner()}
                className="px-4 py-2 bg-amber-500 text-black font-black text-xs rounded-xl"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Visor de Cámara */}
          <div className="relative w-full aspect-square max-w-[280px] rounded-3xl overflow-hidden border-2 border-[var(--border)] bg-black/90 shadow-inner flex items-center justify-center">
            <div id={containerId} className="w-full h-full object-cover" />

            {/* Guía visual de escaneo */}
            {scannerStatus === "scanning" && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-48 border-2 border-[var(--verde)]/80 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(var(--verde-rgb),0.3)]">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[var(--verde)] -translate-x-1 -translate-y-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[var(--verde)] translate-x-1 -translate-y-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[var(--verde)] -translate-x-1 translate-y-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[var(--verde)] translate-x-1 translate-y-1" />
                </div>
                <div className="absolute bottom-3 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-white font-bold">
                  <ScanLine size={13} className="text-[var(--verde)] animate-bounce" />
                  <span>Enfocá el código dentro del marco</span>
                </div>
              </div>
            )}

            {scannerStatus === "initializing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-white">
                <RefreshCw size={24} className="animate-spin text-[var(--verde)]" />
                <span className="text-xs font-bold">Iniciando cámara...</span>
              </div>
            )}

            {scannerStatus === "processing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 backdrop-blur-sm text-white">
                <Sparkles size={24} className="animate-spin text-[var(--verde)]" />
                <span className="text-xs font-bold">Procesando código...</span>
              </div>
            )}
          </div>

          {/* Información del último alumno agregado (en modo gestor) */}
          {mode === "manager" && lastAddedStudent && (
            <div className="w-full mt-4 p-3 bg-[var(--bg3)] border border-[var(--border)] rounded-2xl flex items-center gap-2.5 text-xs">
              <UserCheck size={16} className="text-[var(--verde)] shrink-0" />
              <div className="truncate">
                <span className="text-[10px] uppercase font-black text-[var(--text3)] block">Último alumno cargado:</span>
                <span className="font-bold text-[var(--text)] truncate">{lastAddedStudent}</span>
              </div>
            </div>
          )}

          {/* Pie informativo */}
          <div className="mt-4 text-center">
            <p className="text-xs font-semibold text-[var(--text2)]">
              {mode === "student"
                ? "Al escanear el QR, tus datos se completan automáticamente en la planilla oficial."
                : "Escaneá la credencial o DNI del alumno para sumarlo a la mesa sin escribir."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg2)]/60 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg3)] hover:bg-[var(--bg4)] font-bold text-xs text-[var(--text)] transition-all active:scale-95"
          >
            Cerrar Escáner
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
