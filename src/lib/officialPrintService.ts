/**
 * officialPrintService.ts
 * Genera documentos ministeriales oficiales en alta resolución listos para imprimir o guardar en PDF,
 * con membrete institucional de la Provincia del Chubut y la Escuela N° 713 "Juan Abdala Chayep".
 */

export interface PrintAttendanceSheetOptions {
  curso: string;
  mesNombre: string;
  anio: number;
  diasEnMes: number;
  alumnos: {
    nombre: string;
    dni: string;
    asistenciasPorDia: Record<number, "P" | "A" | "M" | "T" | "R" | "J" | "">;
  }[];
  preceptorNombre?: string;
}

export interface PrintExamBoardOptions {
  materia: string;
  fecha: string;
  hora: string;
  aula: string;
  libroNumero?: string;
  folioNumero?: string;
  turno?: string;
  presidenteNombre: string;
  vocal1Nombre?: string;
  vocal2Nombre?: string;
  alumnosInscriptos: {
    nombre: string;
    dni: string;
    escrito?: string;
    oral?: string;
    calificacion?: string;
    calificacionLetras?: string;
    condicion?: "Aprobado" | "Desaprobado" | "Ausente" | "";
  }[];
}

export interface PrintParentCitationOptions {
  alumnoNombre: string;
  alumnoDni: string;
  curso: string;
  totalFaltas: number;
  nivelRiesgo: "Preventivo (10 faltas)" | "Crítico (15 faltas)" | "Pérdida de Regularidad (20 faltas)";
  fechaCitacion?: string;
  preceptorNombre?: string;
  detalleFaltasRecientes?: string[];
}

