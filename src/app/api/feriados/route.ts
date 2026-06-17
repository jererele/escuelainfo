import { NextResponse } from "next/server";

export const dynamic = "force-static";

export interface Feriado {
  fecha: string; // YYYY-MM-DD
  tipo: string;
  nombre: string;
}

export async function GET() {
  const currentYear = new Date().getFullYear();
  const apiUrl = `https://api.argentinadatos.com/v1/feriados/${currentYear}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Error al consultar feriados: ${response.statusText}`);
    }

    const data: Feriado[] = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Feriados API Error]:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los feriados nacionales." },
      { status: 500 }
    );
  }
}
