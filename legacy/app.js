//                 DATOS                

const CURSOS = ['1°A','1°B','2°A','2°B','3°A','3°B','4°A','4°B','5°A','5°B','6°A','6°B'];

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const HORAS = ['07:30','08:20','09:10','10:00','10:50','11:40','12:30','13:20','14:10','15:00'];

//                 TRADUCCIONES                
const TEXTS = {
  es: {
    dashboard: 'Panel general', ausencias: 'Registro de ausencias', horarios: 'Horario semanal', profesores: 'Profesores', reportes: 'Reportes',
    mapa: 'Mapa interactivo', welcome: '¡Bienvenido de nuevo!', logout: 'Salir', search: 'Buscar...', new_aus: '+ Nueva ausencia',
    lang_name: 'ESP', lang_flag: '🇦🇷'
  },
  en: {
    dashboard: 'General Dashboard', ausencias: 'Absence Registry', horarios: 'Weekly Schedule', profesores: 'Teachers', reportes: 'Reports',
    mapa: 'Interactive Map', welcome: 'Welcome back!', logout: 'Logout', search: 'Search...', new_aus: '+ New Absence',
    lang_name: 'ENG', lang_flag: '🇺🇸'
  }
};
let currentLang = localStorage.getItem('lang') || 'es';
const T = (key) => TEXTS[currentLang][key] || key;

function toggleLang() {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  localStorage.setItem('lang', currentLang);
  location.reload();
}



const PROFESORES = [

  {id:1,nombre:'Ana García',materias:[{m:'Matemáticas',cursos:['3°A','3°B','4°A']},{m:'Álgebra',cursos:['5°A']}]},
  {id:2,nombre:'Carlos Pérez',materias:[{m:'Historia',cursos:['1°A','1°B','2°A']},{m:'Geografía',cursos:['2°B']}]},
  {id:3,nombre:'Lucía Martínez',materias:[{m:'Lengua',cursos:['3°A','4°B','5°A']},{m:'Literatura',cursos:['6°A']}]},
  {id:4,nombre:'Miguel Torres',materias:[{m:'Física',cursos:['4°A','4°B','5°B']},{m:'Química',cursos:['5°A','5°B']}]},
  {id:5,nombre:'Sofía Rodríguez',materias:[{m:'Inglés',cursos:['1°A','2°A','3°A','4°A']}]},
  {id:6,nombre:'Diego López',materias:[{m:'Ed. Física',cursos:['1°A','1°B','2°A','2°B']}]},
  {id:7,nombre:'Cristina Lauze',materias:[{m:'Inglés',cursos:['3°A']}]},
  {id:8,nombre:'Vivanco Analía',materias:[{m:'Matemática',cursos:['3°A']}]},
  {id:9,nombre:'Sosa Lara',materias:[{m:'Lengua y literatura',cursos:['3°A']}]},
];



let AUSENCIAS = [

  {id:1,profId:1,profNombre:'Ana García',tipo:'licencia-medica',inicio:'2025-04-07',fin:'2025-04-09',materias:['Matemáticas — 3°A','Matemáticas — 3°B'],motivo:'Cirugía programada. Con certificado médico.',cert:true,estado:'aprobada',fechaReg:'2025-04-06'},

  {id:2,profId:2,profNombre:'Carlos Pérez',tipo:'ausencia',inicio:'2025-04-08',fin:'2025-04-08',materias:['Historia — 1°A','Historia — 1°B'],motivo:'Problema personal imprevisto.',cert:false,estado:'pendiente',fechaReg:'2025-04-08'},

  {id:3,profId:4,profNombre:'Miguel Torres',tipo:'capacitacion',inicio:'2025-04-10',fin:'2025-04-10',materias:['Física — 4°A'],motivo:'Jornada de actualización docente organizada por el Ministerio.',cert:true,estado:'aprobada',fechaReg:'2025-04-05'},

  {id:4,profId:3,profNombre:'Lucía Martínez',tipo:'licencia-personal',inicio:'2025-04-14',fin:'2025-04-14',materias:['Lengua — 3°A','Literatura — 6°A'],motivo:'Trámite personal.',cert:false,estado:'pendiente',fechaReg:'2025-04-07'},

  {id:5,profId:5,profNombre:'Sofía Rodríguez',tipo:'ausencia',inicio:'2025-04-03',fin:'2025-04-03',materias:['Inglés — 2°A'],motivo:'Gripe.',cert:true,estado:'rechazada',fechaReg:'2025-04-03'},
  {id:6,profId:7,profNombre:'Cristina Lauze',tipo:'ausencia',inicio:'2026-04-01',fin:'2026-04-15',materias:['Inglés — 3°A'],motivo:'Licencia médica.',cert:true,estado:'aprobada',fechaReg:'2026-04-01'},
];



let currentRole = 'directivo';

let currentUser = 'Dir. Ramírez';

let nextId = 6;



//                 LOGIN                

function selectRole(role, el){

  currentRole = role;

  document.querySelectorAll('.role-btn').forEach(b=>b.classList.remove('active'));

  el.classList.add('active');

  const names = {directivo:'directivo@institutosm.edu.ar',preceptor:'preceptor@institutosm.edu.ar',profesor:'profe.garcia@institutosm.edu.ar',alumno:'alumno@institutosm.edu.ar'};

  document.getElementById('login-user').value = names[role];

  document.body.classList.add('login-focus');

}



function doLogin(){

  const names = {directivo:'Dir. Ramírez',preceptor:'Prec. Flores',profesor:'Prof. Ana García',alumno:'Alumno: Tomás Vega (3°A)'};

  currentUser = names[currentRole];

  document.getElementById('login-screen').style.display='none';

  document.getElementById('app').style.display='flex';

  document.body.classList.remove('login-focus');

  document.getElementById('topbar-user').textContent = currentUser;

  const b = document.getElementById('topbar-badge');

  const labels = {directivo:'Directivo',preceptor:'Preceptor',profesor:'Profesor',alumno:'Alumno'};

  const classes = {directivo:'badge-directivo',preceptor:'badge-preceptor',profesor:'badge-profesor',alumno:'badge-alumno'};

  b.textContent = labels[currentRole];

  b.className = 'role-badge '+classes[currentRole];

  buildNav();

  showPage('dashboard');

  showToast(`¡Bienvenido de nuevo, ${currentUser}!`, 'success');

}

