import { NextResponse } from "next/server";

export const revalidate = 86400; // 24 horas de revalidación ISR

export interface Feriado {
  fecha: string; // YYYY-MM-DD
  tipo: string;
  nombre: string;
}

const FALLBACK_FERIADOS: Feriado[] = [
  { fecha: "2026-01-01", tipo: "inamovible", nombre: "Año Nuevo" },
  { fecha: "2026-02-16", tipo: "inamovible", nombre: "Carnaval" },
  { fecha: "2026-02-17", tipo: "inamovible", nombre: "Carnaval" },
  { fecha: "2026-03-24", tipo: "inamovible", nombre: "Día Nacional de la Memoria por la Verdad y la Justicia" },
  { fecha: "2026-04-02", tipo: "inamovible", nombre: "Día del Veterano y de los Caídos en la Guerra de Malvinas" },
  { fecha: "2026-04-03", tipo: "inamovible", nombre: "Viernes Santo" },
  { fecha: "2026-05-01", tipo: "inamovible", nombre: "Día del Trabajador" },
  { fecha: "2026-05-25", tipo: "inamovible", nombre: "Día de la Revolución de Mayo" },
  { fecha: "2026-06-15", tipo: "trasladable", nombre: "Paso a la Inmortalidad del Gral. Don Martín Miguel de Güemes" },
  { fecha: "2026-06-20", tipo: "inamovible", nombre: "Paso a la Inmortalidad del Gral. Manuel Belgrano" },
  { fecha: "2026-07-09", tipo: "inamovible", nombre: "Día de la Independencia" },
  { fecha: "2026-08-17", tipo: "trasladable", nombre: "Paso a la Inmortalidad del Gral. José de San Martín" },
  { fecha: "2026-10-12", tipo: "trasladable", nombre: "Día del Respeto a la Diversidad Cultural" },
  { fecha: "2026-11-20", tipo: "trasladable", nombre: "Día de la Soberanía Nacional" },
  { fecha: "2026-12-08", tipo: "inamovible", nombre: "Inmaculada Concepción de María" },
  { fecha: "2026-12-25", tipo: "inamovible", nombre: "Navidad" },
];

export async function GET() {
  const currentYear = new Date().getFullYear();
  const apiUrl = `https://api.argentinadatos.com/v1/feriados/${currentYear}`;

  try {
    const response = await fetch(apiUrl, { next: { revalidate: 86400 } });

    if (response.ok) {
      const data: Feriado[] = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (error: any) {
    console.warn("[Feriados API]: Error o servicio externo inaccesible, sirviendo lista de respaldo institucional:", error?.message);
  }

  return NextResponse.json(FALLBACK_FERIADOS);
}
