import { Html5Qrcode } from "html5-qrcode";

export interface CameraDevice {
  id: string;
  label: string;
}

/**
 * Filtra y selecciona inteligentemente la mejor cámara trasera principal (1.0x / Main),
 * descartando deliberadamente sensores ultra gran angular (0.5x / 0.6x), frontales,
 * cámaras virtuales (Triple/Dual de iOS que arrancan en 0.5x), teleobjetivos o macro.
 */
export function getBestMainRearCameraId(devices: CameraDevice[]): string | null {
  if (!devices || devices.length === 0) return null;

  const frontRegex = /front|frontal|delantera|selfie|user|facing\s*front/i;
  const backRegex = /back|rear|trasera|environment|exterior|facing\s*back/i;
  
  // Descartar lentes auxiliares: 0.5x, 0.6x, 0.4x, ultra gran angular, teleobjetivo, macro, profundidad,
  // cámaras virtuales (triple/dual de iPhone que inician en 0.5x) y sensores Android con índice 2 en adelante.
  const auxRegex = /ultra|ultrawide|super\s*wide|ultra\s*gran\s*angular|s[uú]per\s*gran\s*angular|0\.[45678]|0,[45678]|tele|telephoto|teleobjetivo|macro|depth|profundidad|tof|bokeh|virtual|triple|dual|fisheye|\bcamera[0-9]?\s*[2-9]\b|\b[2-9],\s*facing/i;
  
  // Patrones que identifican positivamente a la cámara trasera principal 1.0x
  const explicitMainRegex = /\bmain\b|\bprincipal\b|\bprimary\b|\bstandard\b|\best[aá]ndar\b|\b1x\b|\b1\.0x\b|\bnormal\b/i;
  const appleStandardBackRegex = /^(?:back camera|c[aá]mara trasera|back wide angle camera|c[aá]mara trasera gran angular)(?:\s*\([0-9]+\))?$/i;
  const androidCameraZeroRegex = /\bcamera[0-9]?\s*0\b|\b0,\s*facing\s*back\b/i;

  // 1. Filtrar cámaras que NO sean frontales
  const nonFrontDevices = devices.filter(d => !frontRegex.test(d.label));
  if (nonFrontDevices.length === 0) {
    return devices[0].id;
  }

  // 2. Si alguna indica explícitamente ser "main", "principal", "1x" o "1.0x" (descartando auxiliares):
  const explicitMain = nonFrontDevices.find(d => explicitMainRegex.test(d.label) && !auxRegex.test(d.label));
  if (explicitMain) {
    return explicitMain.id;
  }

  // 3. Si es iOS con "Back Camera" o "Back Wide Angle Camera" (lente 1.0x física real de Apple, sin triple/dual/ultra):
  const appleBack = nonFrontDevices.find(d => appleStandardBackRegex.test(d.label.trim()) && !auxRegex.test(d.label));
  if (appleBack) {
    return appleBack.id;
  }

  // 4. Si hay una cámara Android Camera 0 (descartando sensores marcados como auxiliares):
  const cameraZero = nonFrontDevices.find(d => androidCameraZeroRegex.test(d.label) && !auxRegex.test(d.label));
  if (cameraZero) {
    return cameraZero.id;
  }

  // 5. Cámaras traseras que NO sean auxiliares (sin ultra, sin 0.5x/0.6x, sin tele, sin macro, sin triple/dual):
  const standardBack = nonFrontDevices.filter(d => backRegex.test(d.label) && !auxRegex.test(d.label));
  if (standardBack.length > 0) {
    // Si alguna contiene 'wide' estándar de Apple (ej: 'Back Wide Angle Camera') sin 'ultra':
    const wideStandard = standardBack.find(d => /wide/i.test(d.label) && !/ultra/i.test(d.label));
    if (wideStandard) return wideStandard.id;

    // Tomar la primera cámara trasera estándar limpia
    return standardBack[0].id;
  }

  // 6. Si ninguna etiqueta tiene 'back', pero no son auxiliares ni frontales:
  const withoutAux = nonFrontDevices.filter(d => !auxRegex.test(d.label));
  if (withoutAux.length > 0) {
    return withoutAux[0].id;
  }

  // Fallback seguro final:
  return nonFrontDevices[0].id;
}

/**
 * Obtiene la lista optimizada de cámaras para alternar (Trasera Principal + Frontal).
 * Filtra absolutamente sensores auxiliares (macro, 0.6x ultra gran angular, profundidad, triple/dual)
 * para que el usuario nunca quede atrapado en lentes gran angular al cambiar de cámara.
 */