//                 TOAST & EFFECTS                

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '✨'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Escuchar movimiento para los bordes brillantes
// Escuchar movimiento para los bordes brillantes y el fondo global
document.addEventListener('mousemove', (e) => {
  const x = e.clientX;
  const y = e.clientY;
  
  // Fondo global
  updateMousePosition(x, y);

  // Brillo en tarjetas
  const cards = document.querySelectorAll('.card, .stat-card');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const cx = x - rect.left;
    const cy = y - rect.top;
    card.style.setProperty('--m-x', `${cx}px`);
    card.style.setProperty('--m-y', `${cy}px`);
  });
});

function logout(){

  document.getElementById('login-screen').style.display='flex';

  document.getElementById('app').style.display='none';

}



//                 NAV                

function buildNav(){

  const sidebar = document.getElementById('sidebar');

  const navs = {

    directivo:[

      {id:'dashboard',icon:'📊',label:'Panel general'},

      {id:'ausencias',icon:'📋',label:'Todas las ausencias'},

      {id:'horarios',icon:'🗓️',label:T('horarios')},
      {id:'mapa',icon:'📍',label:T('mapa')},
      {section:T('reportes')||'Gestión'},
      {id:'profesores',icon:'👨‍🏫',label:T('profesores')},

      {id:'reportes',icon:'📈',label:'Reportes'},

    ],

    preceptor:[

      {id:'dashboard',icon:'📊',label:'Panel'},

      {id:'ausencias',icon:'📋',label:'Ausencias'},

      {id:'horarios',icon:'🗓️',label:'Horario semanal'},

      {id:'profesores',icon:'👨‍🏫',label:'Profesores'},

    ],

    profesor:[

      {id:'dashboard',icon:'📊',label:'Mi panel'},

      {id:'mis-ausencias',icon:'📋',label:'Mis ausencias'},

      {id:'mi-horario',icon:'🗓️',label:'Mi horario'},

    ],

    alumno:[

      {id:'vista-alumno',icon:'📍',label:'Ausencias hoy'},

      {id:'semana-alumno',icon:'🗓️',label:'Esta semana'},

    ],

  };

  const items = navs[currentRole];

  sidebar.innerHTML = items.map(i=>{

    if(i.section) return `<div class="nav-section">${i.section}</div>`;

    return `<div class="nav-item" id="nav-${i.id}" onclick="showPage('${i.id}')"><span class="nav-icon">${i.icon}</span>${i.label}</div>`;

  }).join('');

}




//                 COMPORTAMIENTO UI                
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  const topbar = document.querySelector('.topbar');
  if (currentScroll > 50) topbar.classList.add('floating');
  else topbar.classList.remove('floating');

  if (currentScroll > lastScroll && currentScroll > 200) topbar.classList.add('hidden');
  else topbar.classList.remove('hidden');
  lastScroll = currentScroll;
});

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('compact');
  }
}

// Búsqueda con Debounce
let searchTimeout;
function filterTableDebounced(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => filterTable(val), 250);
}

function showPage(id) {
  const area = document.getElementById('content-area');
  // Efecto Skeleton antes de renderizar
  area.innerHTML = `
    <div class="page active">
      <div class="skeleton" style="height:3rem; width:40%; margin-bottom:2rem"></div>
      <div class="skeleton" style="height:10rem; width:100%; margin-bottom:1rem"></div>
      <div class="skeleton" style="height:10rem; width:100%"></div>
    </div>`;
  
  setTimeout(() => {
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const nav = document.getElementById('nav-'+id);
    if(nav) nav.classList.add('active');

    const renders = {
      dashboard: renderDashboard,
      ausencias: renderAusencias,
      horarios: renderHorarios,
      profesores: renderProfesores,
      reportes: renderReportes,
      'mis-ausencias': renderMisAusencias,
      'mi-horario': renderMiHorario,
      'vista-alumno': renderVistaAlumno,
      'semana-alumno': renderSemanaAlumno,
      'mapa': renderMapa,
    };
    if(renders[id]) area.innerHTML = `<div class="page active" style="animation: fadeIn 0.4s ease">${renders[id]()}</div>`;
  }, 300);
}

