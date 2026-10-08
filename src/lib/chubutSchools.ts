// ─── Base de Datos Oficial de Escuelas Secundarias de la Provincia del Chubut ─
// Organizadas según las 6 Regiones Educativas del Ministerio de Educación de Chubut

export interface ChubutRegion {
  id: string;
  numeroRomano: string;
  nombre: string;
  zona: string;
  ciudadesPrincipales: string[];
}

export interface ChubutSchool {
  id: string;
  numero: string;
  nombre: string;
  nombreCompleto: string;
  ciudad: string;
  regionId: string;
  regionNombre: string;
  tipo: "secundaria" | "tecnica" | "agrotecnica" | "arte";
  cue?: string;
  direccion?: string;
}

export const CHUBUT_REGIONS: ChubutRegion[] = [
  {
    id: "region-1",
    numeroRomano: "I",
    nombre: "Región I",
    zona: "Noroeste Cordillerano",
    ciudadesPrincipales: ["Lago Puelo", "El Hoyo", "El Maitén", "Epuyén", "Cholila", "Cushamen"],
  },
  {
    id: "region-2",
    numeroRomano: "II",
    nombre: "Región II",
    zona: "Península Valdés y Golfo Nuevo",
    ciudadesPrincipales: ["Puerto Madryn", "Puerto Pirámides"],
  },
  {
    id: "region-3",
    numeroRomano: "III",
    nombre: "Región III",
    zona: "Cordillera Central",
    ciudadesPrincipales: ["Esquel", "Trevelin", "Corcovado", "Tecka"],
  },
  {
    id: "region-4",
    numeroRomano: "IV",
    nombre: "Región IV",
    zona: "Valle Inferior del Río Chubut (VIRCh)",
    ciudadesPrincipales: ["Trelew", "Rawson", "Playa Unión", "Gaiman", "Dolavon", "28 de Julio"],
  },
  {
    id: "region-5",
    numeroRomano: "V",
    nombre: "Región V",
    zona: "Meseta Central",
    ciudadesPrincipales: ["Gobernador Costa", "José de San Martín", "Paso de Indios", "Las Plumas", "Gan Gan", "Gastre", "Telsen", "Los Altares"],
  },
  {
    id: "region-6",
    numeroRomano: "VI",
    nombre: "Región VI",
    zona: "Golfo San Jorge y Cuenca Sur",
    ciudadesPrincipales: ["Comodoro Rivadavia", "Rada Tilly", "Sarmiento", "Río Mayo"],
  },
];

