/**
 * imageCompressor.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilidad de compresión y conversión de imágenes a WebP en el navegador.
 * Reduce el peso de fotos de certificados médicos y documentos hasta un 95%
 * sin pérdida perceptible de nitidez ni legibilidad de sellos o firmas.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (default 0.82)
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  isWebP: boolean;
}

/**
 * Convierte y comprime una imagen a formato WebP utilizando la API Canvas nativa.
 * Si el archivo es un PDF u otro formato no imagen, lo devuelve intacto.
 */
export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = options;

  // Si no es imagen (ej: documento PDF), no intentar procesar como mapa de bits
  if (!file.type.startsWith("image/")) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      reductionPercentage: 0,
      isWebP: false,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escalado proporcional preservando aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight;
            height = Math.round((height * maxHeight) / (img.height || 1));
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback seguro si falla el contexto 2D
          resolve({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            reductionPercentage: 0,
            isWebP: false,
          });
          return;
        }

        // Suavizado de imagen de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                originalSize: file.size,
                compressedSize: file.size,
                reductionPercentage: 0,
                isWebP: false,
              });
              return;
            }

            // Si por algún motivo el blob resultante pesara más que el original, conservar el original
            if (blob.size >= file.size && file.type === "image/webp") {
              resolve({
                file,
                originalSize: file.size,
                compressedSize: file.size,
                reductionPercentage: 0,
                isWebP: true,
              });
              return;
            }

            const cleanBaseName = file.name.replace(/\.[^/.]+$/, "");
            const newFileName = `${cleanBaseName}.webp`;

            const compressedFile = new File([blob], newFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const reduction = Math.max(
              0,
              Math.round(((file.size - blob.size) / file.size) * 100)
            );

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
              reductionPercentage: reduction,
              isWebP: true,
            });
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          reductionPercentage: 0,
          isWebP: false,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        reductionPercentage: 0,
        isWebP: false,
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Formatea un tamaño en bytes a un formato legible (ej: 245 KB, 2.1 MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