function renderDashboard(){
  const hoy = new Date().toISOString().split('T')[0];
  const ausHoy = AUSENCIAS.filter(a=>a.inicio<=hoy&&a.fin>=hoy&&a.estado==='aprobada');
  const pendientes = AUSENCIAS.filter(a=>a.estado==='pendiente');
  const aprob = AUSENCIAS.filter(a=>a.estado==='aprobada');
  const conCert = AUSENCIAS.filter(a=>a.cert).length;

  if(currentRole==='profesor'){
    const mis = AUSENCIAS.filter(a=>a.profId===1);
    const misPend = mis.filter(a=>a.estado==='pendiente');
    return `
      <div class="page-title">Mi panel</div>
      <div class="page-sub">Prof. Ana García · Matemáticas, Álgebra</div>
      <div class="stats-row" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card"><div class="stat-num" style="color:var(--amarillo)">${misPend.length}</div><div class="stat-label">Ausencias pendientes</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--verde)">${mis.filter(a=>a.estado==='aprobada').length}</div><div class="stat-label">Aprobadas</div></div>
        <div class="stat-card" onclick="openModal('modal-logros')" style="cursor:pointer"><div class="stat-num" style="color:var(--violeta)">🏆</div><div class="stat-label">Mis Logros</div></div>
      </div>
      <div class="alert alert-info">ℹ️  Recordá adjuntar el certificado médico dentro de las 48hs de tu ausencia.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <div style="font-weight:600;font-size:0.95rem">Mis últimas ausencias</div>
        <button class="btn btn-primary" onclick="openModalAusencia()">+ Nueva ausencia</button>
      </div>
      ${renderTablaAusencias(mis.slice(-3),'profesor')}`;
  }

  return `
  <div class="page-title">Panel general</div>

  <div class="page-sub">Resumen del día — ${new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}</div>

  <div class="stats-row">

    <div class="stat-card"><div class="stat-num" style="color:var(--rojo)">${ausHoy.length}</div><div class="stat-label">Ausentes hoy</div><div class="stat-change stat-up">↑ vs ayer</div></div>

    <div class="stat-card"><div class="stat-num" style="color:var(--amarillo)">${pendientes.length}</div><div class="stat-label">Sin aprobar</div><div class="stat-change" style="color:var(--text2)">requieren revisión</div></div>

    <div class="stat-card"><div class="stat-num" style="color:var(--verde)">${aprob.length}</div><div class="stat-label">Aprobadas</div></div>

    <div class="stat-card"><div class="stat-num">${conCert}</div><div class="stat-label">Con certificado</div></div>

  </div>

  ${pendientes.length>0?`<div class="alert alert-warn">⚠️ Hay ${pendientes.length} ausencia${pendientes.length>1?'s':''} pendiente${pendientes.length>1?'s':''} de revisión.</div>`:''}

  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:1.5rem;margin-top:0.5rem">

    <div>

      <div class="card">

        <div class="card-header"><span class="card-title">Ausencias de hoy</span><span class="chip chip-rojo">${ausHoy.length} prof.</span></div>

        <div class="timeline">

          ${ausHoy.length===0?`<div style="padding:1.5rem;text-align:center;color:var(--text2);font-size:0.85rem">✅ Sin ausencias registradas para hoy</div>`:

          ausHoy.map(a=>`

          <div class="tl-item" onclick="openDetalle(${a.id})" style="cursor:pointer">

            <div class="tl-dot ${a.tipo==='licencia-medica'?'tl-dot-rojo':a.tipo==='capacitacion'?'tl-dot-verde':'tl-dot-amarillo'}">${a.tipo==='licencia-medica'?'🏥':a.tipo==='capacitacion'?'📚':'🚫'}</div>

            <div class="tl-body">

              <div class="tl-title">${a.profNombre} <span class="tl-badge">${chipEstado(a.estado)}</span></div>

              <div class="tl-meta">${a.materias.join(' · ')} &nbsp;·&nbsp; ${tipoLabel(a.tipo)}</div>

            </div>

          </div>`).join('')}

        </div>

      </div>

    </div>

    <div>

      <div class="card">

        <div class="card-header"><span class="card-title">Próximas ausencias</span></div>

        <div class="timeline">

          ${AUSENCIAS.filter(a=>a.inicio>new Date().toISOString().split('T')[0]).slice(0,4).map(a=>`

          <div class="tl-item" onclick="openDetalle(${a.id})" style="cursor:pointer">

            <div class="tl-dot tl-dot-amarillo">🗓️</div>

            <div class="tl-body">

              <div class="tl-title">${a.profNombre}</div>

              <div class="tl-meta">${formatFecha(a.inicio)}${a.fin!==a.inicio?' → '+formatFecha(a.fin):''}</div>

            </div>

          </div>`).join('')}

        </div>

      </div>

    </div>

  </div>`;

}



//                 AUSENCIAS                

function renderAusencias(){

  return `

  <div class="page-title">Registro de ausencias</div>

  <div class="page-sub">Historial completo de ausencias y licencias</div>

  <div class="card">

    <div class="card-header">

      <span class="card-title">Todas las ausencias</span>

      <div class="card-actions">

        <input class="search-input" placeholder="Buscar profesor..." oninput="filterTable(this.value)" id="search-aus">

        <select class="filter-select" onchange="filterEstado(this.value)">

          <option value="">Todos los estados</option>

          <option value="pendiente">Pendientes</option>

          <option value="aprobada">Aprobadas</option>

          <option value="rechazada">Rechazadas</option>

        </select>

        <select class="filter-select" onchange="filterTipo(this.value)">

          <option value="">Todos los tipos</option>

          <option value="ausencia">Ausencia</option>

          <option value="licencia-medica">Lic. médica</option>

          <option value="licencia-personal">Lic. personal</option>

          <option value="capacitacion">Capacitación</option>

        </select>

      </div>

    </div>

    ${renderTablaAusencias(AUSENCIAS,'admin')}

  </div>`;

}



function renderTablaAusencias(lista, modo){

  return `<div style="overflow-x:auto"><table id="tabla-ausencias">

    <thead><tr>

      <th>Profesor</th><th>Tipo</th><th>Período</th><th>Materias</th><th>Certificado</th><th>Estado</th><th>Acciones</th>

    </tr></thead>

    <tbody>

    ${lista.map(a=>`<tr data-nombre="${a.profNombre.toLowerCase()}" data-estado="${a.estado}" data-tipo="${a.tipo}">

      <td><strong>${a.profNombre}</strong></td>

      <td>${chipTipo(a.tipo)}</td>

      <td style="font-family:var(--mono);font-size:0.8rem;white-space:nowrap">${formatFecha(a.inicio)}${a.fin!==a.inicio?'<br>→ '+formatFecha(a.fin):''}</td>

      <td style="font-size:0.8rem;color:var(--text2);max-width:180px">${a.materias.join('<br>')}</td>

      <td style="text-align:center">${a.cert?'<span class="chip chip-verde">✓ Adj.</span>':'<span class="chip chip-gris">Sin cert.</span>'}</td>

      <td>${chipEstado(a.estado)}</td>

      <td>

        <div style="display:flex;gap:0.4rem">

          <button class="btn btn-outline btn-sm" onclick="openDetalle(${a.id})">Ver</button>

          ${(modo==='admin'||modo==='preceptor') && a.estado==='pendiente'?`

          <button class="btn btn-primary btn-sm" onclick="aprobar(${a.id})">✓</button>

          <button class="btn btn-danger btn-sm" onclick="rechazar(${a.id})">✕</button>`:''}

        </div>

      </td>

    </tr>`).join('')}

    </tbody>

  </table></div>`;

}



function filterTable(val){

  document.querySelectorAll('#tabla-ausencias tbody tr').forEach(r=>{

    r.style.display=r.dataset.nombre.includes(val.toLowerCase())?'':'none';

  });

}

function filterEstado(val){

  document.querySelectorAll('#tabla-ausencias tbody tr').forEach(r=>{

    r.style.display=(!val||r.dataset.estado===val)?'':'none';

  });

}