const openPrintWindow = (title: string, htmlContent: string) => {
  const printWindow = window.open("", "_blank", "width=1000,height=800");
  if (!printWindow) {
    alert("Por favor, permita las ventanas emergentes (pop-ups) para generar el documento oficial imprimible.");
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    @page landscape {
      size: A4 landscape;
      margin: 10mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 11pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-landscape {
      page: landscape;
    }
    .header-border {
      border-bottom: 2px solid #047857;
      padding-bottom: 8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-titles h1 {
      font-size: 13pt;
      font-weight: 900;
      margin: 0;
      color: #065f46;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-titles h2 {
      font-size: 11pt;
      font-weight: 700;
      margin: 2px 0 0 0;
      color: #1f2937;
    }
    .header-titles p {
      font-size: 9pt;
      margin: 2px 0 0 0;
      color: #4b5563;
    }
    .header-cue {
      text-align: right;
      font-size: 8.5pt;
      font-weight: 600;
      color: #374151;
      border-left: 2px solid #e5e7eb;
      padding-left: 12px;
    }
    .document-title {
      text-align: center;
      margin: 12px 0;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 6px 12px;
    }
    .document-title h3 {
      margin: 0;
      font-size: 12pt;
      font-weight: 800;
      color: #065f46;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      font-size: 9.5pt;
      margin-bottom: 14px;
      background: #f9fafb;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .meta-item strong {
      color: #374151;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 8px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      text-align: center;
    }
    table.data-table th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      font-size: 7.5pt;
    }
    table.data-table td.text-left {
      text-align: left;
    }
    .signatures-block {
      margin-top: 36px;
      display: flex;
      justify-content: space-around;
      page-break-inside: avoid;
    }
    .signature-slot {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1.5px solid #4b5563;
      margin-bottom: 6px;
    }
    .signature-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
    }
    .no-print-bar {
      background: #111827;
      color: #fff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -20px -20px 20px -20px;
      font-family: system-ui, sans-serif;
    }
    .btn-print {
      background: #10b981;
      color: #000;
      font-weight: 800;
      padding: 8px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div style="font-weight: 700; font-size: 13px;">
      Documento Oficial Escuela N° 713 - Vista Previa de Impresión
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn-print" onclick="window.print()">
        🖨️ Imprimir / Guardar en PDF
      </button>
      <button onclick="window.close()" style="background:#374151; color:#fff; border:none; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:700;">
        Cerrar
      </button>
    </div>
  </div>
  ${htmlContent}
</body>
</html>`);

  printWindow.document.close();
};

/**
 * Genera e imprime la Planilla Mensual Oficial de Asistencia
 */
export const printOfficialAttendanceSheet = (opts: PrintAttendanceSheetOptions) => {
  const { curso, mesNombre, anio, diasEnMes, alumnos, preceptorNombre } = opts;

  let daysHeader = "";
  for (let d = 1; d <= diasEnMes; d++) {
    daysHeader += `<th style="width: 18px; padding: 2px;">${d}</th>`;
  }

  const rows = alumnos.map((al, index) => {
    let daysCells = "";
    let totalP = 0;
    let totalA = 0;
    let totalM = 0;
    let totalT = 0;
    let totalJ = 0;

    for (let d = 1; d <= diasEnMes; d++) {
      const mark = al.asistenciasPorDia[d] || "";
      let style = "";
      if (mark === "A") { totalA++; style = "color: #dc2626; font-weight: bold;"; }
      else if (mark === "P") { totalP++; style = "color: #059669;"; }
      else if (mark === "M") { totalM++; style = "color: #d97706; font-weight: bold;"; }
      else if (mark === "T") { totalT++; style = "color: #2563eb;"; }
      else if (mark === "J") { totalJ++; style = "color: #7c3aed;"; }

      daysCells += `<td style="padding: 2px; font-size: 7.5pt; ${style}">${mark}</td>`;
    }

    const faltasCalculadas = totalA + (totalM * 0.5) + (totalT * 0.25);
    const porcentaje = diasEnMes > 0 ? Math.round((totalP / (totalP + faltasCalculadas || 1)) * 100) : 100;

    return `<tr>
      <td style="font-weight: 700;">${index + 1}</td>
      <td class="text-left" style="font-size: 8pt; white-space: nowrap; font-weight: 600;">${al.nombre}</td>
      <td style="font-size: 7.5pt; font-family: monospace;">${al.dni}</td>
      ${daysCells}
      <td style="font-weight: 700; color: #059669;">${totalP}</td>
      <td style="font-weight: 700; color: #dc2626;">${faltasCalculadas.toFixed(2)}</td>
      <td style="font-weight: 700;">${porcentaje}%</td>
    </tr>`;
  }).join("");

  const content = `
    <div class="page-landscape">
      <div class="header-border">
        <div class="header-titles">
          <h1>Provincia del Chubut · Ministerio de Educación</h1>
          <h2>Escuela N° 713 "Juan Abdala Chayep" · Esquel</h2>
          <p>Supervisión Técnica Seccional de Educación Secundaria</p>
        </div>
        <div class="header-cue">
          C.U.E.: 2600214-00<br>
          Régimen: Técnico / Polimodal<br>
          Ciclo Lectivo: ${anio}
        </div>
      </div>

      <div class="document-title">
        <h3>Planilla Mensual de Registro y Control de Asistencia</h3>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><strong>Curso / División:</strong> ${curso}</div>
        <div class="meta-item"><strong>Mes:</strong> ${mesNombre} de ${anio}</div>
        <div class="meta-item"><strong>Matrícula Activa:</strong> ${alumnos.length} estudiantes</div>
        <div class="meta-item"><strong>Preceptor/a Responsable:</strong> ${preceptorNombre || "Preceptoría"}</div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="2" style="width: 24px;">N°</th>
            <th rowspan="2" style="width: 210px;" class="text-left">Apellido y Nombre del Estudiante</th>
            <th rowspan="2" style="width: 75px;">DNI</th>
            <th colspan="${diasEnMes}">Días del Mes</th>
            <th rowspan="2" style="width: 32px;" title="Presente">P</th>
            <th rowspan="2" style="width: 36px;" title="Inasistencias">Faltas</th>
            <th rowspan="2" style="width: 34px;">% Asist</th>
          </tr>
          <tr>
            ${daysHeader}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="margin-top: 14px; font-size: 7.5pt; color: #4b5563; display: flex; justify-content: space-between;">
        <span><strong>Referencias:</strong> P = Presente | A = Ausente (1) | M = Media Falta (0.5) | T = Tarde (0.25) | J = Justificada | R = Retiro</span>
        <span>Sistema de Gestión Institucional EscuelaInfo · ${new Date().toLocaleDateString("es-AR")}</span>
      </div>

      <div class="signatures-block">
        <div class="signature-slot">
          <div class="signature-line"></div>
          <div class="signature-title">Firma y Sello Preceptor/a</div>
        </div>
        <div class="signature-slot">
          <div class="signature-line"></div>
          <div class="signature-title">Secretaría Escolar</div>
        </div>
        <div class="signature-slot">
          <div class="signature-line"></div>
          <div class="signature-title">Equipo Directivo</div>
        </div>
      </div>
    </div>
  `;

  openPrintWindow(`Planilla_Asistencia_${curso.replace(/\s+/g, "_")}_${mesNombre}`, content);
};

/**
 * Genera e imprime el Acta Volante Oficial de Mesa de Examen
 */
export const printOfficialExamBoardMinutes = (opts: PrintExamBoardOptions) => {
  const {
    materia,
    fecha,
    hora,
    aula,
    libroNumero = "___",
    folioNumero = "___",
    turno = "Ordinario",
    presidenteNombre,
    vocal1Nombre = "Sin asignar",
    vocal2Nombre = "Sin asignar",
    alumnosInscriptos,
  } = opts;

  const rows = alumnosInscriptos.length === 0
    ? `<tr><td colspan="7" style="padding: 16px; font-style: italic; color: #6b7280;">No se registraron alumnos inscriptos en esta mesa.</td></tr>`
    : alumnosInscriptos.map((al, idx) => `
      <tr>
        <td style="font-weight: 700;">${idx + 1}</td>
        <td style="font-family: monospace;">${al.dni}</td>
        <td class="text-left" style="font-weight: 600;">${al.nombre}</td>
        <td>${al.escrito || "—"}</td>
        <td>${al.oral || "—"}</td>
        <td style="font-weight: 800;">${al.calificacion || "—"} (${al.calificacionLetras || "—"})</td>
        <td style="font-weight: 700; ${al.condicion === 'Aprobado' ? 'color:#059669;' : al.condicion === 'Desaprobado' ? 'color:#dc2626;' : ''}">
          ${al.condicion || "Pendiente"}
        </td>
      </tr>
    `).join("");

  const content = `
    <div>
      <div class="header-border">
        <div class="header-titles">
          <h1>Provincia del Chubut · Ministerio de Educación</h1>
          <h2>Escuela N° 713 "Juan Abdala Chayep" · Esquel</h2>
          <p>Supervisión Técnica Seccional de Educación Secundaria</p>
        </div>
        <div class="header-cue">
          C.U.E.: 2600214-00<br>
          Libro Matriz N°: <strong>${libroNumero}</strong><br>
          Folio N°: <strong>${folioNumero}</strong>
        </div>
      </div>

      <div class="document-title">
        <h3>Acta Volante Oficial de Exámenes y Evaluación</h3>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><strong>Espacio Curricular:</strong> ${materia}</div>
        <div class="meta-item"><strong>Fecha de Examen:</strong> ${fecha} (${hora} hs)</div>
        <div class="meta-item"><strong>Turno / Instancia:</strong> ${turno}</div>
        <div class="meta-item"><strong>Aula Asignada:</strong> ${aula || "Inst. Escolar"}</div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 9pt;">
        <strong>Tribunal Examinador Oficial:</strong><br>
        • <strong>Presidente:</strong> ${presidenteNombre}<br>
        • <strong>Vocal 1:</strong> ${vocal1Nombre}<br>
        • <strong>Vocal 2:</strong> ${vocal2Nombre}
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 28px;">N°</th>
            <th style="width: 90px;">DNI</th>
            <th class="text-left">Apellido y Nombre del Estudiante</th>
            <th style="width: 65px;">Escrito</th>
            <th style="width: 65px;">Oral</th>
            <th style="width: 140px;">Calificación Definitiva</th>
            <th style="width: 100px;">Condición</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="margin-top: 14px; font-size: 8pt; color: #4b5563;">
        En la ciudad de Esquel, Provincia del Chubut, a los ${fecha ? fecha.split("-").reverse().join("/") : "___"} se da por finalizada la presente acta volante, firmando los miembros del tribunal examinador de plena conformidad.
      </div>

      <div class="signatures-block">
        <div class="signature-slot">
          <div class="signature-line"></div>
          <div class="signature-title">${presidenteNombre}<br><span style="font-size:7.5pt; font-weight:normal;">Presidente de Mesa</span></div>
        </div>
        <div class="signature-slot">
          <div class="signature-line"></div>
          <div class="signature-title">${vocal1Nombre}<br><span style="font-size:7.5pt; font-weight:normal;">Vocal 1</span></div>
        </div>
        <div class="signature-slot">
          <div class="signature-line"></div>
          <div class="signature-title">${vocal2Nombre}<br><span style="font-size:7.5pt; font-weight:normal;">Vocal 2</span></div>
        </div>
        <div class="signature-slot">
          <div class="signature-line"></div>
          <div class="signature-title">Equipo Directivo / Regencia<br><span style="font-size:7.5pt; font-weight:normal;">Firma y Sello</span></div>
        </div>
      </div>
    </div>
  `;

  openPrintWindow(`Acta_Volante_${materia.replace(/\s+/g, "_")}_${fecha}`, content);
};

/**
 * Genera la Cédula Oficial de Notificación / Citación a Padres por Alerta de Deserción
 */
export const printParentAbsenceCitation = (opts: PrintParentCitationOptions) => {
  const {
    alumnoNombre,
    alumnoDni,
    curso,
    totalFaltas,
    nivelRiesgo,
    fechaCitacion = new Date().toLocaleDateString("es-AR"),
    preceptorNombre = "Preceptoría de Turno"
  } = opts;

  const content = `
    <div>
      <div class="header-border">
        <div class="header-titles">
          <h1>Provincia del Chubut · Ministerio de Educación</h1>
          <h2>Escuela N° 713 "Juan Abdala Chayep" · Esquel</h2>
          <p>Supervisión Técnica Seccional de Educación Secundaria</p>
        </div>
        <div class="header-cue">
          C.U.E.: 2600214-00<br>
          Régimen de Asistencias y Regularidad<br>
          Fecha: <strong>${fechaCitacion}</strong>
        </div>
      </div>

      <div class="document-title" style="background: #fef2f2; border-color: #fecaca;">
        <h3 style="color: #991b1b;">Cédula Oficial de Notificación Preventiva de Inasistencias</h3>
      </div>

      <p style="font-size: 10pt; text-align: justify; margin: 16px 0;">
        Señor/a Padre, Madre o Tutor Legal del estudiante <strong>${alumnoNombre}</strong> (DNI N° <strong>${alumnoDni}</strong>), matriculado en el curso <strong>${curso}</strong>:
      </p>

      <p style="font-size: 10pt; text-align: justify; margin: 12px 0;">
        Por la presente se le notifica que al día de la fecha el/la estudiante acumula un total de <strong>${totalFaltas.toFixed(2)} inasistencias</strong> institucionales, encuadrándose formalmente en la condición de:
      </p>

      <div style="background: #fff1f2; border-left: 4px solid #e11d48; padding: 12px 16px; margin: 14px 0; border-radius: 4px;">
        <div style="font-size: 11pt; font-weight: 800; color: #9f1239; text-transform: uppercase;">
          ${nivelRiesgo}
        </div>
        <div style="font-size: 9pt; color: #4c0519; margin-top: 4px;">
          Conforme al Régimen Académico y la Normativa de Asistencia Escolar Provincial, el límite máximo permitido para la conservación de la regularidad plena es de <strong>15 inasistencias</strong> (con prórroga justificada hasta 20). Superado dicho límite, el estudiante incurre en <strong>pérdida de la condición de alumno regular</strong>.
        </div>
      </div>

      <p style="font-size: 10pt; text-align: justify; margin: 14px 0;">
        A fin de garantizar la continuidad de la trayectoria escolar y coordinar acciones de acompañamiento pedagógico, <strong>se solicita a Ud. presentarse con carácter de URGENTE</strong> ante la Preceptoría / Equipo de Orientación de la Escuela N° 713 dentro de las próximas 48 horas hábiles.
      </p>

      <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
        <div style="text-align: center; width: 260px;">
          <div style="border-top: 1.5px solid #374151; margin-bottom: 6px;"></div>
          <div style="font-size: 8.5pt; font-weight: 700; text-transform: uppercase;">
            ${preceptorNombre}<br>
            <span style="font-size: 7.5pt; font-weight: normal; color: #6b7280;">Preceptoría · Escuela N° 713</span>
          </div>
        </div>
      </div>

      <!-- TALÓN DE DESGLOSE / RECIBO PARA PRECEPTORÍA -->
      <div style="margin-top: 45px; border-top: 2px dashed #9ca3af; padding-top: 20px;">
        <div style="font-size: 8pt; text-transform: uppercase; color: #6b7280; font-weight: 800; text-align: center; margin-bottom: 12px;">
          Talón de Constancia de Notificación (Debe devolverse firmado a Preceptoría)
        </div>

        <div style="font-size: 9.5pt; margin-bottom: 24px; text-align: justify;">
          Yo, ____________________________________________________, DNI N° _____________________, en mi carácter de (Padre/Madre/Tutor) del estudiante <strong>${alumnoNombre}</strong>, dejo constancia de haber sido debidamente notificado/a de las <strong>${totalFaltas.toFixed(2)} inasistencias</strong> y la situación de <strong>${nivelRiesgo}</strong> a los _____ días del mes de ____________________ de 2026.
        </div>

        <div style="display: flex; justify-content: space-around; margin-top: 30px;">
          <div style="text-align: center; width: 220px;">
            <div style="border-top: 1.5px solid #374151; margin-bottom: 4px;"></div>
            <div style="font-size: 8pt; font-weight: 700;">Firma del Padre / Madre / Tutor</div>
          </div>
          <div style="text-align: center; width: 220px;">
            <div style="border-top: 1.5px solid #374151; margin-bottom: 4px;"></div>
            <div style="font-size: 8pt; font-weight: 700;">Aclaración y Teléfono de Contacto</div>
          </div>
        </div>
      </div>
    </div>
  `;

  openPrintWindow(`Citacion_Inasistencias_${alumnoNombre.replace(/\s+/g, "_")}`, content);
};