export const CHUBUT_SCHOOLS: ChubutSchool[] = [
  // ─── REGIÓN I: Noroeste Cordillerano ─────────────────────────────────────────
  {
    id: "esc-717-radal",
    numero: "717",
    nombre: "Obispo Dr. Alberto Devoto",
    nombreCompleto: "Escuela N° 717 «Obispo Dr. Alberto Devoto»",
    ciudad: "Lago Puelo (Cerro Radal)",
    regionId: "region-1",
    regionNombre: "Región I · Noroeste Cordillerano",
    tipo: "agrotecnica",
    cue: "2600215-00",
  },
  {
    id: "esc-765-lagopuelo",
    numero: "765",
    nombre: "Roca del Tiempo",
    nombreCompleto: "Escuela N° 765 «Roca del Tiempo»",
    ciudad: "Lago Puelo",
    regionId: "region-1",
    regionNombre: "Región I · Noroeste Cordillerano",
    tipo: "secundaria",
  },
  {
    id: "esc-7722-lagopuelo",
    numero: "7722",
    nombre: "Secundaria Lago Puelo",
    nombreCompleto: "Escuela Secundaria N° 7722",
    ciudad: "Lago Puelo",
    regionId: "region-1",
    regionNombre: "Región I · Noroeste Cordillerano",
    tipo: "secundaria",
  },
  {
    id: "esc-734-elhoyo",
    numero: "734",
    nombre: "Cóndor Andino",
    nombreCompleto: "Escuela N° 734 «Cóndor Andino»",
    ciudad: "El Hoyo",
    regionId: "region-1",
    regionNombre: "Región I · Noroeste Cordillerano",
    tipo: "secundaria",
  },
  {
    id: "esc-7727-elhoyo",
    numero: "7727",
    nombre: "Secundaria El Hoyo",
    nombreCompleto: "Escuela Secundaria N° 7727",
    ciudad: "El Hoyo",
    regionId: "region-1",
    regionNombre: "Región I · Noroeste Cordillerano",
    tipo: "secundaria",
  },
  {
    id: "esc-726-elmaiten",
    numero: "726",
    nombre: "Secundaria El Maitén",
    nombreCompleto: "Escuela N° 726",
    ciudad: "El Maitén",
    regionId: "region-1",
    regionNombre: "Región I · Noroeste Cordillerano",
    tipo: "secundaria",
  },
  {
    id: "esc-774-epuyen",
    numero: "774",
    nombre: "Secundaria Epuyén",
    nombreCompleto: "Escuela N° 774",
    ciudad: "Epuyén",
    regionId: "region-1",
    regionNombre: "Región I · Noroeste Cordillerano",
    tipo: "secundaria",
  },
  {
    id: "esc-727-cholila",
    numero: "727",
    nombre: "Secundaria Cholila",
    nombreCompleto: "Escuela N° 727",
    ciudad: "Cholila",
    regionId: "region-1",
    regionNombre: "Región I · Noroeste Cordillerano",
    tipo: "secundaria",
  },
  {
    id: "esc-709-cushamen",
    numero: "709",
    nombre: "Secundaria Cushamen",
    nombreCompleto: "Escuela N° 709",
    ciudad: "Cushamen",
    regionId: "region-1",
    regionNombre: "Región I · Noroeste Cordillerano",
    tipo: "secundaria",
  },

  // ─── REGIÓN II: Península Valdés y Golfo Nuevo ──────────────────────────────
  {
    id: "esc-703-madryn",
    numero: "703",
    nombre: "José Toshirô Kuipis (Politécnica)",
    nombreCompleto: "Escuela Politécnica N° 703 «José Toshirô Kuipis»",
    ciudad: "Puerto Madryn",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "tecnica",
  },
  {
    id: "esc-728-madryn",
    numero: "728",
    nombre: "Alfonsina Storni",
    nombreCompleto: "Escuela N° 728 «Alfonsina Storni»",
    ciudad: "Puerto Madryn",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "secundaria",
  },
  {
    id: "esc-741-madryn",
    numero: "741",
    nombre: "Secundaria Puerto Madryn",
    nombreCompleto: "Escuela N° 741",
    ciudad: "Puerto Madryn",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "secundaria",
  },
  {
    id: "esc-750-madryn",
    numero: "750",
    nombre: "Leandro N. Alem",
    nombreCompleto: "Escuela N° 750 «Leandro N. Alem»",
    ciudad: "Puerto Madryn",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "secundaria",
  },
  {
    id: "esc-768-madryn",
    numero: "768",
    nombre: "Claudia Falcone",
    nombreCompleto: "Escuela N° 768 «Claudia Falcone»",
    ciudad: "Puerto Madryn",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "secundaria",
  },
  {
    id: "esc-775-madryn",
    numero: "775",
    nombre: "Secundaria Puerto Madryn",
    nombreCompleto: "Escuela N° 775",
    ciudad: "Puerto Madryn",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "secundaria",
  },
  {
    id: "esc-789-madryn",
    numero: "789",
    nombre: "Secundaria Puerto Madryn",
    nombreCompleto: "Escuela N° 789",
    ciudad: "Puerto Madryn",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "secundaria",
  },
  {
    id: "esc-7707-madryn",
    numero: "7707",
    nombre: "Secundaria Puerto Madryn",
    nombreCompleto: "Escuela N° 7707",
    ciudad: "Puerto Madryn",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "secundaria",
  },
  {
    id: "esc-7726-madryn",
    numero: "7726",
    nombre: "Secundaria Puerto Madryn",
    nombreCompleto: "Escuela N° 7726",
    ciudad: "Puerto Madryn",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "secundaria",
  },
  {
    id: "esc-7710-piramides",
    numero: "7710",
    nombre: "Secundaria Puerto Pirámides",
    nombreCompleto: "Escuela N° 7710",
    ciudad: "Puerto Pirámides",
    regionId: "region-2",
    regionNombre: "Región II · Península Valdés y Golfo Nuevo",
    tipo: "secundaria",
  },

  // ─── REGIÓN III: Cordillera Central ─────────────────────────────────────────
  {
    id: "esc-713-esquel",
    numero: "713",
    nombre: "Juan Abdala Chayep",
    nombreCompleto: "Escuela N° 713 «Juan Abdala Chayep»",
    ciudad: "Esquel",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "tecnica",
    cue: "2600214-00",
  },
  {
    id: "esc-701-esquel",
    numero: "701",
    nombre: "Eduardo C. Jorge (Politécnica)",
    nombreCompleto: "Escuela Politécnica N° 701 «Eduardo C. Jorge»",
    ciudad: "Esquel",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "tecnica",
  },
  {
    id: "esc-705-trevelin",
    numero: "705",
    nombre: "Llao Llao",
    nombreCompleto: "Escuela N° 705 «Llao Llao»",
    ciudad: "Trevelin",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "secundaria",
  },
  {
    id: "esc-708-esquel",
    numero: "708",
    nombre: "Malvinas Argentinas",
    nombreCompleto: "Escuela N° 708 «Malvinas Argentinas»",
    ciudad: "Esquel",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "secundaria",
  },
  {
    id: "esc-735-esquel",
    numero: "735",
    nombre: "José de San Martín",
    nombreCompleto: "Escuela N° 735 «José de San Martín»",
    ciudad: "Esquel",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "secundaria",
  },
  {
    id: "esc-758-esquel",
    numero: "758",
    nombre: "Lucía Epullán",
    nombreCompleto: "Escuela N° 758 «Lucía Epullán»",
    ciudad: "Esquel",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "arte",
  },
  {
    id: "esc-767-esquel",
    numero: "767",
    nombre: "Secundaria Esquel",
    nombreCompleto: "Escuela N° 767",
    ciudad: "Esquel",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "secundaria",
  },
  {
    id: "esc-740-aldeaescolar",
    numero: "740",
    nombre: "Agrotécnica EMETA",
    nombreCompleto: "Escuela Agrotécnica N° 740",
    ciudad: "Trevelin (Aldea Escolar)",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "agrotecnica",
  },
  {
    id: "esc-779-corcovado",
    numero: "779",
    nombre: "Secundaria Corcovado",
    nombreCompleto: "Escuela N° 779",
    ciudad: "Corcovado",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "secundaria",
  },
  {
    id: "esc-782-tecka",
    numero: "782",
    nombre: "Secundaria Tecka",
    nombreCompleto: "Escuela N° 782",
    ciudad: "Tecka",
    regionId: "region-3",
    regionNombre: "Región III · Cordillera Central",
    tipo: "secundaria",
  },

  // ─── REGIÓN IV: Valle Inferior del Río Chubut (VIRCh) ───────────────────────
  {
    id: "esc-712-trelew",
    numero: "712",
    nombre: "Manuel Mustapich",
    nombreCompleto: "Escuela N° 712 «Manuel Mustapich»",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-714-trelew",
    numero: "714",
    nombre: "Julio Cortázar",
    nombreCompleto: "Escuela N° 714 «Julio Cortázar»",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-720-trelew",
    numero: "720",
    nombre: "Secundaria Trelew",
    nombreCompleto: "Escuela N° 720",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-724-trelew",
    numero: "724",
    nombre: "Secundaria Trelew",
    nombreCompleto: "Escuela N° 724",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-730-trelew",
    numero: "730",
    nombre: "Secundaria Trelew",
    nombreCompleto: "Escuela N° 730",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-744-trelew",
    numero: "744",
    nombre: "Secundaria Trelew",
    nombreCompleto: "Escuela N° 744",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-747-trelew",
    numero: "747",
    nombre: "Colegio Nacional de Trelew",
    nombreCompleto: "Escuela N° 747 «Colegio Nacional»",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-748-trelew",
    numero: "748",
    nombre: "Fray Luis Beltrán (Industrial)",
    nombreCompleto: "Escuela Técnica N° 748 «Fray Luis Beltrán»",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "tecnica",
  },
  {
    id: "esc-751-trelew",
    numero: "751",
    nombre: "Secundaria Trelew",
    nombreCompleto: "Escuela N° 751",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-759-trelew",
    numero: "759",
    nombre: "Escuela de Bellas Artes",
    nombreCompleto: "Escuela N° 759 «Florencio Molina Campos»",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "arte",
  },
  {
    id: "esc-762-trelew",
    numero: "762",
    nombre: "Secundaria Trelew",
    nombreCompleto: "Escuela N° 762",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-763-trelew",
    numero: "763",
    nombre: "Secundaria Trelew",
    nombreCompleto: "Escuela N° 763",
    ciudad: "Trelew",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-702-rawson",
    numero: "702",
    nombre: "Politécnica de Rawson",
    nombreCompleto: "Escuela Politécnica N° 702",
    ciudad: "Rawson",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "tecnica",
  },
  {
    id: "esc-752-rawson",
    numero: "752",
    nombre: "Secundaria Rawson",
    nombreCompleto: "Escuela N° 752",
    ciudad: "Rawson",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-776-playaunion",
    numero: "776",
    nombre: "Emmanuel Pueblas Pires",
    nombreCompleto: "Escuela N° 776 «Emmanuel Pueblas Pires»",
    ciudad: "Playa Unión (Rawson)",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-707-gaiman",
    numero: "707",
    nombre: "Secundaria Gaiman",
    nombreCompleto: "Escuela N° 707",
    ciudad: "Gaiman",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-733-gaiman",
    numero: "733",
    nombre: "Benito Owen (Agrotécnica)",
    nombreCompleto: "Escuela Agrotécnica N° 733 «Benito Owen»",
    ciudad: "Gaiman (Bryn Gwyn)",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "agrotecnica",
  },
  {
    id: "esc-781-dolavon",
    numero: "781",
    nombre: "Secundaria Dolavon",
    nombreCompleto: "Escuela N° 781",
    ciudad: "Dolavon",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },
  {
    id: "esc-7728-28dejulio",
    numero: "7728",
    nombre: "Secundaria 28 de Julio",
    nombreCompleto: "Escuela N° 7728",
    ciudad: "28 de Julio",
    regionId: "region-4",
    regionNombre: "Región IV · VIRCh",
    tipo: "secundaria",
  },

  // ─── REGIÓN V: Meseta Central ────────────────────────────────────────────────
  {
    id: "esc-719-gobernadocosta",
    numero: "719",
    nombre: "Secundaria Gobernador Costa",
    nombreCompleto: "Escuela N° 719",
    ciudad: "Gobernador Costa",
    regionId: "region-5",
    regionNombre: "Región V · Meseta Central",
    tipo: "secundaria",
  },
  {
    id: "esc-709-sanmartin",
    numero: "709",
    nombre: "Secundaria José de San Martín",
    nombreCompleto: "Escuela N° 709",
    ciudad: "José de San Martín",
    regionId: "region-5",
    regionNombre: "Región V · Meseta Central",
    tipo: "secundaria",
  },
  {
    id: "esc-777-pasodeindios",
    numero: "777",
    nombre: "Secundaria Paso de Indios",
    nombreCompleto: "Escuela N° 777",
    ciudad: "Paso de Indios",
    regionId: "region-5",
    regionNombre: "Región V · Meseta Central",
    tipo: "secundaria",
  },
  {
    id: "esc-7705-lasplumas",
    numero: "7705",
    nombre: "Secundaria Las Plumas",
    nombreCompleto: "Escuela N° 7705",
    ciudad: "Las Plumas",
    regionId: "region-5",
    regionNombre: "Región V · Meseta Central",
    tipo: "secundaria",
  },
  {
    id: "esc-7703-gangan",
    numero: "7703",
    nombre: "Secundaria Gan Gan",
    nombreCompleto: "Escuela N° 7703",
    ciudad: "Gan Gan",
    regionId: "region-5",
    regionNombre: "Región V · Meseta Central",
    tipo: "secundaria",
  },
  {
    id: "esc-7711-gastre",
    numero: "7711",
    nombre: "Secundaria Gastre",
    nombreCompleto: "Escuela N° 7711",
    ciudad: "Gastre",
    regionId: "region-5",
    regionNombre: "Región V · Meseta Central",
    tipo: "secundaria",
  },
  {
    id: "esc-7731-telsen",
    numero: "7731",
    nombre: "Secundaria Telsen",
    nombreCompleto: "Escuela N° 7731",
    ciudad: "Telsen",
    regionId: "region-5",
    regionNombre: "Región V · Meseta Central",
    tipo: "secundaria",
  },
  {
    id: "esc-7712-losaltares",
    numero: "7712",
    nombre: "Secundaria Los Altares",
    nombreCompleto: "Escuela N° 7712",
    ciudad: "Los Altares",
    regionId: "region-5",
    regionNombre: "Región V · Meseta Central",
    tipo: "secundaria",
  },

  // ─── REGIÓN VI: Golfo San Jorge y Cuenca Sur ────────────────────────────────
  {
    id: "esc-704-comodoro",
    numero: "704",
    nombre: "Biología Marina",
    nombreCompleto: "Escuela N° 704 «Biología Marina»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "tecnica",
  },
  {
    id: "esc-707-comodoro",
    numero: "707",
    nombre: "Ciudad de Yapeyú",
    nombreCompleto: "Escuela N° 707 «Ciudad de Yapeyú»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-711-comodoro",
    numero: "711",
    nombre: "Federico Brandsen",
    nombreCompleto: "Escuela N° 711 «Federico Brandsen»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-718-radatilly",
    numero: "718",
    nombre: "Libertad",
    nombreCompleto: "Escuela N° 718 «Libertad»",
    ciudad: "Rada Tilly",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-722-comodoro",
    numero: "722",
    nombre: "Secundaria Próspero Palazzo",
    nombreCompleto: "Escuela N° 722",
    ciudad: "Comodoro Rivadavia (Palazzo)",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-723-comodoro",
    numero: "723",
    nombre: "Secundaria Comodoro Rivadavia",
    nombreCompleto: "Escuela N° 723",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-725-sarmiento",
    numero: "725",
    nombre: "Agrotécnica Sarmiento",
    nombreCompleto: "Escuela Agrotécnica N° 725",
    ciudad: "Sarmiento",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "agrotecnica",
  },
  {
    id: "esc-731-comodoro",
    numero: "731",
    nombre: "Gran Malvina",
    nombreCompleto: "Escuela N° 731 «Gran Malvina»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-732-comodoro",
    numero: "732",
    nombre: "Secundaria Comodoro Rivadavia",
    nombreCompleto: "Escuela N° 732",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-737-comodoro",
    numero: "737",
    nombre: "Soldado Mario Almonacid",
    nombreCompleto: "Escuela N° 737 «Soldado Mario Almonacid»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-738-comodoro",
    numero: "738",
    nombre: "Dr. Pastor Schneider",
    nombreCompleto: "Escuela N° 738 «Dr. Pastor Schneider»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-742-comodoro",
    numero: "742",
    nombre: "Secundaria Comodoro Rivadavia",
    nombreCompleto: "Escuela N° 742",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-743-comodoro",
    numero: "743",
    nombre: "Secundaria Comodoro Rivadavia",
    nombreCompleto: "Escuela N° 743",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-746-comodoro",
    numero: "746",
    nombre: "Escuela de Arte",
    nombreCompleto: "Escuela N° 746 «Escuela de Arte»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "arte",
  },
  {
    id: "esc-749-comodoro",
    numero: "749",
    nombre: "Colegio Industrial (EMETA)",
    nombreCompleto: "Escuela Técnica N° 749 «Colegio Industrial»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "tecnica",
  },
  {
    id: "esc-757-comodoro",
    numero: "757",
    nombre: "Hipólito Yrigoyen",
    nombreCompleto: "Escuela N° 757 «Hipólito Yrigoyen»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-760-comodoro",
    numero: "760",
    nombre: "Guardacostas Río Iguazú",
    nombreCompleto: "Escuela Técnica N° 760 «Guardacostas Río Iguazú»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "tecnica",
  },
  {
    id: "esc-766-comodoro",
    numero: "766",
    nombre: "Perito Moreno",
    nombreCompleto: "Escuela N° 766 «Perito Moreno»",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-770-comodoro",
    numero: "770",
    nombre: "Secundaria Comodoro Rivadavia",
    nombreCompleto: "Escuela N° 770",
    ciudad: "Comodoro Rivadavia",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
  {
    id: "esc-716-riomayo",
    numero: "716",
    nombre: "Secundaria Río Mayo",
    nombreCompleto: "Escuela N° 716",
    ciudad: "Río Mayo",
    regionId: "region-6",
    regionNombre: "Región VI · Golfo San Jorge y Cuenca Sur",
    tipo: "secundaria",
  },
];

export const DEFAULT_SCHOOL_ID = "esc-713-esquel";
export const SCHOOL_STORAGE_KEY = "escuelainfo_selected_school_id";

/**
 * Obtiene una escuela por su identificador único.
 */
export const getSchoolById = (id?: string | null): ChubutSchool => {
  if (!id) {
    return CHUBUT_SCHOOLS.find((s) => s.id === DEFAULT_SCHOOL_ID) || CHUBUT_SCHOOLS[0];
  }
  const found = CHUBUT_SCHOOLS.find((s) => s.id === id);
  return found || CHUBUT_SCHOOLS.find((s) => s.id === DEFAULT_SCHOOL_ID) || CHUBUT_SCHOOLS[0];
};

/**
 * Agrupa las escuelas secundarias de Chubut por cada una de sus 6 regiones.
 */
export const getSchoolsGroupedByRegion = (): { region: ChubutRegion; schools: ChubutSchool[] }[] => {
  return CHUBUT_REGIONS.map((region) => ({
    region,
    schools: CHUBUT_SCHOOLS.filter((school) => school.regionId === region.id),
  }));
};

/**
 * Filtra las escuelas secundarias por texto de búsqueda (número, nombre, ciudad, tipo).
 */
export const searchChubutSchools = (query: string, regionIdFilter?: string): ChubutSchool[] => {
  const clean = (query || "").trim().toLowerCase();
  return CHUBUT_SCHOOLS.filter((school) => {
    if (regionIdFilter && regionIdFilter !== "todas" && school.regionId !== regionIdFilter) {
      return false;
    }
    if (!clean) return true;
    return (
      school.numero.includes(clean) ||
      school.nombre.toLowerCase().includes(clean) ||
      school.nombreCompleto.toLowerCase().includes(clean) ||
      school.ciudad.toLowerCase().includes(clean) ||
      school.regionNombre.toLowerCase().includes(clean)
    );
  });
};

/**
 * Obtiene la escuela seleccionada actualmente guardada en el dispositivo (cliente).
 */
export const getSavedSchoolId = (): string => {
  if (typeof window === "undefined") return DEFAULT_SCHOOL_ID;
  try {
    return localStorage.getItem(SCHOOL_STORAGE_KEY) || DEFAULT_SCHOOL_ID;
  } catch {
    return DEFAULT_SCHOOL_ID;
  }
};

/**
 * Guarda la escuela seleccionada en el dispositivo y notifica a las interfaces en vivo.
 */
export const setSavedSchoolId = (schoolId: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SCHOOL_STORAGE_KEY, schoolId);
    window.dispatchEvent(new CustomEvent("escuelainfo:school-changed", { detail: { schoolId } }));
  } catch {}
};