function filterTipo(val){

  document.querySelectorAll('#tabla-ausencias tbody tr').forEach(r=>{

    r.style.display=(!val||r.dataset.tipo===val)?'':'none';

  });

}



function aprobar(id){

  const a = AUSENCIAS.find(x=>x.id===id);

  if(a){
    a.estado='aprobada';
    showToast(`Ausencia de ${a.profNombre} aprobada`, 'success');
    showPage(currentRole==='profesor'?'mis-ausencias':'ausencias');
  }
}

function rechazar(id){

  const a = AUSENCIAS.find(x=>x.id===id);

  if(a){
    a.estado='rechazada';
    showToast(`Ausencia de ${a.profNombre} rechazada`, 'info');
    showPage(currentRole==='profesor'?'mis-ausencias':'ausencias');
  }
}



//                 HORARIO                

const HORARIO_DATA = {

  'Ana García':[[null,'Matemáticas 3°A','Matemáticas 3°B',null,null,null],[null,null,'Álgebra 5°A','Matemáticas 4°A',null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null]],

  'Carlos Pérez':[[null,null,null,'Historia 1°A',null,null],[null,null,null,null,'Historia 1°B',null],[null,null,'Historia 2°A',null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null]],

};



function renderHorarios(){

  const hoy = new Date().toISOString().split('T')[0];

  const ausHoy = AUSENCIAS.filter(a=>a.inicio<=hoy&&a.fin>=hoy&&a.estado==='aprobada');

  const ausNames = ausHoy.flatMap(a=>a.profNombre);



  return `

  <div class="page-title">Horario semanal</div>

  <div class="page-sub">Vista general de clases con ausencias marcadas</div>

  <div style="display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap">

    <select class="filter-select" style="font-size:0.85rem;padding:0.5rem 0.8rem">

      <option>Semana actual</option><option>Próxima semana</option>

    </select>

    <select class="filter-select" id="sel-curso" onchange="renderHorarioCurso(this.value)" style="font-size:0.85rem;padding:0.5rem 0.8rem">

      <option value="">— Filtrar por curso —</option>

      ${CURSOS.map(c=>`<option value="${c}">${c}</option>`).join('')}

    </select>

  </div>

  ${ausHoy.length>0?`<div class="alert alert-danger">🚫 Hoy están ausentes: ${ausHoy.map(a=>a.profNombre).join(', ')}</div>`:''}

  <div id="horario-container">

  <div class="card" style="overflow-x:auto">

    <div class="horario-grid" style="min-width:600px">

      <div class="dia-header">Hora</div>

      ${DIAS.map(d=>`<div class="dia-header">${d}</div>`).join('')}

      ${HORAS.map((h,hi)=>`

        <div class="hora-cell">${h}</div>

        ${[0,1,2,3,4,5].map(di=>{

          const clase = getClaseEnHoraDia(hi,di);

          if(!clase) return `<div class="libre-cell">—</div>`;

          const ausente = ausNames.some(n=>clase.includes(n.split(' ')[1]));

          return `<div class="clase-cell ${ausente?'clase-ausente':''}" onclick="openDetalleCelda('${clase}','${h}','${DIAS[di]}',${ausente})">

            <div class="clase-nombre">${clase.split(' — ')[0]}</div>

            <div class="clase-curso">${clase.split(' — ')[1]||''}</div>

            ${ausente?'<div style="font-size:0.65rem;color:var(--rojo);margin-top:2px">⚠️ Ausente</div>':''}

          </div>`;

        }).join('')}

      `).join('')}

    </div>

  </div>

  </div>`;

}



function getClaseEnHoraDia(hora, dia){

  const clases = [

    [null,'Matemáticas — 3°A','Historia — 1°A',null,'Inglés — 2°A',null],

    [null,'Física — 4°A','Matemáticas — 3°B','Historia — 1°B','Ed. Física — 1°A',null],

    ['Lengua — 3°A','Álgebra — 5°A','Matemáticas — 4°A','Historia — 2°A','Inglés — 3°A',null],

    [null,'Física — 4°B',null,null,'Ed. Física — 2°A',null],

    [null,'Química — 5°A',null,'Geografía — 2°B',null,null],

    [null,null,'Literatura — 6°A',null,'Inglés — 4°A',null],

    ['Lengua — 4°B',null,null,'Historia — 2°B',null,null],

    [null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],

  ];

  return clases[hora]?clases[hora][dia]:null;

}



function openDetalleCelda(clase,hora,dia,ausente){

  if(!ausente) return;

  const area = document.getElementById('detalle-content');

  area.innerHTML=`

    <div class="alert alert-danger">⚠️ Esta clase no tendrá docente</div>

    <table style="width:100%;font-size:0.9rem"><tbody>

      <tr><td style="color:var(--text2);padding:0.4rem 0">Clase</td><td><strong>${clase}</strong></td></tr>

      <tr><td style="color:var(--text2);padding:0.4rem 0">Horario</td><td>${hora} — ${dia}</td></tr>

      <tr><td style="color:var(--text2);padding:0.4rem 0">Estado</td><td><span class="chip chip-rojo">Sin docente</span></td></tr>

    </tbody></table>`;

  document.getElementById('detalle-actions').innerHTML=`<button class="btn btn-outline" onclick="closeModal('modal-detalle')">Cerrar</button>`;

  document.getElementById('modal-detalle').classList.add('open');

}



//                 PROFESORES                

