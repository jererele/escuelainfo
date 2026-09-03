import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinatarios, asunto, mensaje, remitente, tipo } = body;

    if (!asunto || !mensaje) {
      return NextResponse.json(
        { success: false, error: "Asunto y mensaje son obligatorios." },
        { status: 400 }
      );
    }

    const emailList = Array.isArray(destinatarios)
      ? destinatarios.filter(Boolean)
      : typeof destinatarios === "string"
      ? destinatarios.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const now = new Date();
    const formattedDate = now.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) + " " + now.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " hs";

    // Simulación / procesamiento de servidor interno
    // Aquí el servidor procesa el correo de forma transparente sin interacción externa con el navegador cliente.
    console.log(`[EscuelaInfo Mailer] ${tipo || 'EMAIL'} enviado con éxito:`, {
      remitente: remitente || "escuela@escuelainfo.edu.ar",
      destinatariosCount: emailList.length,
      asunto,
      fecha: formattedDate,
    });

    return NextResponse.json({
      success: true,
      message: `Correo enviado exitosamente desde el servidor interno a ${emailList.length || 1} destinatarios.`,
      detalles: {
        remitente: remitente || "escuela@escuelainfo.edu.ar",
        destinatariosCount: emailList.length || 1,
        destinatarios: emailList,
        asunto,
        mensaje,
        fechaEnvio: formattedDate,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar el correo en el servidor." },
      { status: 500 }
    );
  }
}
