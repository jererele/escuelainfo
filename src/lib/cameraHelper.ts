import { Html5Qrcode } from "html5-qrcode";

export interface CameraDevice {
  id: string;
  label: string;
}

/**
 * Filtra y selecciona inteligentemente la mejor cámara trasera principal (1.0x / Main),
 * descartando deliberadamente sensores ultra gran angular (0.5x / 0.6x), frontales,
 * teleobjetivos o sensores macro auxiliares.
 */
export function getBestMainRearCameraId(devices: CameraDevice[]): string | null {
  if (!devices || devices.length === 0) return null;

  const frontRegex = /front|frontal|delantera|selfie|user|facing\s*front/i;
  const backRegex = /back|rear|trasera|environment|exterior|facing\s*back/i;
  
  // Descartar lentes auxiliares: 0.5x, 0.6x, ultra gran angular, teleobjetivo, macro, profundidad
  // y cámaras Android con índice 2 en adelante (en Android Camera2 HAL: 0=Main 1.0x, 1=Front, 2=Ultra-Wide, 3=Macro/Tele)
  const auxRegex = /ultra|ultrawide|super\s*wide|ultra\s*gran\s*angular|0\.[56]|0,[56]|tele|telephoto|teleobjetivo|macro|depth|profundidad|tof|bokeh|virtual|aux|\bcamera[0-9]?\s*[2-9]\b|\b[2-9],\s*facing/i;
  
  // Patrones que identifican positivamente a la cámara trasera principal 1.0x
  const androidCameraZeroRegex = /\bcamera[0-9]?\s*0\b|\b0,\s*facing\s*back\b/i;
  const explicitMainRegex = /\bmain\b|\bprincipal\b|\bprimary\b|\bstandard\b|\b1x\b|\b1\.0x\b|\bnormal\b/i;
  const appleStandardBackRegex = /^(?:back camera|c[aá]mara trasera)(?:\s*\([0-9]+\))?$/i;

  // 1. Filtrar cámaras que NO sean frontales
  const nonFrontDevices = devices.filter(d => !frontRegex.test(d.label));
  if (nonFrontDevices.length === 0) {
    return devices[0].id;
  }

  // 2. Si hay una cámara Android Camera 0 (la cámara trasera 1.0x oficial del sistema):
  const cameraZero = nonFrontDevices.find(d => androidCameraZeroRegex.test(d.label) && !auxRegex.test(d.label));
  if (cameraZero) {
    return cameraZero.id;
  }

  // 3. Si alguna indica explícitamente ser "main", "principal", "1x" o "1.0x":
  const explicitMain = nonFrontDevices.find(d => explicitMainRegex.test(d.label) && !auxRegex.test(d.label));
  if (explicitMain) {
    return explicitMain.id;
  }

  // 4. Si es iOS con "Back Camera" exacto (o "Cámara trasera"):
  const appleBack = nonFrontDevices.find(d => appleStandardBackRegex.test(d.label.trim()) && !auxRegex.test(d.label));
  if (appleBack) {
    return appleBack.id;
  }

  // 5. Cámaras traseras que NO sean auxiliares (sin ultra, sin 0.5x/0.6x, sin tele, sin macro):
  const standardBack = nonFrontDevices.filter(d => backRegex.test(d.label) && !auxRegex.test(d.label));
  if (standardBack.length > 0) {
    // Si alguna contiene 'wide' estándar de Apple (ej: 'Back Wide Angle Camera') sin 'ultra':
    const wideStandard = standardBack.find(d => /wide/i.test(d.label) && !/ultra/i.test(d.label));
    if (wideStandard) return wideStandard.id;

    // Tomar la primera cámara trasera estándar (la principal)
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
 * Filtra absolutamente sensores auxiliares (macro, 0.6x ultra gran angular, profundidad)
 * para que el usuario nunca quede atrapado en lentes gran angular al cambiar de cámara.
 */
export function getOptimizedCameraList(devices: CameraDevice[]): CameraDevice[] {
  if (!devices || devices.length <= 1) return devices;

  const frontRegex = /front|frontal|delantera|selfie|user|facing\s*front/i;
  const auxRegex = /ultra|ultrawide|super\s*wide|ultra\s*gran\s*angular|0\.[56]|0,[56]|tele|telephoto|teleobjetivo|macro|depth|profundidad|tof|bokeh|virtual|aux|\bcamera[0-9]?\s*[2-9]\b|\b[2-9],\s*facing/i;

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