function renderProfesores(){

  return `

  <div class="page-title">Profesores</div>

  <div class="page-sub">Plantel docente y estado de asistencia</div>

  <div class="card">

    <div class="card-header"><span class="card-title">Plantel docente</span><input class="search-input" placeholder="Buscar..."></div>

    <table><thead><tr><th>Nombre</th><th>Materias</th><th>Cursos</th><th>Ausencias año</th><th>Con certificado</th><th>Estado hoy</th></tr></thead>

    <tbody>

    ${PROFESORES.map(p=>{

      const hoy = new Date().toISOString().split('T')[0];

      const misAus = AUSENCIAS.filter(a=>a.profId===p.id);

      const ausenteHoy = AUSENCIAS.find(a=>a.profId===p.id&&a.inicio<=hoy&&a.fin>=hoy);

      const conCert = misAus.filter(a=>a.cert).length;

      const materias = p.materias.map(m=>m.m).join(', ');

      const cursos = [...new Set(p.materias.flatMap(m=>m.cursos))].join(', ');

      return `<tr>

        <td><strong>${p.nombre}</strong></td>

        <td style="font-size:0.82rem;color:var(--text2)">${materias}</td>

        <td style="font-size:0.8rem">${cursos}</td>

        <td style="text-align:center"><span class="chip ${misAus.length>3?'chip-rojo':'chip-gris'}">${misAus.length}</span></td>

        <td style="text-align:center">${conCert}/${misAus.length}</td>

        <td>${ausenteHoy?`<span class="chip chip-rojo">🚫 Ausente</span>`:'<span class="chip chip-verde">✓ Presente</span>'}</td>

      </tr>`;

    }).join('')}

    </tbody></table>

  </div>`;

}



//                 REPORTES                

