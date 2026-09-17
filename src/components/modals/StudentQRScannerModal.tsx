"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  X, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FlipHorizontal, 
  QrCode, 
  Sparkles,
  Loader2,
  CalendarCheck
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { 
  UserProfile, 
  getAlumnos, 
  saveAsistenciasJornada, 
  saveAsistenciasMateria, 
  logAction 
} from "@/lib/dataService";
import { notify } from "@/lib/notify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onSuccess?: () => void;
}

export default function StudentQRScannerModal({ isOpen, onClose, userProfile, onSuccess }: Props) {
  const [scannerStatus, setScannerStatus] = useState<"initializing" | "scanning" | "processing" | "success" | "error" | "permission_denied">("initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ tipo: string; detalle: string } | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const containerId = "student-qr-reader-container";

  // Detener el escáner de manera segura y liberar la cámara
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("[QR Scanner] Error al detener escáner:", err);
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  // Procesar código QR detectado
  const handleDecodedText = useCallback(async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScannerStatus("processing");

    // Detener la cámara inmediatamente para ahorrar batería y recursos
    await stopScanner();

    try {
      if (!userProfile) {
        throw new Error("No se detectó un perfil de usuario activo.");
      }

      // Extraer token de la URL o texto directo
      let rawToken = decodedText.trim();
      if (rawToken.includes("token=")) {
        try {
          const parsedUrl = new URL(rawToken);
          rawToken = parsedUrl.searchParams.get("token") || rawToken;
        } catch {
          const match = rawToken.match(/token=([^&]+)/);
          if (match) rawToken = match[1];
        }
      }

      // Decodificar Base64 del token
      let payload;
      try {
        payload = JSON.parse(atob(rawToken));
      } catch {
        throw new Error("El código QR no pertenece al sistema de asistencia de la escuela.");
      }

      const { t, m, s, p } = payload;
      if (!t || !m) {
        throw new Error("El formato del código QR de asistencia es inválido.");
      }

      // Validar expiración (tolerancia de 25 segundos para evitar fotos en WhatsApp)
      if (Date.now() - t > 25000) {
        throw new Error("Este código QR ya expiró por seguridad. Pedíle al docente o preceptor que muestre uno nuevo.");
      }

      // Buscar legajo de alumno del usuario logueado
      const allAlumnos = await getAlumnos();
      const studentRecord = allAlumnos.find(
        (a) => a.email.toLowerCase() === userProfile.email.toLowerCase()
      );

      if (!studentRecord || !studentRecord.id) {
        throw new Error("No se encontró tu legajo de alumno en la base de datos.");
      }

      const todayDate = new Date().toISOString().split("T")[0];

      if (m === "jornada") {
        await saveAsistenciasJornada([
          {
            alumnoId: studentRecord.id,
            alumnoNombre: studentRecord.nombre,
            fecha: todayDate,
            estado: "P",
            preceptorId: p || "QR_SISTEMA",
          },
        ]);
        await logAction(userProfile.email, "C_AJ", "Presente por Lector QR Integrado (Jornada)");
        setSuccessInfo({
          tipo: "Jornada Institucional",
          detalle: `Fecha: ${todayDate} · Turno habitual`,
        });
      } else if (m === "materia") {
        await saveAsistenciasMateria([
          {
            alumnoId: studentRecord.id,
            alumnoNombre: studentRecord.nombre,
            fecha: todayDate,
            materia: s || "Materia",
            curso: studentRecord.curso,
            estado: "P",
            profesorId: p || "QR_SISTEMA",
          },
        ]);
        await logAction(userProfile.email, "C_AM", `Presente por Lector QR Integrado (${s})`);
        setSuccessInfo({
          tipo: `Materia: ${s}`,
          detalle: `Curso: ${studentRecord.curso} · Fecha: ${todayDate}`,
        });
      } else {
        throw new Error("Tipo de asistencia desconocido en el código QR.");
      }

      // Vibración háptica en celulares si está disponible
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setScannerStatus("success");
      notify.success("¡Asistencia registrada con éxito!");
      onSuccess?.();
    } catch (err: any) {
      console.error("[QR Scanner Error]:", err);
      setErrorMessage(err.message || "No se pudo registrar la asistencia.");
      setScannerStatus("error");
    } finally {
      isProcessingRef.current = false;
    }
  }, [userProfile, stopScanner, onSuccess]);

  // Iniciar la cámara y el escáner
  const startScanner = useCallback(async (cameraIdOrFacingMode?: string | { facingMode: string }) => {
    try {
      setScannerStatus("initializing");
      setErrorMessage("");
      await stopScanner();

      // Asegurar que el elemento contenedor exista en el DOM
      const element = document.getElementById(containerId);
      if (!element) return;

      const html5Qr = new Html5Qrcode(containerId);
      scannerRef.current = html5Qr;

      // Obtener cámaras disponibles
      try {
        const availableDevices = await Html5Qrcode.getCameras();
        if (availableDevices && availableDevices.length > 0) {
          setCameras(availableDevices);
        }
      } catch {
        // Ignorar si getCameras no es soportado antes del permiso
      }

      const cameraConfig = cameraIdOrFacingMode || { facingMode: "environment" };

      await html5Qr.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // Fallo frame a frame (normal cuando no hay QR en el visor, no loguear)
        }
      );

      setScannerStatus("scanning");
    } catch (err: any) {
      console.error("[QR Scanner Init Error]:", err);
      const msg = err?.message || String(err);
      if (msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowedError")) {
        setScannerStatus("permission_denied");
      } else {
        setErrorMessage("No se pudo acceder a la cámara. Verificá que no esté en uso por otra app.");
        setScannerStatus("error");
      }
    }
  }, [stopScanner, handleDecodedText]);

  // Cambiar entre cámara trasera y frontal
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
      // Pequeño retardo para asegurar que el modal se monte en el DOM
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

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopScanner();
          onClose();
        }
      }}
    >
      <div className="bg-[var(--bg)] w-full max-w-md rounded-[32px] sm:rounded-[40px] border border-[var(--border)] shadow-2xl overflow-hidden animate-zoom-in flex flex-col relative z-10">
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg2)]/80 backdrop-blur-md flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-black text-[var(--text)] text-base leading-tight">Escanear Asistencia</h3>
              <p className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mt-0.5">Lector QR Integrado</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {cameras.length > 1 && scannerStatus === "scanning" && (
              <button
                type="button"
                onClick={handleToggleCamera}
                title="Cambiar cámara (frontal/trasera)"
                className="p-2.5 rounded-xl bg-[var(--bg3)] hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] text-[var(--text2)] transition-all cursor-pointer"
              >
                <FlipHorizontal size={17} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-2.5 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-5 flex flex-col items-center text-center">
          {/* VISTA 1: ÉXITO */}
          {scannerStatus === "success" && (
            <div className="py-6 flex flex-col items-center animate-fade-in w-full space-y-4">
              <div className="w-20 h-20 bg-[var(--verde-bg)] text-[var(--verde)] rounded-full flex items-center justify-center border-4 border-[var(--verde-border)] shadow-[0_0_35px_rgba(16,185,129,0.4)] animate-bounce">
                <CheckCircle2 size={42} strokeWidth={2.5} />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                  <Sparkles size={12} />
                  ¡Presente Registrado!
                </div>
                <h4 className="text-2xl font-black text-[var(--text)]">Asistencia Confirmada</h4>
                <p className="text-xs text-[var(--text2)] font-semibold max-w-xs mx-auto">
                  Tu asistencia fue asentada en el sistema institucional correctamente.
                </p>
              </div>

              {successInfo && (
                <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 text-left space-y-1.5 shadow-inner">
                  <div className="text-[11px] font-black uppercase text-[var(--verde)] flex items-center gap-1.5">
                    <CalendarCheck size={14} />
                    <span>{successInfo.tipo}</span>
                  </div>
                  <div className="text-xs font-bold text-[var(--text2)]">
                    {successInfo.detalle}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  stopScanner();
                  onClose();
                }}
                className="w-full mt-2 bg-[var(--verde)] hover:brightness-110 text-black font-black py-3.5 px-5 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer text-sm"
              >
                Listo, Continuar
              </button>
            </div>
          )}

          {/* VISTA 2: ERROR */}
          {scannerStatus === "error" && (
            <div className="py-6 flex flex-col items-center animate-fade-in w-full space-y-4">
              <div className="w-18 h-18 bg-rose-500/15 text-rose-400 rounded-full flex items-center justify-center border-2 border-rose-500/30 shadow-lg">
                <AlertCircle size={38} />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-[var(--text)]">No se pudo registrar</h4>
                <p className="text-xs text-rose-300 font-semibold max-w-xs mx-auto">
                  {errorMessage || "Ocurrió un inconveniente al validar el código QR."}
                </p>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <button
                  type="button"
                  onClick={() => startScanner()}
                  className="flex-1 bg-[var(--verde)] text-black font-black py-3 px-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-xs"
                >
                  <RefreshCw size={15} />
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopScanner();
                    onClose();
                  }}
                  className="flex-1 bg-[var(--bg3)] text-[var(--text2)] border border-[var(--border)] font-bold py-3 px-4 rounded-2xl transition-all active:scale-95 text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* VISTA 3: PERMISO DENEGADO */}
          {scannerStatus === "permission_denied" && (
            <div className="py-6 flex flex-col items-center animate-fade-in w-full space-y-4">
              <div className="w-18 h-18 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center border-2 border-amber-500/30">
                <Camera size={36} />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-[var(--text)]">Permiso de Cámara Requerido</h4>
                <p className="text-xs text-[var(--text2)] font-medium max-w-xs mx-auto">
                  Para leer el código QR de asistencia necesitás autorizar el uso de la cámara en este navegador.
                </p>
              </div>

              <button
                type="button"
                onClick={() => startScanner()}
                className="w-full bg-[var(--verde)] text-black font-black py-3 px-4 rounded-2xl shadow-md transition-all active:scale-95 text-xs"
              >
                Conceder Permiso y Reintentar
              </button>
            </div>
          )}

          {/* VISTA 4: PROCESANDO */}
          {scannerStatus === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fade-in">
              <Loader2 size={44} className="animate-spin text-[var(--verde)]" />
              <div className="space-y-1">
                <p className="text-base font-black text-[var(--text)]">Validando tu asistencia...</p>
                <p className="text-xs text-[var(--text3)] font-semibold">Comprobando validez del código y legajo</p>
              </div>
            </div>
          )}

          {/* VISTA 5: ESCÁNER ACTIVO (CÁMARA EN VIVO) */}
          {(scannerStatus === "scanning" || scannerStatus === "initializing") && (
            <div className="w-full flex flex-col items-center space-y-4">
              {/* Visor de Cámara */}
              <div className="relative w-full max-w-[300px] aspect-square rounded-3xl overflow-hidden bg-black border-2 border-[var(--border)] shadow-inner flex items-center justify-center">
                {scannerStatus === "initializing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 space-y-2">
                    <Loader2 size={32} className="animate-spin text-[var(--verde)]" />
                    <span className="text-[11px] font-bold text-[var(--text2)]">Iniciando cámara...</span>
                  </div>
                )}

                {/* Contenedor del video html5-qrcode */}
                <div id={containerId} className="w-full h-full object-cover" />

                {/* Marco y mira láser animada */}
                <div className="absolute inset-4 pointer-events-none z-10 border-2 border-emerald-500/40 rounded-2xl">
                  {/* Esquinas resaltadas */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[var(--verde)] rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[var(--verde)] rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[var(--verde)] rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[var(--verde)] rounded-br-lg" />

                  {/* Línea láser de barrido */}
                  <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--verde)] to-transparent shadow-[0_0_8px_rgba(var(--verde-rgb),0.8)] animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text2)]">
                <QrCode size={15} className="text-[var(--verde)] shrink-0" />
                <span>Apuntá la cámara al código QR de la pantalla</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
