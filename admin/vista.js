/* Vista previa del panel de Retro Green.

   Muestra la web de verdad al lado del panel, ya puesta en la parte que se está
   editando, y va copiando en vivo lo que se escribe.

   En la compu va a la derecha. En el celular va abajo, como una ventanita que
   se puede agrandar, achicar y cerrar: el panel se achica exactamente lo mismo
   que mide la ventanita, así que los campos nunca quedan tapados. */

(() => {
  'use strict';

  const raiz = document.documentElement;
  const VISTA = document.getElementById('vista');
  const MARCO = document.getElementById('vista-web');
  if (!VISTA || !MARCO) return;

  const ABRIR = document.getElementById('vista-abrir');
  const TITULO = document.getElementById('vista-titulo');
  const NOMBRE = document.getElementById('vista-nombre');
  const LISTA = document.getElementById('vista-secciones');
  const PIE = document.getElementById('vista-pie');
  const AGARRE = document.getElementById('vista-agarre');
  const RECARGAR = document.getElementById('vista-recargar');
  const TAMANO = document.getElementById('vista-tamano');
  const CERRAR = document.getElementById('vista-cerrar');

  const PIE_NORMAL = 'Los textos se ven al escribir; las fotos y las listas, al guardar.';

  // Cada pantalla del panel: a qué parte de la página mirar.
  const PANTALLAS = {
    secciones: [null, 'Todas las partes'],
    contacto: ['ubicacion', 'Teléfono y ubicación'],
    fotos: ['hero', 'Fotos principales'],
    galeria: ['galeria', 'Galería del salón'],
    horarios: ['ubicacion', 'Horarios'],
  };

  // Cada grupo de "Textos de la página": cómo se llama, su tabla de campos,
  // qué sección mira y el nombre que se muestra arriba de la vista.
  const GRUPOS = [
    ['título y descripción', 'seo', 'hero', 'Título en Google'],
    ['nombre del salón', 'marca', 'hero', 'Nombre del salón'],
    ['menú de arriba', 'encabezado', 'hero', 'Menú de arriba'],
    ['portada', 'hero', 'hero', 'Portada'],
    ['más que una peluquería', 'nosotros', 'nosotros', 'Más que una experiencia'],
    ['nuestros servicios', 'servicios', 'servicios', 'Nuestros servicios'],
    ['“historia”', 'historia', 'historia', 'Historia'],
    ['no es solo un corte', 'experiencia', 'experiencia', 'No es solo un corte'],
    ['juegos y películas', 'clasicos', 'clasicos', 'Juegos y películas'],
    ['de la galería', 'galeria', 'galeria', 'Galería'],
    ['ubicación, horarios', 'ubicacion', 'ubicacion', 'Ubicación y contacto'],
    ['sacamos turno', 'contacto', 'contacto', 'Botones del final'],
    ['pie de página', 'pie', null, 'Pie de página'],
  ];

  // Cómo se llama cada parte de la página en la lista de "Ir a…".
  const NOMBRES = {
    hero: 'Portada',
    nosotros: 'Más que una experiencia',
    servicios: 'Nuestros servicios',
    historia: 'Historia',
    experiencia: 'No es solo un corte',
    clasicos: 'Juegos y películas',
    galeria: 'Galería del salón',
    ubicacion: 'Ubicación, horarios y contacto',
    contacto: '¿Sacamos turno?',
  };

  // Para reconocer de qué parte habla cada fila de "Secciones de la página".
  // Gana la coincidencia más larga: "Ubicación, horarios y contacto" es ubicacion.
  const PISTAS = [
    ['hero', ['hero', 'portada']],
    ['nosotros', ['nosotros', 'más que una experiencia', 'mas que una experiencia']],
    ['servicios', ['servicios']],
    ['historia', ['historia']],
    ['experiencia', ['experiencia', 'no es solo un corte']],
    ['clasicos', ['clasicos', 'clásicos', 'juegos y películas', 'juegos y peliculas']],
    ['galeria', ['galeria', 'galería']],
    ['ubicacion', ['ubicacion', 'ubicación']],
    ['contacto', ['contacto', 'sacamos turno']],
  ];

  const MAPA = window.MAPA_CAMPOS || {};
  const guardar = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
  const leer = k => { try { return localStorage.getItem(k); } catch { return null; } };

  const esChico = () => matchMedia('(max-width: 1100px)').matches;
  const doc = () => { try { return MARCO.contentDocument; } catch { return null; } };
  const ventana = () => { try { return MARCO.contentWindow; } catch { return null; } };

  let abierta = leer('vista-cerrada') !== '1';
  let parte = Number(leer('vista-alto')) || 0.42;   // cuánto de la pantalla ocupa en el celular
  let teclado = 0;                                   // alto del teclado del celular
  let seguro = 0;                                    // borde de abajo de los celulares con muesca
  let grupo = null;                                  // grupo de textos abierto
  let pantalla = null;                               // pantalla del panel abierta
  let miradaEn = null;                               // parte de la página que se está mirando
  let destino = null;                                // último salto pedido por el panel
  let ultimaClave = null;
  let avisoReloj = null;

  /* ---------- Medidas ---------- */

  const TAMANOS = [0.3, 0.45, 0.68];

  const disponible = () => Math.max(260, (window.innerHeight || 640) - teclado);
  const altoPx = () => {
    const hueco = disponible();
    return Math.round(Math.min(Math.max(parte * hueco, 150), hueco * 0.78));
  };

  const medirSeguro = () => {
    try {
      const probeta = document.createElement('div');
      probeta.style.cssText = 'position:fixed;left:-9999px;bottom:0;width:1px;height:env(safe-area-inset-bottom,0px)';
      document.body.appendChild(probeta);
      const h = probeta.offsetHeight || 0;
      probeta.remove();
      return h;
    } catch { return 0; }
  };

  const medirTeclado = () => {
    const vv = window.visualViewport;
    if (!vv || !esChico()) return 0;
    const tapado = Math.round((window.innerHeight || 0) - vv.height - vv.offsetTop);
    // Menos que eso es la barra del navegador que se esconde, no el teclado.
    return tapado > 120 ? tapado : 0;
  };

  /* ---------- Acomodar el panel para que no quede tapado ---------- */

  const puestos = new WeakMap();
  const propios = new Set([VISTA, ABRIR]);

  // Se pone como "important" para que ninguna regla del panel pueda ganarle:
  // el lugar que le dejamos a la vista previa no se negocia.
  const poner = (el, prop, valor) => {
    if (valor) el.style.setProperty(prop, valor, 'important');
    else el.style.removeProperty(prop);
  };

  const ajustar = (el, ancho, derecha, alto) => {
    const firma = ancho + '|' + derecha + '|' + alto;
    if (puestos.get(el) === firma) return;
    puestos.set(el, firma);
    poner(el, 'width', ancho);
    poner(el, 'right', derecha);
    poner(el, 'height', alto);
    poner(el, 'max-height', alto);
    // El alto que le damos tiene que ser el de afuera: si no, un panel con
    // márgenes internos queda más alto de lo pedido y se mete abajo de la vista.
    poner(el, 'box-sizing', ancho || alto ? 'border-box' : '');
  };

  const acomodar = () => {
    const chico = esChico();
    const alto = altoPx();
    raiz.style.setProperty('--alto-vista', alto + 'px');
    raiz.style.setProperty('--teclado', teclado + 'px');
    raiz.style.setProperty('--vista-seguro', seguro + 'px');
    raiz.style.setProperty('--alto-pantalla', (window.innerHeight || 640) + 'px');

    VISTA.classList.toggle('se-ve', abierta);
    if (ABRIR) ABRIR.classList.toggle('se-ve', !abierta);
    if (!abierta) cerrarLista();

    // Cuánto lugar le queda al panel: se mide dónde empieza la ventanita en vez
    // de calcularlo. Los navegadores del celular cuentan el alto de la pantalla
    // de dos maneras distintas (por la barra de arriba que aparece y desaparece),
    // y con una cuenta el panel quedaba unos pixeles por debajo de la ventanita.
    const tope = abierta && chico ? Math.max(140, Math.round(VISTA.getBoundingClientRect().top)) : 0;

    // El panel de Sveltia se corre (compu) o se achica (celular) para dejarle
    // el lugar a la vista previa. Nunca la vista previa tapa los campos.
    for (const el of document.body.children) {
      if (propios.has(el) || el.tagName === 'SCRIPT' || el.tagName === 'LINK' || el.tagName === 'STYLE') continue;
      if (!abierta) ajustar(el, '', '', '');
      else if (chico) ajustar(el, '', '', tope + 'px');
      else ajustar(el, 'calc(100% - var(--ancho-vista))', getComputedStyle(el).position === 'fixed' ? 'var(--ancho-vista)' : '', '');
    }
  };

  const fijarParte = valor => {
    parte = Math.min(Math.max(valor, 0.2), 0.78);
    acomodar();
  };

  /* ---------- Moverse por la página de adentro ---------- */

  const ESTILO = `
    .vista-marca { animation: vista-marca 1.4s ease-out; border-radius: 3px; }
    @keyframes vista-marca {
      0%, 55% { box-shadow: 0 0 0 3px #22c55e, 0 0 0 10px rgba(34, 197, 94, .28); }
      100% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0), 0 0 0 10px rgba(34, 197, 94, 0); }
    }
    .vista-parte { outline: 2px dashed rgba(34, 197, 94, .7); outline-offset: -6px; animation: vista-parte 2s ease-out forwards; }
    @keyframes vista-parte { to { outline-color: rgba(34, 197, 94, 0); } }`;

  const prepararMarco = () => {
    const d = doc();
    if (!d || !d.head || d.getElementById('vista-estilo')) return;
    const s = d.createElement('style');
    s.id = 'vista-estilo';
    s.textContent = ESTILO;
    d.head.appendChild(s);
  };

  const marcar = (el, clase) => {
    if (!el) return;
    prepararMarco();
    el.classList.remove(clase);
    void el.offsetWidth;   // para que la animación vuelva a empezar
    el.classList.add(clase);
    setTimeout(() => el.classList.remove(clase), 2200);
  };

  const irAY = y => {
    const w = ventana();
    if (!w) return;
    try { w.scrollTo({ top: Math.max(0, Math.round(y)), behavior: 'smooth' }); }
    catch { try { w.scrollTo(0, Math.max(0, Math.round(y))); } catch {} }
  };

  // Las fotos se cargan de a poco y corren la página para abajo mientras se va
  // llegando: por eso el salto se revisa unas cuantas veces y se corrige solo.
  const REPASOS = [350, 500, 700, 1000];
  let repaso = 0;

  const irAElemento = (el, centrado) => {
    const w = ventana();
    if (!el || !w) return;
    const mio = ++repaso;
    const ubicar = paso => {
      if (mio !== repaso) return;   // ya se pidió otro salto: este queda viejo
      const caja = el.getBoundingClientRect();
      const alto = MARCO.clientHeight || 500;
      const margen = centrado ? Math.max(70, alto / 2 - caja.height / 2) : 70;
      const falta = caja.top - margen;
      if (Math.abs(falta) > 24) irAY((w.scrollY || 0) + falta);
      if (paso < REPASOS.length) setTimeout(() => ubicar(paso + 1), REPASOS[paso]);
    };
    ubicar(0);
  };

  const irA = seccion => {
    const d = doc();
    if (!d || !d.body) return;
    miradaEn = seccion || null;
    if (seccion === '__pie__') {
      const pie = d.querySelector('body > footer');
      if (pie) { irAElemento(pie, false); marcar(pie, 'vista-parte'); }
      return;
    }
    const el = seccion && d.getElementById(seccion);
    if (!el) { irAY(0); return; }
    if (el.hidden) { avisar('Esa parte está apagada en «Secciones de la página».'); return; }
    irAElemento(el, false);
    marcar(el, 'vista-parte');
  };

  const aLaVista = el => {
    const caja = el.getBoundingClientRect();
    const alto = MARCO.clientHeight || 500;
    return caja.top >= 60 && caja.bottom <= alto - 8;
  };

  /* ---------- Avisos del pie ---------- */

  const avisar = (texto, tono) => {
    if (!PIE) return;
    clearTimeout(avisoReloj);
    PIE.textContent = texto;
    PIE.classList.toggle('aviso', tono === 'bien');
    avisoReloj = setTimeout(() => {
      PIE.textContent = PIE_NORMAL;
      PIE.classList.remove('aviso');
    }, tono === 'bien' ? 12000 : 5000);
  };

  /* ---------- La lista de "Ir a…" ---------- */

  const cerrarLista = () => {
    if (!LISTA) return;
    LISTA.hidden = true;
    VISTA.dataset.lista = 'no';
    if (TITULO) TITULO.setAttribute('aria-expanded', 'false');
  };

  const armarLista = () => {
    const d = doc();
    if (!LISTA || !d || !d.body) return;
    LISTA.textContent = '';
    const partes = [...d.querySelectorAll('body > section[id]')];
    if (d.querySelector('body > footer')) partes.push({ id: '__pie__', hidden: false, pie: true });

    for (const s of partes) {
      const titulo = s.pie
        ? 'Pie de página'
        : NOMBRES[s.id] || (s.querySelector('h2')?.textContent || 'Sección nueva').trim().slice(0, 38) || 'Sección nueva';
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.ir = s.id;
      if (s.hidden) b.classList.add('apagada');
      if (s.id === miradaEn) b.setAttribute('aria-current', 'true');
      const t = document.createElement('span');
      t.textContent = titulo;
      b.appendChild(t);
      if (s.hidden) {
        const m = document.createElement('span');
        m.className = 'marca';
        m.textContent = 'apagada';
        b.appendChild(m);
      }
      LISTA.appendChild(b);
    }
  };

  /* ---------- Qué se está editando ---------- */

  const actualizar = (saltar) => {
    const m = location.hash.match(/entries\/([^/?#]+)/);
    const p = m && (PANTALLAS[m[1]] || m[1] === 'textos') ? m[1] : null;
    if (p !== pantalla) { pantalla = p; if (p !== 'textos') grupo = null; }

    let seccion = null;
    let nombre = 'Vista previa';
    if (pantalla === 'textos' && grupo) { seccion = grupo[2]; nombre = grupo[3]; }
    else if (pantalla && PANTALLAS[pantalla]) { seccion = PANTALLAS[pantalla][0]; nombre = PANTALLAS[pantalla][1]; }
    else if (pantalla === 'textos') nombre = 'Textos de la página';
    if (NOMBRE) NOMBRE.textContent = nombre;

    acomodar();
    // Se salta solo cuando el panel pasó a otra parte: si no, el reloj estaría
    // moviendo la vista cada vuelta mientras el dueño la mueve con el dedo.
    const pedido = nombre + '|' + seccion;
    if (pedido !== destino) {
      destino = pedido;
      if (abierta && !saltar) { ultimaClave = null; irA(seccion); }
    }
  };

  /* ---------- Lo que se escribe, al toque en la vista ---------- */

  // El panel no pone el nombre en el campo sino en el recuadro que lo envuelve,
  // con la forma: Campo “Frase principal”.
  const etiquetaDe = n => {
    const a = n && n.getAttribute && n.getAttribute('aria-label');
    if (!a) return '';
    const m = a.match(/[“"']([\s\S]+)[”"']/);
    return (m ? m[1] : a).replace(/[⁦-⁩]/g, '').trim();
  };

  // De un campo del panel al texto de la página que le corresponde.
  const resolver = camino => {
    for (const n of camino) {
      const t = etiquetaDe(n).toLowerCase();
      if (!t) continue;
      const g = GRUPOS.find(x => t.includes(x[0]));
      if (g) { if (g !== grupo) { grupo = g; actualizar(true); } break; }
    }
    const donde = pantalla === 'contacto' ? '__contacto__' : (grupo ? grupo[1] : null);
    const tabla = donde && MAPA[donde];
    if (!tabla) return null;
    for (const n of camino) {
      const et = etiquetaDe(n);
      if (et && tabla[et]) return tabla[et];
    }
    return null;
  };

  let marcaReloj = null;
  const mostrarCambio = clave => {
    const d = doc();
    if (!d) return;
    const todos = [...d.querySelectorAll('[data-texto="' + clave.replace(/"/g, '\\"') + '"]')];
    const el = todos.find(x => x.offsetParent !== null);
    if (!el) {
      if (todos.length) avisar('Ese texto está en una parte apagada: prendela en «Secciones de la página».');
      return;
    }
    const nuevo = clave !== ultimaClave;
    ultimaClave = clave;
    miradaEn = (el.closest('section[id]') || {}).id || miradaEn;
    clearTimeout(marcaReloj);
    marcaReloj = setTimeout(() => {
      if (nuevo || !aLaVista(el)) irAElemento(el, true);
      marcar(el, 'vista-marca');
    }, nuevo ? 0 : 220);
  };

  // Si el campo se deja vacío, la página se queda con el texto que ya tenía:
  // lo mismo que hace el sitio de verdad al guardar.
  const antes = new WeakMap();
  const escribir = (clave, valor) => {
    const d = doc();
    if (!d) return;
    const limpio = valor.trim();
    d.querySelectorAll('[data-texto="' + clave.replace(/"/g, '\\"') + '"]').forEach(el => {
      if (!antes.has(el)) antes.set(el, el.textContent);
      el.textContent = limpio ? valor : antes.get(el);
    });
    if (clave === 'seo.titulo' && limpio) d.title = valor;
  };

  document.addEventListener('input', e => {
    const camino = (e.composedPath && e.composedPath()) || [e.target];
    const campo = camino.find(n => n && typeof n.value === 'string');
    if (!campo) return;
    const clave = resolver(camino);
    if (!clave) return;
    escribir(clave, campo.value);
    if (abierta) mostrarCambio(clave);
  }, true);

  // Con solo tocar un campo, la vista se va a ese texto. Así se ve en qué
  // parte de la página se está trabajando antes de escribir nada.
  document.addEventListener('focusin', e => {
    if (!abierta) return;
    const camino = (e.composedPath && e.composedPath()) || [e.target];
    if (!camino.some(n => n && typeof n.value === 'string')) return;
    const clave = resolver(camino);
    if (clave) mostrarCambio(clave);
  }, true);

  /* ---------- Prender y apagar partes, en vivo ---------- */

  const seccionDeFila = nodo => {
    let el = nodo;
    for (let i = 0; el && i < 9; i++, el = el.parentElement) {
      const suelto = el.querySelector && el.querySelector('select');
      if (suelto && NOMBRES[suelto.value]) return suelto.value;
      const texto = (el.textContent || '').toLowerCase();
      if (!texto || texto.length > 400) continue;
      let mejor = null;
      for (const [id, pistas] of PISTAS) {
        for (const p of pistas) {
          if (texto.includes(p) && (!mejor || p.length > mejor[1])) mejor = [id, p.length];
        }
      }
      if (mejor) return mejor[0];
    }
    return null;
  };

  const verInterruptores = camino => {
    if (pantalla !== 'secciones') return;
    const control = camino.find(n => n && (n.type === 'checkbox' || (n.getAttribute && n.getAttribute('role') === 'switch')));
    if (!control) return;
    const id = seccionDeFila(control);
    if (!id) return;
    // Sveltia cambia el estado después del toque: se lee un instante más tarde.
    setTimeout(() => {
      const d = doc();
      if (!d) return;
      const prendida = control.type === 'checkbox' ? control.checked : control.getAttribute('aria-checked') === 'true';
      const el = d.getElementById(id);
      if (!el) return;
      el.hidden = !prendida;
      d.querySelectorAll('a[href="#' + id + '"]:not([data-fijo])').forEach(a => { (a.closest('li') || a).hidden = !prendida; });
      if (prendida) { irA(id); } else { avisar('«' + (NOMBRES[id] || id) + '» quedó apagada.'); armarLista(); }
    }, 60);
  };

  /* ---------- Toques en el panel ---------- */

  // Después de guardar, la web publicada tarda un ratito: se avisa y se enciende el ⟳.
  const avisarGuardado = camino => {
    const boton = camino.find(n => n && n.tagName === 'BUTTON');
    if (!boton) return;
    const texto = ((boton.textContent || '') + ' ' + (boton.getAttribute('aria-label') || '')).toLowerCase();
    if (!/guardar|save|publicar|publish/.test(texto)) return;
    if (RECARGAR) RECARGAR.classList.add('hay-cambios');
    avisar('Guardado. Tocá ⟳ para ver la web con los cambios (si ya está publicada, tarda 1 o 2 minutos).', 'bien');
  };

  document.addEventListener('click', e => {
    const camino = (e.composedPath && e.composedPath()) || [e.target];
    if (camino.includes(VISTA) || camino.includes(ABRIR)) {
      // Tocar la vista, pero fuera de la lista, también la cierra.
      if (LISTA && !LISTA.hidden && !camino.includes(LISTA) && !camino.includes(TITULO)) cerrarLista();
      return;
    }
    cerrarLista();   // tocar el panel cierra la lista de partes

    verInterruptores(camino);
    avisarGuardado(camino);

    // Al tocar el título de un grupo, la vista se mueve a esa parte.
    for (const nodo of camino) {
      const t = (nodo && nodo.textContent || '').trim().toLowerCase();
      if (!t || t.length > 70) continue;
      const g = GRUPOS.find(x => t.includes(x[0]));
      if (g) { grupo = g; ultimaClave = null; actualizar(); return; }
    }
  }, true);

  /* ---------- Botones de la vista ---------- */

  const abrirCerrar = valor => {
    abierta = valor;
    guardar('vista-cerrada', valor ? null : '1');
    ultimaClave = null;
    destino = null;
    actualizar();
  };

  CERRAR?.addEventListener('click', () => abrirCerrar(false));
  ABRIR?.addEventListener('click', () => abrirCerrar(true));

  RECARGAR?.addEventListener('click', () => {
    RECARGAR.classList.remove('hay-cambios');
    ultimaClave = null;
    MARCO.src = '../index.html?v=' + Date.now();
    avisar('Volviendo a cargar la página…');
  });

  TAMANO?.addEventListener('click', () => {
    // Salta al siguiente tamaño que se note de verdad; después vuelve al más chico.
    const siguiente = TAMANOS.find(t => t > parte + 0.06) ?? TAMANOS[0];
    fijarParte(siguiente);
    guardar('vista-alto', String(parte));
  });

  TITULO?.addEventListener('click', () => {
    if (!LISTA) return;
    if (LISTA.hidden) { armarLista(); LISTA.hidden = false; VISTA.dataset.lista = 'si'; TITULO.setAttribute('aria-expanded', 'true'); }
    else cerrarLista();
  });

  LISTA?.addEventListener('click', e => {
    const b = e.target.closest('button[data-ir]');
    if (!b) return;
    cerrarLista();
    irA(b.dataset.ir);
    armarLista();
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarLista(); });

  /* ---------- Arrastrar la rayita para agrandar o achicar ---------- */

  let arrastre = null;
  AGARRE?.addEventListener('pointerdown', e => {
    if (!esChico()) return;
    arrastre = { y: e.clientY, alto: altoPx() };
    VISTA.classList.add('moviendo');
    try { AGARRE.setPointerCapture(e.pointerId); } catch {}
  });
  AGARRE?.addEventListener('pointermove', e => {
    if (!arrastre) return;
    e.preventDefault();
    fijarParte((arrastre.alto + (arrastre.y - e.clientY)) / disponible());
  });
  const soltar = () => {
    if (!arrastre) return;
    arrastre = null;
    VISTA.classList.remove('moviendo');
    guardar('vista-alto', String(parte));
  };
  AGARRE?.addEventListener('pointerup', soltar);
  AGARRE?.addEventListener('pointercancel', soltar);

  /* ---------- El teclado del celular ---------- */

  const revisarTeclado = () => {
    const t = medirTeclado();
    if (t === teclado) return;
    teclado = t;
    acomodar();
  };

  if (window.visualViewport) {
    visualViewport.addEventListener('resize', revisarTeclado);
    visualViewport.addEventListener('scroll', revisarTeclado);
  }
  addEventListener('resize', () => { seguro = medirSeguro(); revisarTeclado(); acomodar(); });
  addEventListener('orientationchange', () => setTimeout(() => { seguro = medirSeguro(); acomodar(); }, 300));

  /* ---------- Arranque ---------- */

  addEventListener('hashchange', () => actualizar());
  MARCO.addEventListener('load', () => {
    prepararMarco();
    miradaEn = null;
    setTimeout(() => { armarLista(); actualizar(); }, 800);
  });
  setInterval(() => actualizar(), 1500);

  seguro = medirSeguro();
  teclado = medirTeclado();
  if (PIE) PIE.textContent = PIE_NORMAL;
  actualizar();
})();