function renderReportes(){

  const total = AUSENCIAS.length;

  const porTipo = {};

  AUSENCIAS.forEach(a=>{porTipo[a.tipo]=(porTipo[a.tipo]||0)+1;});

  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
    <div><div class="page-title">Reportes</div><div class="page-sub">Estadísticas del ciclo lectivo 2025</div></div>
    <button class="btn btn-outline" onclick="window.print()"><span style="margin-right:8px">📄</span> Exportar a PDF</button>
  </div>

  <div class="stats-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:2rem">
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total ausencias</div></div>
    <div class="stat-card"><div class="stat-num">${AUSENCIAS.filter(a=>a.cert).length}</div><div class="stat-label">Con certificado</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--amarillo)">${AUSENCIAS.filter(a=>a.estado==='pendiente').length}</div><div class="stat-label">Pendientes</div></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem">
    <div class="card">
      <div class="card-header"><span class="card-title">Distribución por Tipo</span></div>
      <div style="padding:1.5rem">
        ${Object.entries(porTipo).map(([t,n])=>{
          const perc = Math.round(n/total*100);
          return `
          <div style="margin-bottom:1.2rem">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.5rem">
              <span>${tipoLabel(t)}</span>
              <span style="font-weight:700">${n} (${perc}%)</span>
            </div>
            <div style="background:var(--bg3);border-radius:100px;height:12px;overflow:hidden">
              <div style="width:0;height:100%;background:linear-gradient(90deg, var(--verde), var(--cyan));border-radius:100px;transition:width 1s ease-out" id="bar-tipo-${t}"></div>
            </div>
          </div>
          <script>setTimeout(()=>document.getElementById('bar-tipo-${t}').style.width='${perc}%',100)</script>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Ranking Docentes</span></div>
      <div style="padding:1.5rem">
        ${PROFESORES.map(p=>{
          const n=AUSENCIAS.filter(a=>a.profId===p.id).length;
          const perc = Math.round(n/total*100)*2;
          return `
          <div style="margin-bottom:1rem">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.4rem">
              <span>${p.nombre}</span>
              <span style="font-weight:600">${n}</span>
            </div>
            <div style="background:var(--bg3);border-radius:100px;height:8px;overflow:hidden">
              <div style="width:0;height:100%;background:linear-gradient(90deg, var(--azul), var(--violeta));border-radius:100px;transition:width 1.2s ease-out" id="bar-prof-${p.id}"></div>
            </div>
          </div>
          <script>setTimeout(()=>document.getElementById('bar-prof-${p.id}').style.width='${perc}%',150)</script>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}



//                 PROFESOR                

function renderMisAusencias(){

  const mis = AUSENCIAS.filter(a=>a.profId===1);

  return `

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">

    <div><div class="page-title">Mis ausencias</div><div class="page-sub">Historial personal de ausencias y licencias</div></div>

    <button class="btn btn-primary" onclick="openModalAusencia()">+ Registrar ausencia</button>

  </div>

  <div class="alert alert-info">ℹ️ Las ausencias sin certificado deben ser justificadas dentro de los 2 días hábiles.</div>

  <div class="card">${renderTablaAusencias(mis,'profesor')}</div>`;

}



function renderMiHorario(){

  return `

  <div class="page-title">Mi horario</div>

  <div class="page-sub">Ana García · Matemáticas y Álgebra</div>

  <div class="card" style="overflow-x:auto;margin-bottom:1.5rem">

    <div class="horario-grid" style="min-width:500px">

      <div class="dia-header">Hora</div>

      ${DIAS.slice(0,5).map(d=>`<div class="dia-header">${d}</div>`).join('')}

      ${HORAS.map((h,hi)=>`

        <div class="hora-cell">${h}</div>

        ${[null,'Matemáticas<br><span style="font-size:0.65rem;color:var(--text2)">3°A</span>',null,null,null].map((c,di)=>{

          const clases_p = [[null,'Mat 3°A',null,'Mat 4°A',null],[null,null,'Álg 5°A',null,null],[null,'Mat 3°B',null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]];

          const cl = clases_p[hi]?clases_p[hi][di]:null;

          if(!cl) return `<div class="libre-cell">—</div>`;

          return `<div class="clase-cell"><div class="clase-nombre">${cl.split(' ')[0]}</div><div class="clase-curso">${cl.split(' ')[1]||''}</div></div>`;

        }).join('')}

      `).join('')}

    </div>

  </div>

  <button class="btn btn-primary" onclick="openModalAusencia()">+ Reportar ausencia en este horario</button>`;

}



//                 ALUMNO                

function renderVistaAlumno(){

  const hoy = new Date().toISOString().split('T')[0];

  const ausHoy = AUSENCIAS.filter(a=>a.inicio<=hoy&&a.fin>=hoy&&a.estado==='aprobada');

  const curso = '3°A';

  const ausEnCurso = ausHoy.filter(a=>a.materias.some(m=>m.includes(curso)));



  return `

  <div class="page-title">Ausencias de hoy</div>

  <div class="page-sub">${new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})} · Curso ${curso}</div>

  <div class="curso-select-row">

    <select class="filter-select" style="font-size:0.85rem;padding:0.5rem 0.8rem">

      ${CURSOS.map(c=>`<option ${c===curso?'selected':''}>${c}</option>`).join('')}

    </select>

  </div>

  ${ausEnCurso.length===0?

    `<div class="alert alert-info" style="font-size:1rem">✅ No hay ausencias registradas para tu curso hoy. ¡Todas las clases tienen docente!</div>`

    :`<div class="alert alert-warn">⚠️ Hay ${ausEnCurso.length} clase${ausEnCurso.length>1?'s':''} sin docente hoy.</div>`

  }

  <div class="day-card">

    <div class="day-header"><div class="day-name">${new Date().toLocaleDateString('es-AR',{weekday:'long'}).charAt(0).toUpperCase()+new Date().toLocaleDateString('es-AR',{weekday:'long'}).slice(1)}</div><span class="chip chip-rojo">${ausEnCurso.length} sin docente</span></div>

    <div class="day-items">

      ${getClasesHoy(curso,ausHoy)}

    </div>

  </div>

  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.2rem;margin-top:1rem">

    <div style="font-size:0.8rem;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:0.8rem">Próximas ausencias que te afectan</div>

    ${AUSENCIAS.filter(a=>a.inicio>hoy&&a.materias.some(m=>m.includes(curso))).map(a=>`

    <div style="display:flex;align-items:center;gap:1rem;padding:0.6rem 0;border-bottom:1px solid var(--border);font-size:0.88rem">

      <div style="font-family:var(--mono);font-size:0.75rem;color:var(--text2);width:90px">${formatFecha(a.inicio)}</div>

      <div style="flex:1"><strong>${a.profNombre}</strong> · ${a.materias.filter(m=>m.includes(curso)).join(', ')}</div>

      ${chipEstado(a.estado)}

    </div>`).join('')||`<div style="color:var(--text2);font-size:0.85rem">Sin ausencias próximas para tu curso.</div>`}

  </div>`;

}



function getClasesHoy(curso, ausHoy){

  const clases3A = [

    {hora:'07:30',materia:'Matemáticas',prof:'Ana García'},

    {hora:'08:20',materia:'Historia',prof:'Carlos Pérez'},

    {hora:'09:10',materia:'Inglés',prof:'Sofía Rodríguez'},

    {hora:'10:00',materia:'Recreo',prof:null},

    {hora:'10:50',materia:'Lengua',prof:'Lucía Martínez'},

    {hora:'11:40',materia:'Ed. Física',prof:'Diego López'},

    {hora:'12:30',materia:'Física',prof:'Miguel Torres'},

  ];

  return clases3A.map(c=>{

    if(!c.prof) return `<div class="day-item"><div class="hora-tag">${c.hora}</div><div class="materia-tag" style="color:var(--text3)">— Recreo —</div></div>`;

    const aus = ausHoy.find(a=>a.profNombre===c.prof&&a.materias.some(m=>m.includes(curso)));

    return `<div class="day-item ${aus?'ausente':''}">

      <div class="hora-tag">${c.hora}</div>

      <div class="materia-tag">${c.materia}</div>

      <div class="profe-tag">${c.prof}</div>

      ${aus?'<span class="chip chip-rojo">Sin docente</span>':'<span class="chip chip-verde">Confirmado</span>'}

    </div>`;

  }).join('');

}



function renderSemanaAlumno(){

  const curso = "3°A";

  const ausEseCurso = AUSENCIAS.filter(a=>a.estado==="aprobada");

  const ausNames = ausEseCurso.map(a=>a.profNombre);



  const renderClase = (mat, prof) => {
    if(!mat && !prof) return "<td></td>";
    const isAusente = prof ? isProfesorAusente(prof) : false;
    return `<td class="${isAusente?"ausente":""}"><div class="clase-cell ${isAusente?"ausente":""}">
      <span class="materia">${mat}</span>
      <span class="profe">${prof}</span>
      ${isAusente?`<div style="font-size:0.65rem;color:var(--rojo);margin-top:4px;font-weight:700">⚠️ SIN DOCENTE</div>`:""}
    </div></td>`;
  };



  return `<div class="page-title">Horario de clase</div>

  <div class="page-sub">Semana actual · Turno Mañana</div>

  

  <div class="card" style="overflow-x:auto;margin-bottom:1.5rem">

    <table class="horario-table">

      <thead>

        <tr>

          <th colspan="6" style="font-size:1.1rem; letter-spacing:3px">MAÑANA</th>

        </tr>

        <tr>

          <th class="hs-col" style="width:70px">Hs.</th>

          <th>Lunes</th>

          <th>Martes</th>

          <th>Miércoles</th>

          <th>Jueves</th>

          <th>Viernes</th>

        </tr>

      </thead>

      <tbody>

        <tr>

          <td class="hs-col">07:40<br>a<br>08:20</td>

          ${renderClase("Inglés","Cristina Lauze")}

          ${renderClase("Política, Ciudadanía y participación","Collaceli")}

          ${renderClase("Asistencia al Usuario","Jara")}

          ${renderClase("Asist. s/aplicaciones esp.","")}

          <td></td>

        </tr>

        <tr>

          <td class="hs-col">08:20<br>a<br>09:00</td>

          ${renderClase("Inglés","Cristina Lauze")}

          ${renderClase("Política, Ciudadanía y participación","Collaceli")}

          ${renderClase("Asistencia al Usuario","")}

          ${renderClase("Asist. s/aplicaciones esp.","")}

          ${renderClase("Ed. Física<br>8:00 a 10:00","Almuna")}

        </tr>

        <tr class="recreo-row">

          <td class="hs-col">09:00</td>

          <td colspan="5">RECREO</td>

        </tr>

        <tr>

          <td class="hs-col">09:10<br>a<br>09:50</td>

          ${renderClase("Inglés","Cristina Lauze")}

          ${renderClase("Desarrollo III","Rojas Córsico Ivana")}

          ${renderClase("Asistencia al Usuario","")}

          ${renderClase("Matemática","Vivanco Analía")}

          ${renderClase("Asist. s/aplicaciones esp.","")}

        </tr>

        <tr>

          <td class="hs-col">09:50<br>a<br>10:30</td>

          ${renderClase("Lengua y literatura","Sosa Lara")}

          ${renderClase("Desarrollo III","Rojas Córsico Ivana")}

          ${renderClase("Asistencia al Usuario","")}

          ${renderClase("Matemática","Vivanco Analía")}

          ${renderClase("Asist. s/aplicaciones esp.","")}

        </tr>

        <tr class="recreo-row">

          <td class="hs-col">10:30</td>

          <td colspan="5">RECREO</td>

        </tr>

        <tr>

          <td class="hs-col">10:40<br>a<br>11:20</td>

          ${renderClase("Lengua y literatura","Sosa Lara")}

          ${renderClase("Matemática","Aleuy, L.")}

          ${renderClase("Asist. s/aplicaciones esp.","")}

          ${renderClase("Desarrollo III","Rojas Córsico Ivana")}

          ${renderClase("Filosofía","De Gregorio Javier")}

        </tr>

        <tr>

          <td class="hs-col">11:20<br>a<br>12:00</td>

          ${renderClase("Lengua y literatura","Sosa Lara")}

          ${renderClase("Matemática","Aleuy, L.")}

          ${renderClase("Asist. s/aplicaciones esp.","")}

          ${renderClase("Desarrollo III","Rojas Córsico Ivana")}

          ${renderClase("Filosofía","De Gregorio Javier")}

        </tr>

        <tr>

          <td class="hs-col">a<br>12:40</td>

          <td></td><td></td><td></td><td></td><td></td>

        </tr>

      </tbody>

    </table>

  </div>

  

  <div class="alert alert-info" style="font-size:0.85rem">

    ℹ️ Las clases con recuadro <strong style="color:var(--rojo)">rojo</strong> indican que el docente tiene inasistencia o licencia aprobada y no habrá dictado presencial.

  </div>`;

}



//                 MODAL AUSENCIA                

function openModalAusencia(){

  const hoy = new Date().toISOString().split('T')[0];

  document.getElementById('fecha-inicio').value = hoy;

  document.getElementById('fecha-fin').value = hoy;

  const mc = document.getElementById('materias-check');

  const prof = PROFESORES.find(p=>p.id===1);

  mc.innerHTML = prof.materias.flatMap(m=>m.cursos.map(c=>`

    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;cursor:pointer;padding:0.3rem;border-radius:6px;transition:background 0.1s" onmouseover="this.style.background='var(--bg4)'" onmouseout="this.style.background=''">

      <input type="checkbox" style="accent-color:var(--verde)"> ${m.m} — ${c}

    </label>`)).join('');

  document.getElementById('modal-ausencia').classList.add('open');

}



function submitAusencia(){
  const tipo = document.getElementById('tipo-ausencia').value;
  const inicio = document.getElementById('fecha-inicio').value;
  const fin = document.getElementById('fecha-fin').value;
  const motivo = document.getElementById('motivo-texto').value;
  const checks = document.querySelectorAll('#materias-check input:checked');
  const materias = [...checks].map(c=>c.parentElement.textContent.trim());
  const cert = document.getElementById('file-cert').files.length>0;

  if (!inicio || !fin) {
    showToast('Por favor, completa las fechas', 'error');
    return;
  }

  const nueva = {
    id:nextId++,
    profId:1,
    profNombre:'Ana García',
    tipo:tipo,
    inicio:inicio,
    fin:fin,
    materias:materias.length>0?materias:['Sin especificar'],
    motivo:motivo||'Sin motivo especificado.',
    cert:cert,
    estado:'pendiente',
    fechaReg:new Date().toISOString().split('T')[0],
  };

  AUSENCIAS.unshift(nueva);
  showToast('¡Ausencia registrada correctamente!', 'success');
  checkAchievements();
  closeModal('modal-ausencia');
  showPage('mis-ausencias');
}



function showFileName(input){

  const div = document.getElementById('file-name');

  if(input.files.length>0){div.style.display='block';div.textContent='📎 '+input.files[0].name;}

  else{div.style.display='none';}

}



//                 DETALLE                

function openDetalle(id){

  const a = AUSENCIAS.find(x=>x.id===id);

  if(!a) return;

  document.getElementById('detalle-content').innerHTML=`

    <table style="width:100%;font-size:0.9rem"><tbody>

      <tr><td style="color:var(--text2);padding:0.5rem 0;width:130px">Profesor</td><td><strong>${a.profNombre}</strong></td></tr>

      <tr><td style="color:var(--text2);padding:0.5rem 0">Tipo</td><td>${chipTipo(a.tipo)}</td></tr>

      <tr><td style="color:var(--text2);padding:0.5rem 0">Período</td><td style="font-family:var(--mono)">${formatFecha(a.inicio)}${a.fin!==a.inicio?' → '+formatFecha(a.fin):''}</td></tr>

      <tr><td style="color:var(--text2);padding:0.5rem 0">Materias</td><td>${a.materias.join('<br>')}</td></tr>

      <tr><td style="color:var(--text2);padding:0.5rem 0">Motivo</td><td>${a.motivo}</td></tr>

      <tr><td style="color:var(--text2);padding:0.5rem 0">Certificado</td><td>${a.cert?'<span class="chip chip-verde">✓ Adjunto</span>':'<span class="chip chip-gris">No adjuntó</span>'}</td></tr>

      <tr><td style="color:var(--text2);padding:0.5rem 0">Estado</td><td>${chipEstado(a.estado)}</td></tr>

      <tr><td style="color:var(--text2);padding:0.5rem 0">Registrada</td><td>${formatFecha(a.fechaReg)}</td></tr>

    </tbody></table>`;

  const acts = document.getElementById('detalle-actions');

  acts.innerHTML=`<button class="btn btn-outline" onclick="closeModal('modal-detalle')">Cerrar</button>

    ${(currentRole==='directivo'||currentRole==='preceptor')&&a.estado==='pendiente'?`

    <button class="btn btn-danger" onclick="rechazar(${a.id});closeModal('modal-detalle');showPage('ausencias')">Rechazar</button>

    <button class="btn btn-primary" onclick="aprobar(${a.id});closeModal('modal-detalle');showPage('ausencias')">Aprobar</button>`:''}`;

  document.getElementById('modal-detalle').classList.add('open');

}



function closeModal(id){document.getElementById(id).classList.remove('open')}



//                 HELPERS                

function formatFecha(f){

  if(!f) return '';

  const [y,m,d]=f.split('-');

  const meses=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

  return `${parseInt(d)} ${meses[parseInt(m)-1]} ${y}`;

}

function tipoLabel(t){

  const labels={ausencia:'Ausencia',['licencia-medica']:'Lic. médica',['licencia-personal']:'Lic. personal',capacitacion:'Capacitación',otro:'Otro'};

  return labels[t]||t;

}

function chipTipo(t){

  const map={ausencia:'chip-rojo',['licencia-medica']:'chip-rojo',['licencia-personal']:'chip-amarillo',capacitacion:'chip-azul',otro:'chip-gris'};

  return `<span class="chip ${map[t]||'chip-gris'}">${tipoLabel(t)}</span>`;

}

function chipEstado(e){

  const map={pendiente:'chip-amarillo',aprobada:'chip-verde',rechazada:'chip-rojo'};

  const labels={pendiente:'Pendiente',aprobada:'Aprobada',rechazada:'Rechazada'};

  return `<span class="chip ${map[e]||'chip-gris'}">${labels[e]||e}</span>`;

}



// Cerrar modales al click fuera

document.querySelectorAll('.modal-overlay').forEach(m=>{

  m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');});

});



// Init fecha hoy

const hoyFecha = new Date().toISOString().split('T')[0];

document.getElementById('fecha-inicio')&&(document.getElementById('fecha-inicio').value=hoyFecha);

document.getElementById('fecha-fin')&&(document.getElementById('fecha-fin').value=hoyFecha);

function isProfesorAusente(nombre) {
  const hoy = new Date().toISOString().split('T')[0];
  return AUSENCIAS.some(a => 
    a.estado === 'aprobada' && 
    a.inicio <= hoy && a.fin >= hoy && 
    (a.profNombre.toLowerCase().includes(nombre.toLowerCase().split(' ')[0]) || 
     nombre.toLowerCase().includes(a.profNombre.toLowerCase().split(' ')[0]))
  );
}



// SEGUIMIENTO DEL SENSOR (MOUSE/TOUCH) PARA EL FONDO INTERACTIVO

function updateMousePosition(x, y) {

  document.documentElement.style.setProperty('--mouse-x', x + 'px');

  document.documentElement.style.setProperty('--mouse-y', y + 'px');

}



// Mouse para web





// Touch para celulares

document.addEventListener('touchmove', (e) => {

  if (e.touches.length > 0) {

    updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);

  }

});

// REGISTRO DE SERVICE WORKER PARA PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado', reg))
      .catch(err => console.log('Error al registrar SW', err));
  });
}

