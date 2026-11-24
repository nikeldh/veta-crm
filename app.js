/* CRM de Janice — Veta Ops. Datos en Supabase (proyecto VETA-OPS, esquema privado "crm").
 * El navegador solo llama a funciones public.crm_* que validan un codigo personal;
 * las tablas no son accesibles directamente. Cada cambio queda en crm.actividad. */
(function () {
  var SB_URL = 'https://thdeqvgujkrjiohfidss.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZGVxdmd1amtyamlvaGZpZHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTE3NTksImV4cCI6MjEwMzE2Nzc1OX0.qf-WAoAQVLWeiIQrvhzuBK6XEKFcYNFNdQmMuAgqN8A';
  var LS_KEY = 'vetaCrmCodigo';

  var STATUS = {
    sin_tocar:    { label: 'Sin tocar',          emoji: '⚪', fg: 'var(--ink-soft)',  bg: 'var(--surface-2)' },
    tocada:       { label: 'Tocada',             emoji: '🔵', fg: 'var(--info)',      bg: 'var(--info-soft)' },
    conversacion: { label: 'En conversación',    emoji: '🟠', fg: 'var(--warn)',      bg: 'var(--warn-soft)' },
    agendada:     { label: 'Reunión agendada',   emoji: '🟢', fg: 'var(--good)',      bg: 'var(--good-soft)' },
    descartada:   { label: 'Descartada',         emoji: '🔴', fg: 'var(--bad)',       bg: 'var(--bad-soft)' },
    proveedor:    { label: 'Ya tiene proveedor', emoji: '⚫', fg: 'var(--dark-chip)', bg: 'var(--dark-chip-soft)' }
  };
  /* Los campos que edita Janice. OJO: el boton Guardar manda TODOS los de aqui,
   * asi que lo que el sistema escriba en una clave que este en esta lista se
   * pierde en cuanto ella guarde. Por eso `propuestaEstado` NO esta: lo escribe
   * el servidor y la tarjeta solo lo enseña. */
  var CAMPOS = { decisor: 'decisor', contacto: 'contacto', correo: 'correo', fecha: 'fecha', proximo: 'proximoPaso', notas: 'notas' };

  var codigo = null, usuario = null, docs = [], filtro = 'todas';
  // Los sectores viven en sectores.js (build.py regenera guion.js y no debe pisarlos).
  var S = window.GUION_SECTORES || {};
  var GUION_BASE = Object.assign({}, window.GUION_DEFAULT, {
    sectores: S.sectores || [], sectoresIntro: S.intro || '', sectoresTransversal: S.transversal || null,
  });
  var guion = GUION_BASE, guionEdit = false;
  var saving = {}, saveState = {}, abiertas = {};
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function hora(d) { return (d ? new Date(d) : new Date()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }

  // ------------------------------------------------------------ última interacción (migración 034)
  // `ultimaInteraccion` la calcula la base desde crm.actividad: cambios de Janice o Elkin y propuestas
  // enviadas. No cuentan el alta automática ni la investigación automática.
  var ORDEN_KEY = 'vetaCrmOrden', orden = 'reciente';
  try { orden = localStorage.getItem(ORDEN_KEY) || 'reciente'; } catch (e) {}
  function diasAtras(iso) {
    var d = new Date(iso), hoy = new Date(); d.setHours(0, 0, 0, 0); hoy.setHours(0, 0, 0, 0);
    return Math.round((hoy - d) / 86400000);
  }
  function cuando(iso) {
    if (!iso) return '';
    var n = diasAtras(iso);
    if (n <= 0) return 'hoy ' + hora(iso);
    if (n === 1) return 'ayer ' + hora(iso);
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + (n < 7 ? ' · hace ' + n + ' días' : '');
  }
  function grupoDe(iso) {
    if (!iso) return 'Sin interacción todavía';
    var n = diasAtras(iso);
    return n <= 0 ? 'Hoy' : n === 1 ? 'Ayer' : n < 7 ? 'Esta semana' : n < 31 ? 'Este mes' : 'Antes';
  }
  function slugify(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
  function conn(cls, t) { $('conn-dot').className = 'dot ' + cls; $('conn-text').textContent = t; }
  function aviso(msg) { var b = $('error-banner'); b.textContent = msg || ''; b.hidden = !msg; }

  // ------------------------------------------------------------ servidor
  function rpc(fn, args) {
    return fetch(SB_URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (body) {
        if (r.ok) return body;
        var msg = (body && body.message) || ('Error ' + r.status);
        if (/Código de acceso no válido/.test(msg)) { salir(); msg = 'Tu código de acceso ya no es válido. Pide uno nuevo a Elkin.'; }
        throw new Error(msg);
      });
    }, function () { throw new Error('Sin conexión a internet. Nada se guardó — vuelve a intentarlo cuando tengas señal.'); });
  }

  // ------------------------------------------------------------ acceso
  function entrar(c) {
    $('login-err').textContent = ''; $('login-btn').disabled = true; $('login-btn').textContent = 'entrando…';
    rpc('crm_login', { p_codigo: c }).then(function (u) {
      codigo = c; usuario = u;
      try { localStorage.setItem(LS_KEY, c); } catch (e) {}
      $('login').hidden = true;
      $('user-chip').textContent = u.nombre + (u.rol === 'admin' ? ' · admin' : '');
      $('tab-btn-actividad').hidden = u.rol !== 'admin';
      cargar();
    }).catch(function (e) {
      $('login').hidden = false; $('login-err').textContent = e.message;
    }).then(function () { $('login-btn').disabled = false; $('login-btn').textContent = 'Entrar'; });
  }
  function salir() {
    codigo = null; usuario = null;
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    $('login').hidden = false; $('login-code').value = '';
  }
  $('login-btn').onclick = function () { var c = $('login-code').value.trim().toUpperCase(); if (c) entrar(c); };
  $('login-code').onkeydown = function (e) { if (e.key === 'Enter') $('login-btn').click(); };
  $('logout').onclick = function () { salir(); };

  // ------------------------------------------------------------ carga + refresco
  function cargar(silencioso) {
    if (!codigo) return;
    if (!silencioso) conn('', 'cargando…');
    return rpc('crm_listar', { p_codigo: codigo }).then(function (d) {
      docs = d.empresas || [];
      if (d.guion) guion = Object.assign({}, GUION_BASE, d.guion);
      aviso(''); conn('live', 'conectado · actualizado ' + hora());
      renderFilters(); renderGrid(); renderClinicas(); if (!guionEdit) renderGuion();
    }).catch(function (e) { conn('off', 'sin conexión'); aviso('⚠️ ' + e.message); });
  }
  function ocupado() {
    var a = document.activeElement;
    return Object.keys(saving).length || (a && a.closest && a.closest('#pipeline-grid, #clinicas-grid, #guion-content')) ||
      document.querySelector('.add-form.open') || guionEdit;
  }

  // Módulo Clínicas (T-044): las clínicas viven en crm.empresas con modulo = 'clinicas'.
  // El Pipeline enseña el resto; cada lista tiene su pestaña.
  function esClinica(d) { return d.modulo === 'clinicas'; }
  function empresas() { return docs.filter(function (d) { return !esClinica(d); }); }
  function clinicas() { return docs.filter(esClinica); }
  setInterval(function () { if (codigo && !document.hidden && !ocupado()) cargar(true); }, 20000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && codigo && !ocupado()) cargar(true); });

  // ------------------------------------------------------------ pipeline
  function renderStats() {
    var base = empresas(), n = function (f) { return base.filter(f).length; };
    var venc = n(function (d) { return d.urgencia; });
    var cells = [['Empresas', base.length, false], ['Vencidos', venc, venc > 0],
      ['Agendadas', n(function (d) { return d.estado === 'agendada'; }), false],
      ['En conversación', n(function (d) { return d.estado === 'conversacion'; }), false],
      ['Sin tocar', n(function (d) { return !d.estado || d.estado === 'sin_tocar'; }), false]];
    $('stats-row').innerHTML = cells.map(function (c) {
      return '<div class="stat' + (c[2] ? ' alert' : '') + '"><div class="n mono">' + c[1] + '</div><div class="l">' + c[0] + '</div></div>';
    }).join('');
  }

  function renderFilters() {
    var opts = [['todas', 'Todas']].concat(Object.keys(STATUS).map(function (k) { return [k, STATUS[k].emoji + ' ' + STATUS[k].label]; }));
    $('filters-row').innerHTML = opts.map(function (o) {
      return '<button class="chip ' + (filtro === o[0] ? 'on' : '') + '" data-filter="' + o[0] + '">' + o[1] + '</button>';
    }).join('') +
      '<span style="flex-basis:100%;height:0"></span>' +
      [['reciente', '🕒 Recientes primero'], ['az', 'A-Z']].map(function (o) {
        return '<button class="chip ' + (orden === o[0] ? 'on' : '') + '" data-orden="' + o[0] + '">' + o[1] + '</button>';
      }).join('');
    $('filters-row').querySelectorAll('[data-filter]').forEach(function (c) {
      c.onclick = function () { filtro = c.getAttribute('data-filter'); renderFilters(); renderGrid(); };
    });
    $('filters-row').querySelectorAll('[data-orden]').forEach(function (c) {
      c.onclick = function () {
        orden = c.getAttribute('data-orden');
        try { localStorage.setItem(ORDEN_KEY, orden); } catch (e) {}
        renderFilters(); renderGrid();
      };
    });
  }

  function fichaHtml(d) {
    if (!d.queVenden && !d.comoPiden && !d.ficha && !d.web) return '';
    var r = [];
    if (d.queVenden) r.push('<div class="ficha-row"><b>Qué venden</b>' + esc(d.queVenden) + '</div>');
    if (d.comoPiden) r.push('<div class="ficha-row"><b>Cómo piden presupuesto hoy</b>' + esc(d.comoPiden) + '</div>');
    if (d.ficha) r.push('<div class="ficha-row"><b>Contexto</b>' + esc(d.ficha) + '</div>');
    if (d.web) r.push('<div class="ficha-row"><b>Web</b><a href="' + esc(d.web) + '" target="_blank" rel="noopener">' + esc(d.web) + '</a></div>');
    return '<details class="ficha" data-ficha="' + d.id + '"' + (abiertas[d.id] ? ' open' : '') + '><summary>📋 Ficha — léela antes de llamar</summary><div class="ficha-body">' + r.join('') + '</div></details>';
  }

  function cardHtml(d) {
    var st = STATUS[d.estado] || STATUS.sin_tocar, ss = saveState[d.id];
    var opts = Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (d.estado === k ? ' selected' : '') + '>' + STATUS[k].emoji + ' ' + STATUS[k].label + '</option>'; }).join('');
    var inp = function (f, ph) { return '<input class="f" id="' + f + '-' + d.id + '" placeholder="' + ph + '" value="' + esc(d[CAMPOS[f]] || '') + '">'; };
    var quien = d.actualizadoPor && d.actualizadoPor !== 'migración' ? 'editado por ' + esc(d.actualizadoPor) + ' · ' + hora(d.actualizado) : '';
    return '<div class="card' + (d.urgencia ? ' urgent' : '') + '" data-id="' + d.id + '">' +
      '<div class="card-top"><div><h3>' + (esc(d.nombre) || '(sin nombre)') + '</h3><div class="zona">' + (esc(d.zona) || 'zona sin confirmar') + '</div></div>' +
      '<span class="pill" style="color:' + st.fg + ';background:' + st.bg + '">' + st.emoji + ' ' + st.label + '</span></div>' +
      (d.urgencia ? '<div class="urgent-banner"><span>⏰</span><div>' + esc(d.urgencia) + '</div></div>' : '') +
      (d.angulo ? '<div class="angulo">"' + esc(d.angulo) + '"</div>' : '') + fichaHtml(d) +
      '<div class="field-row"><label class="f" for="decisor-' + d.id + '">Decisor</label><label class="f" for="contacto-' + d.id + '">Contacto</label></div>' +
      '<div class="field-row">' + inp('decisor', 'pendiente') + inp('contacto', 'tel / email') + '</div>' +
      '<label class="f" for="correo-' + d.id + '">Correo para enviarle la propuesta</label>' +
      inp('correo', d.correoSugerido ? d.correoSugerido + ' (sugerido)' : 'nombre@empresa.com') +
      '<div class="field-row"><label class="f" for="estado-' + d.id + '">Estado</label><label class="f" for="fecha-' + d.id + '">Próxima fecha</label></div>' +
      '<div class="field-row"><select class="f" id="estado-' + d.id + '">' + opts + '</select>' + inp('fecha', 'ej. 25 sept') + '</div>' +
      '<label class="f" for="proximo-' + d.id + '">Próximo paso</label>' + inp('proximo', 'ej. reagendar, confirmar hora') +
      '<label class="f" for="notas-' + d.id + '">Notas de la llamada</label>' +
      '<textarea class="f" id="notas-' + d.id + '" placeholder="qué dijo, con quién hablaste…">' + esc(d.notas || '') + '</textarea>' +
      '<div class="card-foot"><button class="touch-btn" data-touch="' + d.id + '">+1 toque hoy</button>' +
      '<button class="prop-btn" data-propuesta="' + d.id + '">📨 Pedir propuesta</button>' +
      '<button class="save-btn" data-save="' + d.id + '">💾 Guardar</button></div>' +
      (d.propuestaEstado ? '<div class="prop-chip">📨 ' + esc(d.propuestaEstado) + '</div>' : '') +
      '<div class="card-meta"><span class="save-state ' + (ss ? ss.cls : '') + '">' + (ss ? esc(ss.text) : '') + '</span>' +
      '<span class="touch-meta">' + (d.toques ? d.toques + ' toques' : 'sin toques') + (d.ultimoToque ? ' · último ' + esc(d.ultimoToque) : '') + '</span></div>' +
      (d.ultimaInteraccion ? '<div class="who-meta">🕒 última interacción: ' + esc(cuando(d.ultimaInteraccion)) + '</div>' : '') +
      (quien ? '<div class="who-meta">' + quien + '</div>' : '') +
      '</div>';
  }

  function renderGrid() {
    renderStats();
    var base = empresas();
    var vis = filtro === 'todas' ? base : base.filter(function (d) { return (d.estado || 'sin_tocar') === filtro; });
    var porNombre = function (a, b) { return (a.nombre || '').localeCompare(b.nombre || ''); };
    var porReciente = function (a, b) {
      var ta = a.ultimaInteraccion ? Date.parse(a.ultimaInteraccion) : 0, tb = b.ultimaInteraccion ? Date.parse(b.ultimaInteraccion) : 0;
      return (tb - ta) || porNombre(a, b);   // lo último tocado arriba; las nunca tocadas, al final por nombre
    };
    vis = vis.slice().sort(function (a, b) {
      return ((a.urgencia ? 0 : 1) - (b.urgencia ? 0 : 1)) || (orden === 'reciente' ? porReciente(a, b) : porNombre(a, b));
    });
    // En «Recientes» se separan por tramos (Hoy, Ayer, Esta semana…) para que nada se pierda.
    var grupoActual = null, cabecera = function (t, n) {
      return '<div style="grid-column:1/-1;display:flex;align-items:baseline;gap:8px;margin:10px 0 -4px;font-weight:700;font-size:13px;letter-spacing:.06em;text-transform:uppercase;opacity:.75">' +
        esc(t) + '<span style="font-weight:400;letter-spacing:0;text-transform:none">· ' + n + '</span></div>';
    };
    var cuenta = {};
    if (orden === 'reciente') vis.forEach(function (d) { if (!d.urgencia) { var g = grupoDe(d.ultimaInteraccion); cuenta[g] = (cuenta[g] || 0) + 1; } });
    $('pipeline-grid').innerHTML = vis.map(function (d) {
      var pre = '';
      if (orden === 'reciente' && !d.urgencia) {
        var g = grupoDe(d.ultimaInteraccion);
        if (g !== grupoActual) { grupoActual = g; pre = cabecera(g, cuenta[g]); }
      }
      return pre + cardHtml(d);
    }).join('') +
      '<div class="add-card"><button id="add-toggle" type="button">+ Añadir empresa</button>' +
      '<div class="add-form" id="add-form"><input id="new-nombre" placeholder="Nombre de la empresa"><input id="new-zona" placeholder="Zona (ej. Bizkaia)">' +
      '<button class="touch-btn" id="add-confirm" type="button">Guardar empresa</button><span class="save-state err" id="add-err"></span></div></div>';

    enlazar($('pipeline-grid'), vis);
    $('add-toggle').onclick = function () { $('add-form').classList.toggle('open'); };
    $('add-confirm').onclick = crearEmpresa;
  }

  /* Conecta los campos y botones de las tarjetas de una rejilla (Pipeline o Clínicas). */
  function enlazar(grid, vis) {
    vis.forEach(function (d) {
      Object.keys(CAMPOS).forEach(function (f) {
        var node = $(f + '-' + d.id);
        node.addEventListener('change', function () { var p = {}; p[CAMPOS[f]] = node.value; guardar(d.id, p); });
      });
      var est = $('estado-' + d.id);
      est.addEventListener('change', function () { guardar(d.id, { estado: est.value }); });
      var anu = $('anuncios-' + d.id);   // solo existe en las tarjetas de clínicas
      if (anu) anu.addEventListener('change', function () { guardar(d.id, { anuncios: anu.value }); });
    });
    grid.querySelectorAll('[data-touch]').forEach(function (b) {
      b.onclick = function () {
        var d = docs.filter(function (x) { return x.id === b.getAttribute('data-touch'); })[0];
        guardar(d.id, { toques: (Number(d.toques) || 0) + 1, ultimoToque: new Date().toISOString().slice(0, 10) });
      };
    });
    grid.querySelectorAll('[data-save]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-save'), p = { estado: $('estado-' + id).value };
        Object.keys(CAMPOS).forEach(function (f) { p[CAMPOS[f]] = $(f + '-' + id).value; });
        if ($('anuncios-' + id)) p.anuncios = $('anuncios-' + id).value;
        guardar(id, p);
      };
    });
    grid.querySelectorAll('[data-propuesta]').forEach(function (b) {
      b.onclick = function () { pedirPropuesta(b.getAttribute('data-propuesta'), b); };
    });
    grid.querySelectorAll('details.ficha').forEach(function (det) {
      det.addEventListener('toggle', function () { abiertas[det.getAttribute('data-ficha')] = det.open; });
    });
  }

  function pintarEstado(id) {
    var card = document.querySelector('.card[data-id="' + id + '"] .save-state'), ss = saveState[id];
    if (card && ss) { card.className = 'save-state ' + ss.cls; card.textContent = ss.text; }
  }

  function actualizarTarjeta(d) {
    var card = document.querySelector('.card[data-id="' + d.id + '"]');
    if (!card) return;
    var st = STATUS[d.estado] || STATUS.sin_tocar, pill = card.querySelector('.pill');
    pill.style.color = st.fg; pill.style.background = st.bg; pill.textContent = st.emoji + ' ' + st.label;
    card.querySelector('.touch-meta').textContent = (d.toques ? d.toques + ' toques' : 'sin toques') + (d.ultimoToque ? ' · último ' + d.ultimoToque : '');
    pintarEstado(d.id); renderStats(); renderCliStats();
  }

  /* Pedir propuesta: Elkin recibe el correo ya escrito y lo aprueba. Aqui NO se
   * envia nada ni se cambia el estado comercial de la ficha — pedirla no es
   * haberla mandado. Todo lo que puede salir mal (correo raro, una ya en
   * marcha, una enviada hace nada) lo decide el servidor, que es el unico sitio
   * donde no se puede saltar. */
  function pedirPropuesta(id, boton) {
    var d = docs.filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    var correo = ($('correo-' + id).value || '').trim();
    if (!correo) {
      aviso('Escribe primero el correo de la persona a la que se la mandamos.');
      $('correo-' + id).focus();
      return;
    }
    if (!window.confirm('¿Pedir la propuesta de ' + (d.nombre || 'esta empresa') + ' para ' + correo + '?\n\n'
                        + 'Elkin la revisa antes de que salga: no se envía nada todavía.')) return;

    aviso('');
    boton.disabled = true;
    var antes = boton.textContent;
    boton.textContent = 'pidiendo…';

    rpc('crm_pedir_propuesta', { p_codigo: codigo, p_id: id, p_correo: correo }).then(function (r) {
      boton.textContent = '📨 Pedida';
      var avisos = (r && r.avisos) || [];
      aviso(avisos.length
        ? 'Pedida. Ojo: ' + avisos.join(' · ') + '. Elkin lo verá al revisarla.'
        : 'Pedida. Elkin la revisa y te dice algo.');
      // El servidor ya dejó el espejo en la ficha; se recarga para verlo.
      cargar(true);
    }, function (e) {
      boton.disabled = false;
      boton.textContent = antes;
      aviso(e.message);
    });
  }

  function guardar(id, patch) {
    saving[id] = true; saveState[id] = { cls: 'pending', text: 'guardando…' }; pintarEstado(id);
    rpc('crm_actualizar', { p_codigo: codigo, p_id: id, p_patch: patch }).then(function (nuevo) {
      docs = docs.map(function (d) { return d.id === id ? nuevo : d; });
      saveState[id] = { cls: 'ok', text: '✓ guardado ' + hora() };
      aviso('');
      // Si está escribiendo en cualquier ficha, no se redibuja nada: solo se actualiza esta tarjeta.
      var a = document.activeElement, escribiendo = a && a.closest && a.closest('#pipeline-grid, #clinicas-grid') && /INPUT|TEXTAREA|SELECT/.test(a.tagName);
      if (escribiendo) actualizarTarjeta(nuevo); else if (esClinica(nuevo)) renderClinicas(); else renderGrid();
    }).catch(function (e) {
      saveState[id] = { cls: 'err', text: '✗ no se guardó — pulsa Guardar' };
      pintarEstado(id); aviso('⚠️ ' + e.message);
    }).then(function () { delete saving[id]; });
  }

  function crearEmpresa() {
    var nombre = $('new-nombre').value.trim(), zona = $('new-zona').value.trim();
    if (!nombre) return;
    var id = slugify(nombre) || ('empresa-' + Date.now());
    $('add-confirm').disabled = true;
    rpc('crm_crear', { p_codigo: codigo, p_id: id, p_data: { nombre: nombre, zona: zona, estado: 'sin_tocar' } })
      .then(function (nuevo) { docs.push(nuevo); saveState[id] = { cls: 'ok', text: '✓ empresa creada' }; renderGrid(); })
      .catch(function (e) { $('add-err').textContent = e.message; $('add-confirm').disabled = false; });
  }

  // ------------------------------------------------------------ clínicas (T-044)
  // Textos del módulo (intro, metas, mensajes) en clinicas.js. Los datos de cada
  // clínica solo viven en Supabase: este repo es público.
  var CLI = window.CLINICAS || {};
  var ANUNCIOS = [['sin comprobar', '❔ Anuncios: sin comprobar'], ['si', '📣 Tiene anuncios'], ['no', '— Sin anuncios']];

  // Filtros de Clínicas (24-nov-2026): lugar, estado, fechas, toques, encaje, anuncios y
  // señales. Se recuerdan en ESTE navegador (localStorage), nunca en la base: son una
  // comodidad de quien mira, no un dato de la clínica. Si el navegador no deja guardar, se
  // usa igual y vuelve a "todas" al recargar.
  var CLI_KEY = 'vetaCrmCliFiltros';
  var CLI_VACIO = { estado: 'todas', texto: '', municipio: '', cp: '', interaccion: '', proxima: '',
    toques: '', encaje: '', anuncios: '', senales: [], orden: 'encaje' };
  var cf = Object.assign({}, CLI_VACIO);
  try {
    var cfGuardado = JSON.parse(localStorage.getItem(CLI_KEY) || 'null');
    if (cfGuardado && typeof cfGuardado === 'object') cf = Object.assign({}, CLI_VACIO, cfGuardado);
  } catch (e) {}
  if (!Array.isArray(cf.senales)) cf.senales = [];
  function guardarCf() { try { localStorage.setItem(CLI_KEY, JSON.stringify(cf)); } catch (e) {} }

  function norm(s) { return (s == null ? '' : String(s)).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  // "Bilbao · CP 48009" → municipio "Bilbao", CP "48009". `municipio` manda si existe.
  function municipioDe(d) { return (d.municipio || String(d.zona || '').split('·')[0] || '').trim() || 'Sin municipio'; }
  function cpDe(d) {
    var m = String(d.zona || '').match(/\b(\d{5})\b/) || String(d.direccion || '').match(/\b(\d{5})\b/);
    return m ? m[1] : '';
  }
  // La próxima fecha es texto libre ("vie 28 nov", "28/11", "2026-11-28"). Se entiende lo que
  // se puede; lo que no, cuenta como "tiene fecha" pero no entra en vencidas/hoy/semana.
  var MESES = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11 };
  function fechaDe(txt) {
    var t = norm(txt).trim(), hoy = new Date(), m, d = null, conAnio = false;
    hoy.setHours(0, 0, 0, 0);
    if (!t) return null;
    if ((m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) { d = new Date(+m[1], +m[2] - 1, +m[3]); conAnio = true; }
    else if ((m = t.match(/\b(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?\b/))) {
      conAnio = !!m[3];
      d = new Date(m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : hoy.getFullYear(), +m[2] - 1, +m[1]);
    }
    else if ((m = t.match(/\b(\d{1,2})\s*(?:de\s+)?(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)/))) d = new Date(hoy.getFullYear(), MESES[m[2]], +m[1]);
    if (!d || isNaN(d.getTime())) return null;
    // Sin año: "3 ene" escrito en diciembre es del año que viene, no de hace once meses.
    if (!conAnio && d < hoy && (hoy - d) / 86400000 > 120) d.setFullYear(d.getFullYear() + 1);
    return d;
  }
  function diasHasta(d) { var hoy = new Date(); hoy.setHours(0, 0, 0, 0); return Math.round((d - hoy) / 86400000); }
  function ultimaDe(d) { return d.ultimaInteraccion || d.ultimoToque || ''; }

  var SENALES = [
    ['wa', '💬 WhatsApp', function (d) { return d.whatsapp === 'si'; }],
    ['reserva', '📅 Reserva online', function (d) { return d.reservaOnline === 'si'; }],
    ['ig', '📷 Instagram', function (d) { return !!d.instagram; }],
    ['web', '🌐 Web', function (d) { return !!d.web; }],
    ['decisor', '👤 Con dueña/o', function (d) { return !!String(d.decisor || '').trim(); }],
    ['correo', '✉️ Con correo', function (d) { return !!String(d.correo || '').trim(); }]
  ];
  var FILTROS_SELECT = {
    interaccion: { titulo: 'Última interacción', opts: [['', 'Cualquiera'], ['hoy', 'Hoy'], ['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'],
      ['mas7', 'Hace más de 7 días'], ['mas30', 'Hace más de 30 días'], ['nunca', 'Nunca']] },
    proxima: { titulo: 'Próxima fecha', opts: [['', 'Cualquiera'], ['vencida', '⚠️ Vencida'], ['hoy', 'Hoy'], ['semana', 'Próximos 7 días'],
      ['con', 'Con fecha'], ['sin', 'Sin fecha']] },
    toques: { titulo: 'Toques', opts: [['', 'Cualquiera'], ['0', 'Sin toques'], ['1', '1 toque'], ['2', '2 toques'], ['3', '3 o más']] },
    encaje: { titulo: 'Encaje', opts: [['', 'Cualquiera'], ['1', 'Encaje 1 (alto)'], ['2', 'Encaje 2'], ['3', 'Encaje 3'], ['sin', 'Sin valorar']] },
    anuncios: { titulo: 'Anuncios', opts: [['', 'Cualquiera'], ['si', '📣 Tiene anuncios'], ['no', '— Sin anuncios'], ['sin comprobar', '❔ Sin comprobar']] },
    orden: { titulo: 'Ordenar por', opts: [['encaje', 'Encaje (alto primero)'], ['proxima', 'Próxima fecha'], ['reciente', 'Tocadas hace poco'],
      ['olvidadas', 'Más tiempo sin tocar'], ['toques', 'Más toques'], ['lugar', 'Lugar (municipio y CP)'], ['nombre', 'Nombre A-Z']] }
  };

  /* ¿Pasa `d` todos los filtros? `sin` permite saltarse uno (para contar los chips de estado). */
  function pasaCli(d, sin) {
    if (sin !== 'estado' && cf.estado !== 'todas' && (d.estado || 'sin_tocar') !== cf.estado) return false;
    if (cf.texto) {
      var hay = norm([d.nombre, d.zona, d.direccion, d.barrio, d.municipio, d.decisor, d.contacto, d.correo, d.telefono,
        d.notas, d.proximoPaso, d.razonSocial].join(' '));
      if (norm(cf.texto).split(/\s+/).filter(Boolean).some(function (p) { return hay.indexOf(p) < 0; })) return false;
    }
    if (cf.municipio && municipioDe(d) !== cf.municipio) return false;
    if (cf.cp && cpDe(d) !== cf.cp) return false;
    if (cf.interaccion) {
      var u = ultimaDe(d), n = u ? diasAtras(u) : null;
      var okI = { hoy: n === 0, '7': n !== null && n < 7, '30': n !== null && n < 31, mas7: n !== null && n >= 7,
        mas30: n !== null && n >= 31, nunca: n === null }[cf.interaccion];
      if (!okI) return false;
    }
    if (cf.proxima) {
      var txt = String(d.fecha || '').trim(), f = fechaDe(txt), dh = f ? diasHasta(f) : null;
      var okP = { vencida: dh !== null && dh < 0, hoy: dh === 0, semana: dh !== null && dh >= 0 && dh <= 7,
        con: !!txt, sin: !txt }[cf.proxima];
      if (!okP) return false;
    }
    if (cf.toques) {
      var t = Number(d.toques) || 0;
      if (cf.toques === '3' ? t < 3 : t !== Number(cf.toques)) return false;
    }
    if (cf.encaje && (cf.encaje === 'sin' ? !!String(d.encaje || '') : String(d.encaje || '') !== cf.encaje)) return false;
    if (cf.anuncios && (d.anuncios || 'sin comprobar') !== cf.anuncios) return false;
    for (var i = 0; i < SENALES.length; i++) if (cf.senales.indexOf(SENALES[i][0]) >= 0 && !SENALES[i][2](d)) return false;
    return true;
  }
  function filtrosActivos() {
    var n = 0;
    ['texto', 'municipio', 'cp', 'interaccion', 'proxima', 'toques', 'encaje', 'anuncios'].forEach(function (k) { if (cf[k]) n++; });
    if (cf.estado !== 'todas') n++;
    return n + cf.senales.length;
  }
  function ordenarCli(vis) {
    var porNombre = function (a, b) { return (a.nombre || '').localeCompare(b.nombre || ''); };
    var ts = function (d) { var u = ultimaDe(d); return u ? new Date(u).getTime() : null; };
    var cmp = {
      encaje: function (a, b) { return ((Number(a.encaje) || 9) - (Number(b.encaje) || 9)) || porNombre(a, b); },
      // Las que tienen fecha, de la más cercana (o más vencida) a la más lejana; luego las que
      // tienen una fecha que no se entiende; las que no tienen fecha, al final.
      proxima: function (a, b) {
        var fa = fechaDe(a.fecha), fb = fechaDe(b.fecha);
        var ra = fa ? 0 : (String(a.fecha || '').trim() ? 1 : 2), rb = fb ? 0 : (String(b.fecha || '').trim() ? 1 : 2);
        return (ra - rb) || (fa && fb ? fa - fb : 0) || porNombre(a, b);
      },
      reciente: function (a, b) { var x = ts(a), y = ts(b); return (x === null) - (y === null) || (y || 0) - (x || 0) || porNombre(a, b); },
      // Para el seguimiento: primero las tocadas hace más tiempo; las nunca tocadas, al final.
      olvidadas: function (a, b) { var x = ts(a), y = ts(b); return (x === null) - (y === null) || (x || 0) - (y || 0) || porNombre(a, b); },
      toques: function (a, b) { return (Number(b.toques) || 0) - (Number(a.toques) || 0) || porNombre(a, b); },
      lugar: function (a, b) { return municipioDe(a).localeCompare(municipioDe(b)) || cpDe(a).localeCompare(cpDe(b)) || porNombre(a, b); },
      nombre: porNombre
    }[cf.orden] || porNombre;
    return vis.slice().sort(cmp);
  }

  function enlace(u) {
    return /^https?:\/\//i.test(u || '') ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u) + '</a>' : esc(u);
  }
  function senal(txt, v) {
    var t = v === 'si' ? 'sí' : v === 'no' ? 'no' : '?';
    return '<span class="senal' + (v === 'si' ? ' si' : '') + '">' + txt + ': ' + t + '</span>';
  }
  function conversaciones() {
    return clinicas().filter(function (d) { return d.estado === 'conversacion' || d.estado === 'agendada'; }).length;
  }

  function renderCliStats() {
    if (!$('cli-stats')) return;
    var cs = clinicas(), n = function (f) { return cs.filter(f).length; };
    var cells = [['Clínicas', cs.length], ['Encaje alto', n(function (d) { return String(d.encaje) === '1'; })],
      ['Sin tocar', n(function (d) { return !d.estado || d.estado === 'sin_tocar'; })], ['Tocadas', n(function (d) { return d.estado === 'tocada'; })],
      ['En conversación', n(function (d) { return d.estado === 'conversacion'; })], ['Agendadas', n(function (d) { return d.estado === 'agendada'; })]];
    $('cli-stats').innerHTML = cells.map(function (c) {
      return '<div class="stat"><div class="n mono">' + c[1] + '</div><div class="l">' + c[0] + '</div></div>';
    }).join('');
    var c = conversaciones();
    $('cli-meta').innerHTML = (CLI.metas || []).map(function (m) {
      return '<span class="meta-chip' + (c >= m.n ? ' ok' : '') + '">' + esc(m.texto) + ': ' + c + ' / ' + m.n + '</span>';
    }).join('');
  }

  function fichaClinica(d) {
    var r = [], fila = function (t, v) { if (v) r.push('<div class="ficha-row"><b>' + t + '</b>' + v + '</div>'); };
    fila('Dirección', esc([d.direccion, d.barrio].filter(Boolean).join(' · ')));
    fila('Teléfono de la clínica', esc(d.telefono || ''));
    if (d.web) fila('Web', enlace(d.web));
    if (d.instagram) fila('Instagram', enlace(d.instagram));
    fila('Equipo', esc([d.profesionales ? d.profesionales + ' profesionales' : '', d.gabinetes ? d.gabinetes + ' gabinetes' : ''].filter(Boolean).join(' · ')));
    fila('Reseñas', esc(d.resenas || ''));
    if (d.resenasTelefono && d.resenasTelefono !== 'sin comprobar') fila('Una reseña sobre el teléfono o las citas', esc(d.resenasTelefono));
    fila('Por qué encaja', esc(d.porQue || ''));
    if (d.fuentes && d.fuentes.length) fila('Fuentes' + (d.consultado ? ' (consultadas el ' + esc(d.consultado) + ')' : ''), d.fuentes.map(enlace).join('<br>'));
    if (!r.length) return '';
    return '<details class="ficha" data-ficha="' + d.id + '"' + (abiertas[d.id] ? ' open' : '') + '><summary>📋 Ficha — léela antes de contactar</summary><div class="ficha-body">' + r.join('') + '</div></details>';
  }

  // La próxima fecha, a la vista en la tarjeta: en rojo si ya pasó, en ámbar si es hoy.
  function proximaHtml(d) {
    var txt = String(d.fecha || '').trim();
    if (!txt) return '';
    var f = fechaDe(txt), dh = f ? diasHasta(f) : null;
    var cls = dh === null ? 'futura' : dh < 0 ? 'vencida' : dh === 0 ? 'hoy' : 'futura';
    var extra = dh === null ? '' : dh < 0 ? ' · vencida hace ' + (-dh) + (dh === -1 ? ' día' : ' días')
      : dh === 0 ? ' · hoy' : dh === 1 ? ' · mañana' : ' · en ' + dh + ' días';
    return '<span class="cli-proxima ' + cls + '">📅 ' + esc(txt) + extra + '</span>';
  }

  function cardClinica(d) {
    var st = STATUS[d.estado] || STATUS.sin_tocar, ss = saveState[d.id], e = String(d.encaje || '');
    var opts = Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (d.estado === k ? ' selected' : '') + '>' + STATUS[k].emoji + ' ' + STATUS[k].label + '</option>'; }).join('');
    var anu = d.anuncios || 'sin comprobar';
    var anuOpts = ANUNCIOS.map(function (o) { return '<option value="' + o[0] + '"' + (anu === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
    var inp = function (f, ph) { return '<input class="f" id="' + f + '-' + d.id + '" placeholder="' + ph + '" value="' + esc(d[CAMPOS[f]] || '') + '">'; };
    var quien = d.actualizadoPor && d.actualizadoPor !== 'migración' && d.actualizadoPor !== 'Elkin (vía Claude)' ? 'editado por ' + esc(d.actualizadoPor) + ' · ' + hora(d.actualizado) : '';
    return '<div class="card" data-id="' + d.id + '">' +
      '<div class="card-top"><div><h3>' + (esc(d.nombre) || '(sin nombre)') +
      (e ? '<span class="encaje e' + esc(e) + '">encaje ' + esc(e) + '</span>' : '') + '</h3><div class="zona">' + (esc(d.zona) || 'zona sin confirmar') + '</div></div>' +
      '<span class="pill" style="color:' + st.fg + ';background:' + st.bg + '">' + st.emoji + ' ' + st.label + '</span></div>' +
      '<div class="senales">' + senal('Reserva online', d.reservaOnline) + senal('WhatsApp', d.whatsapp) + senal('Instagram', d.instagram ? 'si' : 'no') + '</div>' +
      proximaHtml(d) +
      fichaClinica(d) +
      '<div class="field-row"><label class="f" for="decisor-' + d.id + '">Dueña o dueño</label><label class="f" for="contacto-' + d.id + '">Contacto</label></div>' +
      '<div class="field-row">' + inp('decisor', 'pendiente') + inp('contacto', 'tel / email') + '</div>' +
      '<label class="f" for="correo-' + d.id + '">Correo de la dueña o de la clínica</label>' + inp('correo', 'nombre@clinica.com') +
      '<div class="field-row"><label class="f" for="estado-' + d.id + '">Estado</label><label class="f" for="fecha-' + d.id + '">Próxima fecha</label></div>' +
      '<div class="field-row"><select class="f" id="estado-' + d.id + '">' + opts + '</select>' + inp('fecha', 'ej. vie 28 nov') + '</div>' +
      '<label class="f" for="anuncios-' + d.id + '">Anuncios (Biblioteca de anuncios de Meta)</label><select class="f" id="anuncios-' + d.id + '">' + anuOpts + '</select>' +
      '<label class="f" for="proximo-' + d.id + '">Próximo paso</label>' + inp('proximo', 'ej. visita el viernes, reenviar correo') +
      '<label class="f" for="notas-' + d.id + '">Notas (qué dijo de su recepción, su agenda o sus pacientes)</label>' +
      '<textarea class="f" id="notas-' + d.id + '" placeholder="con quién hablaste, qué te contó…">' + esc(d.notas || '') + '</textarea>' +
      '<div class="card-foot"><button class="touch-btn" data-touch="' + d.id + '">+1 toque hoy</button>' +
      '<button class="save-btn" data-save="' + d.id + '">💾 Guardar</button></div>' +
      '<div class="card-meta"><span class="save-state ' + (ss ? ss.cls : '') + '">' + (ss ? esc(ss.text) : '') + '</span>' +
      '<span class="touch-meta">' + (d.toques ? d.toques + ' toques' : 'sin toques') + (d.ultimoToque ? ' · último ' + esc(d.ultimoToque) : '') + '</span></div>' +
      (d.ultimaInteraccion ? '<div class="who-meta">🕒 última interacción: ' + esc(cuando(d.ultimaInteraccion)) + '</div>' : '') +
      (quien ? '<div class="who-meta">' + quien + '</div>' : '') +
      '</div>';
  }

  function renderCliCabecera() {
    $('cli-intro').innerHTML = CLI.intro || '';   // texto propio de clinicas.js, no datos de usuario
    var msgs = CLI.mensajes || [];
    $('cli-mensajes').innerHTML = msgs.length ? '<details class="msg"><summary>✉️ Mensajes de primer contacto (de usted): copia y personaliza</summary><div class="msg-body">' +
      msgs.map(function (m, i) {
        return '<details class="msg"><summary>' + esc(m.titulo) + ' <span class="copy-btn" data-climsg="' + i + '">copiar</span></summary><div class="msg-body"><p style="white-space:pre-line">' + esc(m.texto) + '</p></div></details>';
      }).join('') + '</div></details>' : '';
    $('cli-mensajes').querySelectorAll('[data-climsg]').forEach(function (b) {
      b.onclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        var t = msgs[Number(b.getAttribute('data-climsg'))];
        navigator.clipboard.writeText(t.texto || '').then(function () {
          b.textContent = '✓ copiado'; b.classList.add('done');
          setTimeout(function () { b.textContent = 'copiar'; b.classList.remove('done'); }, 1500);
        });
      };
    });
  }

  // Chips de estado con su recuento, contado con TODOS los demás filtros aplicados: así se ve
  // cuántas quedan en cada estado dentro de lo que se está mirando.
  function renderCliFiltros() {
    var base = clinicas().filter(function (d) { return pasaCli(d, 'estado'); });
    var cuenta = function (k) { return k === 'todas' ? base.length : base.filter(function (d) { return (d.estado || 'sin_tocar') === k; }).length; };
    var opts = [['todas', 'Todas']].concat(Object.keys(STATUS).map(function (k) { return [k, STATUS[k].emoji + ' ' + STATUS[k].label]; }));
    $('cli-filters').innerHTML = opts.map(function (o) {
      return '<button class="chip ' + (cf.estado === o[0] ? 'on' : '') + '" data-clifiltro="' + o[0] + '">' + o[1] + ' · ' + cuenta(o[0]) + '</button>';
    }).join('');
    $('cli-filters').querySelectorAll('[data-clifiltro]').forEach(function (c) {
      c.onclick = function () { cf.estado = c.getAttribute('data-clifiltro'); guardarCf(); renderClinicas(); };
    });
  }

  /* El panel se construye UNA vez. El refresco de cada 20 s solo rehace la rejilla, los chips
   * y las opciones de lugar: si se reconstruyera el panel, el buscador perdería el foco y lo
   * que Janice está escribiendo. */
  var cliPanelHecho = false, cliBuscarT = null;
  function selectHtml(id, titulo, opts, valor) {
    return '<label class="f" for="' + id + '">' + titulo + '<select class="f" id="' + id + '">' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (valor === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
      '</select></label>';
  }
  function construirCliPanel() {
    var cuerpo = $('cli-panel-body');
    if (!cuerpo || cliPanelHecho) return;
    cliPanelHecho = true;
    cuerpo.innerHTML =
      '<label class="f ancho" for="cf-texto">Buscar<input class="f" type="search" id="cf-texto" placeholder="nombre, calle, dueña, teléfono, notas…" value="' + esc(cf.texto) + '"></label>' +
      selectHtml('cf-municipio', 'Municipio', [['', 'Todos']], cf.municipio) +
      selectHtml('cf-cp', 'Código postal', [['', 'Todos']], cf.cp) +
      ['interaccion', 'proxima', 'toques', 'encaje', 'anuncios', 'orden'].map(function (k) {
        return selectHtml('cf-' + k, FILTROS_SELECT[k].titulo, FILTROS_SELECT[k].opts, cf[k]);
      }).join('') +
      '<div class="ancho"><span class="cli-lbl">Señales (deben cumplirse todas las marcadas)</span><div class="cli-senales">' +
      SENALES.map(function (s) {
        return '<button type="button" class="chip" data-senal="' + s[0] + '" aria-pressed="' + (cf.senales.indexOf(s[0]) >= 0) + '">' + s[1] + '</button>';
      }).join('') + '</div></div>';
    // Abierto en pantallas anchas o si ya hay filtros puestos; plegado en el móvil.
    $('cli-panel').open = window.innerWidth > 720 || filtrosActivos() > 0;

    $('cf-texto').addEventListener('input', function () {
      var v = this.value;
      clearTimeout(cliBuscarT);
      cliBuscarT = setTimeout(function () { cf.texto = v.trim(); guardarCf(); renderClinicas(); }, 180);
    });
    ['municipio', 'cp', 'interaccion', 'proxima', 'toques', 'encaje', 'anuncios', 'orden'].forEach(function (k) {
      $('cf-' + k).addEventListener('change', function () {
        cf[k] = this.value;
        if (k === 'municipio') cf.cp = '';   // un CP de otro municipio dejaría la lista vacía sin decir por qué
        guardarCf(); renderClinicas();
      });
    });
    cuerpo.querySelectorAll('[data-senal]').forEach(function (b) {
      b.onclick = function () {
        var s = b.getAttribute('data-senal'), i = cf.senales.indexOf(s);
        if (i >= 0) cf.senales.splice(i, 1); else cf.senales.push(s);
        b.setAttribute('aria-pressed', String(i < 0));
        guardarCf(); renderClinicas();
      };
    });
  }
  function quitarFiltrosCli() {
    var orden = cf.orden;
    cf = Object.assign({}, CLI_VACIO, { senales: [], orden: orden });   // el orden no es un filtro: se respeta
    guardarCf();
    $('cf-texto').value = '';
    ['interaccion', 'proxima', 'toques', 'encaje', 'anuncios'].forEach(function (k) { $('cf-' + k).value = ''; });
    document.querySelectorAll('#cli-panel-body [data-senal]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    renderClinicas();
  }
  // Opciones de municipio y CP sacadas de los datos, con cuántas hay en cada uno.
  function opcionesLugar() {
    var cs = clinicas(), sel = function (id) { return $(id); };
    var rellenar = function (node, valores, valor, etiqueta) {
      if (!node || document.activeElement === node) return;
      var claves = Object.keys(valores).sort();
      if (valor && claves.indexOf(valor) < 0) { claves.push(valor); valores[valor] = 0; }   // no perder un filtro guardado
      node.innerHTML = '<option value="">Todos</option>' + claves.map(function (k) {
        return '<option value="' + esc(k) + '"' + (k === valor ? ' selected' : '') + '>' + esc(etiqueta(k)) + ' · ' + valores[k] + '</option>';
      }).join('');
    };
    var munis = {}, cps = {};
    cs.forEach(function (d) {
      var m = municipioDe(d); munis[m] = (munis[m] || 0) + 1;
      var c = cpDe(d); if (c && (!cf.municipio || m === cf.municipio)) cps[c] = (cps[c] || 0) + 1;
    });
    rellenar(sel('cf-municipio'), munis, cf.municipio, function (k) { return k; });
    rellenar(sel('cf-cp'), cps, cf.cp, function (k) { return 'CP ' + k; });
  }

  function renderClinicas() {
    if (!$('clinicas-grid')) return;
    construirCliPanel(); opcionesLugar();
    renderCliFiltros(); renderCliStats();
    var base = clinicas();
    var vis = ordenarCli(base.filter(function (d) { return pasaCli(d); }));
    var activos = filtrosActivos();
    $('cli-activos').textContent = activos ? activos + (activos === 1 ? ' activo' : ' activos') : '';
    $('cli-count').innerHTML = 'Mostrando ' + vis.length + ' de ' + base.length + ' clínicas' +
      (activos ? ' <button type="button" class="cli-quitar" id="cli-quitar">✕ Quitar filtros</button>' : '');
    if ($('cli-quitar')) $('cli-quitar').onclick = quitarFiltrosCli;
    $('clinicas-grid').innerHTML = (base.length && !vis.length ? '<div class="cli-vacio">Ninguna clínica cumple estos filtros. Prueba a quitar alguno.</div>' : '') +
      vis.map(cardClinica).join('') +
      '<div class="add-card"><button id="cli-add-toggle" type="button">+ Añadir clínica</button>' +
      '<div class="add-form" id="cli-add-form"><input id="cli-new-nombre" placeholder="Nombre de la clínica"><input id="cli-new-zona" placeholder="Zona (ej. Bilbao · Indautxu)">' +
      '<button class="touch-btn" id="cli-add-confirm" type="button">Guardar clínica</button><span class="save-state err" id="cli-add-err"></span></div></div>';
    enlazar($('clinicas-grid'), vis);
    $('cli-add-toggle').onclick = function () { $('cli-add-form').classList.toggle('open'); };
    $('cli-add-confirm').onclick = crearClinica;
  }

  function crearClinica() {
    var nombre = $('cli-new-nombre').value.trim(), zona = $('cli-new-zona').value.trim();
    if (!nombre) return;
    var id = 'cli-' + (slugify(nombre) || Date.now());
    $('cli-add-confirm').disabled = true;
    rpc('crm_crear', { p_codigo: codigo, p_id: id, p_data: { nombre: nombre, zona: zona, estado: 'sin_tocar', modulo: 'clinicas', anuncios: 'sin comprobar' } })
      .then(function (nuevo) { docs.push(nuevo); saveState[id] = { cls: 'ok', text: '✓ clínica creada' }; renderClinicas(); })
      .catch(function (e) { $('cli-add-err').textContent = e.message; $('cli-add-confirm').disabled = false; });
  }

  // ------------------------------------------------------------ guion
  function rowsToText(arr, a, b) { return (arr || []).map(function (r) { return (r[a] || '') + ' :: ' + (r[b] || ''); }).join('\n'); }
  function parseRows(t, a, b) {
    return String(t || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var i = l.indexOf('::'), o = {}; o[a] = (i < 0 ? l : l.slice(0, i)).trim(); o[b] = i < 0 ? '' : l.slice(i + 2).trim(); return o;
    });
  }

  // Sector en una línea para el editor: Sector :: Cómo reconocerlo :: dolor; dolor :: ayuda; ayuda :: Pregunta gancho :: Caso (opcional)
  function sectoresToText(arr) {
    return (arr || []).map(function (s) {
      return [s.sector, s.reconocer, (s.dolores || []).join('; '), (s.ayudas || []).join('; '), s.pregunta, s.caso].filter(function (x, i) { return i < 5 || x; }).map(function (x) { return x || ''; }).join(' :: ');
    }).join('\n');
  }
  function parseSectores(t) {
    var lista = function (x) { return String(x || '').split(';').map(function (y) { return y.trim(); }).filter(Boolean); };
    return String(t || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var p = l.split('::').map(function (x) { return x.trim(); });
      var s = { sector: p[0] || '', reconocer: p[1] || '', dolores: lista(p[2]), ayudas: lista(p[3]), pregunta: p[4] || '' };
      if (p[5]) s.caso = p[5];
      return s;
    });
  }
  function htmlSectores(d) {
    var li = function (arr) { return '<ul>' + (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
    var t = d.sectoresTransversal;
    return '<div class="g-section"><h2><span class="g-num">05</span>Dónde podemos ayudar según su sector</h2><p>' + esc(d.sectoresIntro) + '</p>' +
      (d.sectores || []).map(function (s) {
        return '<details class="msg"><summary>' + esc(s.sector) + '</summary><div class="msg-body">' +
          '<p><b>Cómo reconocerlo en «Qué venden»:</b> ' + esc(s.reconocer) + '</p>' +
          '<p><b>Lo que suele dolerles:</b></p>' + li(s.dolores) +
          '<p><b>Cómo les ayudamos</b> (para que lo entiendas; en la llamada no se vende):</p>' + li(s.ayudas) +
          (s.caso ? '<p><b>Caso real (sin nombres):</b> ' + esc(s.caso) + '</p>' : '') +
          '<div class="script-line">«' + esc(s.pregunta) + '»</div></div></details>';
      }).join('') +
      (t ? '<details class="msg"><summary>' + esc(t.titulo) + '</summary><div class="msg-body">' + li(t.dolores) +
        '<div class="script-line">«' + esc(t.pregunta) + '»</div></div></details>' : '') +
      '</div>';
  }

  function renderGuion() {
    var d = guion, c = $('guion-content'), btn = $('guion-edit-toggle');
    btn.classList.toggle('on', guionEdit);
    btn.textContent = guionEdit ? '✕ Salir sin guardar' : '✏️ Editar guion';
    if (guionEdit) {
      var f = function (id, l, v, r, h) { return '<div class="edit-field"><label for="' + id + '">' + l + '</label>' + (h ? '<p class="edit-hint">' + h + '</p>' : '') + '<textarea class="f" id="' + id + '" rows="' + r + '">' + esc(v) + '</textarea></div>'; };
      c.innerHTML = '<div class="g-section edit-panel">' +
        f('ed-apertura', '01 · Apertura', d.apertura, 2) + f('ed-frame', '02 · Frame', d.frame, 3) + f('ed-frameSenal', 'Nota — señal de frame perdido', d.frameSenal, 3) +
        f('ed-cuatroP', '03 · Las 4P', rowsToText(d.cuatroP, 'p', 'que'), 5, 'Una fila por línea — Nombre :: Descripción') +
        f('ed-preguntas', '04 · Preguntas de cualificación', (d.preguntas || []).join('\n'), 4, 'Una pregunta por línea') +
        f('ed-preguntasNota', 'Nota tras las preguntas', d.preguntasNota, 2) +
        f('ed-sectores', '05 · Según su sector', sectoresToText(d.sectores), 10, 'Un sector por línea — Sector :: Cómo reconocerlo :: dolor; dolor :: ayuda; ayuda :: Pregunta gancho :: Caso (opcional)') +
        f('ed-objeciones', '06 · Objeciones', rowsToText(d.objeciones, 'objecion', 'respuesta'), 6, 'Objeción :: Respuesta') +
        f('ed-cierre', '07 · Cierre', d.cierre, 3) + f('ed-cierreNota', 'Nota de cierre', d.cierreNota, 2) +
        f('ed-mensajes', '08 · Mensajes de respaldo', rowsToText(d.mensajes, 'titulo', 'texto'), 8, 'Título :: Texto') +
        f('ed-cadencia', 'Cadencia / meta', d.cadencia, 2) +
        '<div class="edit-actions"><button class="touch-btn" id="guion-save" type="button">💾 Guardar cambios</button><span class="save-state" id="guion-state"></span></div></div>';
      $('guion-save').onclick = function () {
        var v = function (id) { return $(id).value.trim(); };
        var nuevo = { apertura: v('ed-apertura'), frame: v('ed-frame'), frameSenal: v('ed-frameSenal'),
          cuatroP: parseRows(v('ed-cuatroP'), 'p', 'que'), preguntas: v('ed-preguntas').split('\n').map(function (x) { return x.trim(); }).filter(Boolean),
          preguntasNota: v('ed-preguntasNota'), sectores: parseSectores(v('ed-sectores')),
          sectoresIntro: d.sectoresIntro, sectoresTransversal: d.sectoresTransversal,
          objeciones: parseRows(v('ed-objeciones'), 'objecion', 'respuesta'),
          cierre: v('ed-cierre'), cierreNota: v('ed-cierreNota'), mensajes: parseRows(v('ed-mensajes'), 'titulo', 'texto'), cadencia: v('ed-cadencia') };
        $('guion-save').disabled = true; $('guion-state').className = 'save-state pending'; $('guion-state').textContent = 'guardando…';
        rpc('crm_guardar_guion', { p_codigo: codigo, p_data: nuevo }).then(function () {
          guion = nuevo; guionEdit = false; renderGuion(); $('guion-sync').textContent = '✓ guion guardado ' + hora();
        }).catch(function (e) {
          $('guion-save').disabled = false; $('guion-state').className = 'save-state err'; $('guion-state').textContent = '✗ ' + e.message;
        });
      };
      return;
    }
    var tr = function (a, b) { return '<tr><td><b>' + esc(a) + '</b></td><td>' + esc(b) + '</td></tr>'; };
    c.innerHTML =
      '<div class="g-section"><h2><span class="g-num">01</span>Apertura — 15 segundos</h2><p>Corta y directa. No pidas permiso para llamar, dalo por hecho y pasa al frame enseguida.</p><div class="script-line">«' + esc(d.apertura) + '»</div></div>' +
      '<div class="g-section"><h2><span class="g-num">02</span>Frame — marca el marco antes de preguntar nada</h2><div class="script-line">«' + esc(d.frame) + '»</div><p>' + esc(d.frameSenal) + '</p></div>' +
      '<div class="g-section"><h2><span class="g-num">03</span>Las 4 P del toque (sin precio)</h2><div class="table-wrap"><table class="g-table"><thead><tr><th>P</th><th>Qué es</th></tr></thead><tbody>' +
        (d.cuatroP || []).map(function (r) { return tr(r.p, r.que); }).join('') + '</tbody></table></div></div>' +
      '<div class="g-section"><h2><span class="g-num">04</span>Preguntas de cualificación</h2><ul>' +
        (d.preguntas || []).map(function (q) { return '<li>«' + esc(q) + '»</li>'; }).join('') + '</ul><p>' + esc(d.preguntasNota) + '</p></div>' +
      htmlSectores(d) +
      '<div class="g-section"><h2><span class="g-num">06</span>Objeciones — nunca afirmar, siempre preguntar</h2><div class="table-wrap"><table class="g-table"><thead><tr><th>Objeción</th><th>Qué decir</th></tr></thead><tbody>' +
        (d.objeciones || []).map(function (o) { return tr('«' + o.objecion + '»', o.respuesta); }).join('') + '</tbody></table></div></div>' +
      '<div class="g-section"><h2><span class="g-num">07</span>Cierre de Janice — agendar, no vender</h2><div class="script-line">«' + esc(d.cierre) + '»</div><p>' + esc(d.cierreNota) + '</p></div>' +
      '<div class="g-section"><h2><span class="g-num">08</span>Mensajes de respaldo</h2><p>Personaliza el corchete antes de enviar — nunca copiar-pegar tal cual.</p>' +
        (d.mensajes || []).map(function (m, i) { return '<details class="msg"><summary>' + esc(m.titulo) + ' <span class="copy-btn" data-msg="' + i + '">copiar</span></summary><div class="msg-body"><p>' + esc(m.texto) + '</p></div></details>'; }).join('') +
        '<p style="margin-top:12px;"><b>Cadencia:</b> ' + esc(d.cadencia) + '</p></div>';
    c.querySelectorAll('[data-msg]').forEach(function (b) {
      b.onclick = function (e) {
        e.preventDefault();
        var t = (guion.mensajes || [])[+b.getAttribute('data-msg')] || {};
        navigator.clipboard.writeText(t.texto || '').then(function () {
          b.textContent = 'copiado'; b.classList.add('done');
          setTimeout(function () { b.textContent = 'copiar'; b.classList.remove('done'); }, 1500);
        });
      };
    });
  }
  $('guion-edit-toggle').onclick = function () { guionEdit = !guionEdit; renderGuion(); };

  // ------------------------------------------------------------ actividad (solo admin)
  function cargarActividad() {
    $('actividad-list').innerHTML = '<p class="g-toolbar-hint">cargando…</p>';
    rpc('crm_actividad', { p_codigo: codigo, p_limite: 300 }).then(function (rows) {
      var nombre = {}; docs.forEach(function (d) { nombre[d.id] = d.nombre; });
      $('actividad-list').innerHTML = rows.length ? '<div class="table-wrap"><table class="g-table"><thead><tr><th>Cuándo</th><th>Quién</th><th>Empresa</th><th>Qué cambió</th><th>Antes</th><th>Después</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var dt = new Date(r.ts);
          return '<tr><td class="mono">' + dt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ' ' + hora(dt) + '</td><td>' + esc(r.usuario) + '</td><td>' +
            esc(nombre[r.empresa_id] || r.empresa_id || '—') + '</td><td>' + esc(r.campo) + '</td><td class="muted">' + esc(r.antes || '') + '</td><td>' + esc(r.despues || '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p>Todavía no hay actividad registrada.</p>';
    }).catch(function (e) { $('actividad-list').innerHTML = '<p class="save-state err">' + esc(e.message) + '</p>'; });
  }
  $('actividad-refresh').onclick = cargarActividad;

  // ------------------------------------------------------------ pestañas + salida
  var TABS = ['pipeline', 'clinicas', 'guion', 'actividad'];
  function showTab(w) {
    TABS.forEach(function (t) {
      $('view-' + t).hidden = t !== w;
      $('tab-btn-' + t).classList.toggle('active', t === w);
      $('tab-btn-' + t).setAttribute('aria-selected', t === w);
    });
    if (w === 'actividad') cargarActividad();
  }
  TABS.forEach(function (t) { $('tab-btn-' + t).onclick = function () { showTab(t); }; });

  window.addEventListener('beforeunload', function (e) {
    if (Object.keys(saving).length) { e.preventDefault(); e.returnValue = ''; }
  });

  $('today').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  renderGuion(); renderCliCabecera();   // la cabecera de Clínicas es fija: se pinta una vez
  var guardado = null;
  try { guardado = localStorage.getItem(LS_KEY); } catch (e) {}
  if (guardado) entrar(guardado); else $('login').hidden = false;
})();