export function getOptimizedCameraList(devices: CameraDevice[]): CameraDevice[] {
  if (!devices || devices.length <= 1) return devices;

  const frontRegex = /front|frontal|delantera|selfie|user|facing\s*front/i;
  const auxRegex = /ultra|ultrawide|super\s*wide|ultra\s*gran\s*angular|s[uú]per\s*gran\s*angular|0\.[45678]|0,[45678]|tele|telephoto|teleobjetivo|macro|depth|profundidad|tof|bokeh|virtual|triple|dual|fisheye|\bcamera[0-9]?\s*[2-9]\b|\b[2-9],\s*facing/i;

  const mainRearId = getBestMainRearCameraId(devices);
  const mainRear = devices.find(d => d.id === mainRearId) || devices[0];

  // Buscar cámara frontal principal (descartando sensores auxiliares o de profundidad como TrueDepth si hay una frontal normal)
  const frontCameras = devices.filter(d => frontRegex.test(d.label));
  const bestFront = frontCameras.find(d => !auxRegex.test(d.label)) || frontCameras[0];

  const result: CameraDevice[] = [mainRear];
  if (bestFront && bestFront.id !== mainRear.id) {
    result.push(bestFront);
  }

  return result;
}

/**
 * Devuelve restricciones de video exigiendo resolución Full HD / HD (1080p ideal, 720p min),
 * forzando al navegador móvil a descartar sensores secundarios o lentes gran angular/macro
 * de baja resolución y negociar exclusivamente con el sensor principal de alta nitidez.
 */
export function getHighQualityVideoConstraints(targetCameraId?: string): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 },
    frameRate: { ideal: 30, min: 15 },
  };

  if (targetCameraId) {
    constraints.deviceId = { exact: targetCameraId };
  } else {
    constraints.facingMode = { ideal: "environment" };
  }

  return constraints;
}

/**
 * Configuración de degradación segura en 720p para dispositivos de gama baja
 * que no soportan resolución mínima de 1280x720.
 */
export function getFallbackVideoConstraints(targetCameraId?: string): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, min: 15 },
  };

  if (targetCameraId) {
    constraints.deviceId = { exact: targetCameraId };
  } else {
    constraints.facingMode = "environment";
  }

  return constraints;
}

/**
 * Aplica restricciones óptimas en caliente directamente sobre la pista de video activa (MediaStreamTrack):
 * - Enfoque automático continuo (continuous autofocus) para nitidez instantánea.
 * - Forzado de zoom a 1.0x si el hardware o cámara virtual inició en factor gran angular (ej. 0.5x / 0.6x).
 */
export async function applyOptimalTrackConstraints(videoElementOrContainerId: HTMLVideoElement | string | null): Promise<void> {
  try {
    if (typeof window === "undefined" || !navigator?.mediaDevices) return;

    let videoEl: HTMLVideoElement | null = null;
    if (typeof videoElementOrContainerId === "string") {
      const container = document.getElementById(videoElementOrContainerId);
      videoEl = container ? container.querySelector("video") : null;
    } else {
      videoEl = videoElementOrContainerId;
    }

    if (!videoEl || !videoEl.srcObject) return;

    const stream = videoEl.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
    const settings = (track.getSettings ? track.getSettings() : {}) as any;
    const advanced: any[] = [];

    // 1. Autoenfoque continuo para lectura veloz de códigos QR
    if (capabilities.focusMode && Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }

    // 2. Corregir y fijar zoom a 1.0x si el sensor o cámara virtual arrancó en 0.5x / 0.6x
    if (capabilities.zoom) {
      const minZoom = typeof capabilities.zoom.min === "number" ? capabilities.zoom.min : 1;
      const maxZoom = typeof capabilities.zoom.max === "number" ? capabilities.zoom.max : 1;
      if (minZoom <= 1.0 && maxZoom >= 1.0) {
        advanced.push({ zoom: 1.0 });
      } else if (settings.zoom !== undefined && settings.zoom < 1.0 && maxZoom >= 1.0) {
        advanced.push({ zoom: 1.0 });
      }
    }

    if (advanced.length > 0) {
      await track.applyConstraints({ advanced });
    }
  } catch (err) {
    console.debug("[CameraHelper] Restricciones avanzadas no soportadas por el sensor actual:", err);
  }
}

/**
 * Obtiene los dispositivos de cámara disponibles asegurando que los nombres/labels
 * estén resueltos mediante comprobación previa de permisos si es necesario.
 */
export async function getCamerasWithLabels(): Promise<CameraDevice[]> {
  try {
    let devices = await Html5Qrcode.getCameras();

    // En navegadores móviles, si no se han otorgado permisos de cámara previamente,
    // getCameras() devuelve los dispositivos con label vacío ("").
    const hasLabels = devices.some(d => d.label && d.label.trim().length > 0);
    if (!hasLabels && typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        stream.getTracks().forEach(track => track.stop());
        devices = await Html5Qrcode.getCameras();
      } catch {
        // Ignorar si el usuario denegó permisos aquí; Html5Qrcode manejará el error al iniciar
      }
    }

    return devices || [];
  } catch {
    return [];
  }
}