//                 MAPA INTERACTIVO                
function renderMapa() {
  const hoy = new Date().toISOString().split('T')[0];
  const ausHoy = AUSENCIAS.filter(a=>a.inicio<=hoy&&a.fin>=hoy&&a.estado==='aprobada').map(a=>a.profNombre);
  
  return `
    <div class="page-title">${T('mapa')}</div>
    <div class="page-sub">Estado de ocupación de aulas en tiempo real</div>
    <div class="map-container">
      <svg viewBox="0 0 800 400" class="map-svg">
        <!-- PLANTA BAJA -->
        <rect x="50" y="50" width="150" height="100" class="map-room ${ausHoy.some(n=>n.includes('García'))?'room-absent':'room-present'}" onclick="showToast('Aula 1: Matemáticas')"/>
        <text x="125" y="105" class="map-label">Aula 1</text>
        
        <rect x="210" y="50" width="150" height="100" class="map-room room-present" onclick="showToast('Aula 2: Lengua')"/>
        <text x="285" y="105" class="map-label">Aula 2</text>
        
        <rect x="370" y="50" width="150" height="100" class="map-room ${ausHoy.some(n=>n.includes('Pérez'))?'room-absent':'room-present'}" onclick="showToast('Aula 3: Historia')"/>
        <text x="445" y="105" class="map-label">Aula 3</text>
        
        <rect x="50" y="160" width="150" height="100" class="map-room room-present" onclick="showToast('Laboratorio')"/>
        <text x="125" y="215" class="map-label">LAB</text>
        
        <!-- PASILLO -->
        <rect x="210" y="160" width="310" height="50" style="fill:rgba(255,255,255,0.02);stroke:var(--border)"/>
        <text x="365" y="190" class="map-label" style="font-size:12px">Pasillo Principal</text>
        
        <rect x="530" y="50" width="220" height="210" class="map-room room-present" onclick="showToast('Gimnasio')"/>
        <text x="640" y="155" class="map-label" style="font-size:14px">GIMNASIO</text>
      </svg>
    </div>
    <div class="alert alert-info" style="margin-top:1.5rem">💡 Haz clic en cualquier aula para ver el estado detallado.</div>`;
}

//                 GAMIFICACIÓN                
function checkAchievements() {
  const mis = AUSENCIAS.filter(a=>a.profId===1);
  if (mis.length === 1 && !localStorage.getItem('ach_first')) {
    openAchievement('¡Primer Registro!', 'Has registrado tu primera ausencia en el sistema. ¡Bienvenido a bordo!');
    localStorage.setItem('ach_first', true);
  }
}

function openAchievement(title, desc) {
  document.getElementById('logro-titulo').textContent = title;
  document.getElementById('logro-desc').textContent = desc;
  openModal('modal-logros');
}

//                 TEMAS (SKINS)                
function setTheme(theme) {
  document.body.classList.remove('theme-ocean', 'theme-cyber');
  if (theme !== 'default') document.body.classList.add(`theme-${theme}`);
  localStorage.setItem('app-theme', theme);
  showToast(`Tema ${theme} aplicado`, 'info');
}
// Cargar tema guardado
const savedTheme = localStorage.getItem('app-theme');
if (savedTheme) {
  document.body.classList.remove('theme-ocean', 'theme-cyber');
  if (savedTheme !== 'default') document.body.classList.add(`theme-${savedTheme}`);
}
