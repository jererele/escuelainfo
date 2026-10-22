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
  const auxRegex = /ultra|wide-angle|super wide|gran angular|0\.5|0\.6|0,5|0,6|tele|macro|depth|tof|aux/i;
  const mainRegex = /main|principal|primary|standard|1x|1\.0x|normal/i;

  // 1. Filtrar cámaras que NO sean frontales
  const nonFrontDevices = devices.filter(d => !frontRegex.test(d.label));

  if (nonFrontDevices.length === 0) {
    return devices[0].id;
  }

  // 2. Si alguna cámara trasera indica explícitamente ser "main", "principal" o "1x"
  const explicitMain = nonFrontDevices.find(d => 
    mainRegex.test(d.label) && !auxRegex.test(d.label)
  );
  if (explicitMain) return explicitMain.id;

  // 3. Buscar cámaras traseras que NO sean ultra-wide (0.5x, 0.6x), telephoto, ni macro
  const standardBack = nonFrontDevices.filter(d => 
    backRegex.test(d.label) && !auxRegex.test(d.label)
  );

  if (standardBack.length > 0) {
    // Si alguna contiene 'wide' (sin 'ultra'), esa suele ser la lente gran angular estándar 1.0x
    const wideStandard = standardBack.find(d => /wide/i.test(d.label) && !/ultra/i.test(d.label));
    if (wideStandard) return wideStandard.id;

    // Si hay una con índice o nombre distinto a 'camera2 0' (que en Samsung/Motorola suele ser la 0.6x):
    if (standardBack.length > 1) {
      const nonZero = standardBack.find(d => !/camera[0-9]?\s*0\b/i.test(d.label));
      if (nonZero) return nonZero.id;
    }

    return standardBack[0].id;
  }

  // 4. Si las etiquetas no mencionan 'back' explícitamente pero no son frontales:
  const withoutAux = nonFrontDevices.filter(d => !auxRegex.test(d.label));
  if (withoutAux.length > 0) {
    return withoutAux[0].id;
  }

  return nonFrontDevices[0].id;
}

/**
 * Obtiene la lista optimizada de cámaras para alternar (Trasera Principal + Frontal).
 * Evita pasear al usuario por 5 sensores auxiliares (macro, 0.6x, profundidad).
 */
export function getOptimizedCameraList(devices: CameraDevice[]): CameraDevice[] {
  if (!devices || devices.length <= 1) return devices;

  const frontRegex = /front|frontal|delantera|selfie|user|facing\s*front/i;
  const mainRearId = getBestMainRearCameraId(devices);

  const mainRear = devices.find(d => d.id === mainRearId) || devices[0];
  const front = devices.find(d => frontRegex.test(d.label));

  const result: CameraDevice[] = [mainRear];
  if (front && front.id !== mainRear.id) {
    result.push(front);
  } else {
    const other = devices.find(d => d.id !== mainRear.id);
    if (other) result.push(other);
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
          video: { facingMode: { ideal: "environment" } }
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
