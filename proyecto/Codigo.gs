/**
 * Portal Mapa de Procesos · Salfa Montajes
 * Aplicación web de Google Apps Script.
 *
 * Despliegue: Implementar > Nueva implementación > Aplicación web
 *   Ejecutar como: Yo (cuenta propietaria del portal)
 *   Quién tiene acceso: Cualquier usuario de salfamontajes.com
 *
 * Primera vez: ejecutar la función instalar() desde el editor.
 */

// Carpeta "01 Mapa de Procesos" dentro de "Portales Salfa" (Mi unidad de sjroca@salfamontajes.com).
// Si esta carpeta no es accesible para la cuenta que instala (por ejemplo, en una prueba con
// una cuenta personal), instalar() crea "Portales Salfa / 01 Mapa de Procesos" en su Mi unidad.
var CARPETA_PORTAL_ID = '1i3ZmsS5yxoHqxdefhn2GGHwxUQ8R14mA';

var PERFILES = ['Visualizador', 'Colaborador', 'Editor', 'Revisor', 'Aprobador', 'Administrador'];

var PERMISOS = {
  Visualizador:  {ver: true},
  Colaborador:   {ver: true, borradores: true, editar: true, proponer: true},
  Editor:        {ver: true, borradores: true, editar: true, proponer: true, guardar: true, enviar: true, restaurar: true, imagenDrive: true},
  Revisor:       {ver: true, borradores: true, revisar: true},
  Aprobador:     {ver: true, borradores: true, revisar: true, aprobar: true},
  Administrador: {ver: true, borradores: true, editar: true, proponer: true, guardar: true, enviar: true, restaurar: true, imagenDrive: true, revisar: true, aprobar: true, admin: true}
};

var ESTADOS = {
  propuesta: 'Propuesta', borrador: 'Borrador', en_revision: 'En revisión', validado: 'Validado',
  devuelto: 'Devuelto', aprobado: 'Aprobado', reemplazado: 'Reemplazado', obsoleto: 'Obsoleto'
};

var HOJAS = {
  Config: ['Clave', 'Valor', 'Descripción'],
  Accesos: ['Correo', 'Nombre', 'Área', 'Perfil', 'Vigente', 'Alta', 'Alta por', 'Nota'],
  Versiones: ['ID', 'Revisión', 'Iteración', 'Etiqueta', 'Estado', 'Autor', 'Fecha', 'Comentario', 'Origen', 'ArchivoId', 'Revisó', 'Fecha revisión', 'Aprobó', 'Fecha aprobación', 'Observaciones'],
  Bitacora: ['Fecha', 'Correo', 'Acción', 'Detalle'],
  Solicitudes: ['Fecha', 'Correo', 'Área', 'Motivo', 'Estado', 'Resuelto por', 'Fecha resolución']
};

var CONFIG_INICIAL = [
  ['PORTAL_NOMBRE', 'Mapa de Procesos Salfa Montajes', 'Nombre que aparece en la portada'],
  ['DOCUMENTO', '10000000-SAL-O4000-PRO-MAP-00001', 'Código del documento'],
  ['REV_VIGENTE', 'B', 'Letra de la revisión aprobada vigente (la actualiza el portal)'],
  ['VERSION_VIGENTE_ID', 'V0001', 'ID de la versión aprobada vigente (la actualiza el portal)'],
  ['DOMINIO', 'salfamontajes.com', 'Dominio de correo permitido'],
  ['PRUEBA_PERFIL', '', 'Solo pruebas: perfil que simula la cuenta dueña (vacío = Administrador real)'],
  ['ACCESO_POR_DEFECTO', 'ninguno', 'Perfil de quien no está en Accesos: ninguno o Visualizador'],
  ['SEGREGACION', 'SI', 'SI: quien editó una versión no puede aprobarla'],
  ['AVISOS_CORREO', 'SI', 'SI: envía avisos por correo en el flujo de aprobación'],
  ['AVISO_APROBACION_A_TODOS', 'NO', 'SI: al aprobar, avisa a todas las personas con acceso vigente'],
  ['CORREO_EXTERNO', 'NO', 'SI: permite enviar el mapa por correo a direcciones fuera del dominio'],
  ['GEM_URL', '', 'Enlace del Gem compartido de Gemini (vía B de IA)'],
  ['IA_ACTIVA', 'NO', 'SI: activa el asistente dentro de la página con Gemini en Vertex AI (vía A)'],
  ['IA_PROYECTO', '', 'ID del proyecto de Google Cloud con Vertex AI y facturación'],
  ['IA_REGION', 'us-central1', 'Región de Vertex AI'],
  ['IA_MODELO_RAPIDO', 'gemini-2.5-flash', 'Modelo rápido'],
  ['IA_MODELO_AVANZADO', 'gemini-2.5-pro', 'Modelo avanzado'],
  ['IA_LIMITE_DIARIO', '30', 'Consultas de IA por persona y día']
];

/* =====================================================================
 * Instalación
 * ===================================================================== */

function instalar() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('SS_ID')) {
    Logger.log('El portal ya estaba instalado. Planilla: ' + SpreadsheetApp.openById(props.getProperty('SS_ID')).getUrl());
    return;
  }
  var raiz;
  try { raiz = DriveApp.getFolderById(CARPETA_PORTAL_ID); raiz.getName(); }
  catch (e) {
    var it = DriveApp.getRootFolder().getFoldersByName('Portales Salfa');
    var portales = it.hasNext() ? it.next() : DriveApp.getRootFolder().createFolder('Portales Salfa');
    raiz = subcarpeta_(portales, '01 Mapa de Procesos');
    Logger.log('La carpeta configurada no es accesible para esta cuenta. Se usa: ' + raiz.getUrl());
  }
  var datos = subcarpeta_(raiz, 'Datos');
  var versiones = subcarpeta_(raiz, 'Versiones');
  var publicadas = subcarpeta_(raiz, 'Publicadas');
  subcarpeta_(versiones, 'Rev B');

  var ss = SpreadsheetApp.create('Portal Mapa de Procesos · Datos');
  DriveApp.getFileById(ss.getId()).moveTo(datos);
  Object.keys(HOJAS).forEach(function (nombre, i) {
    var h = i === 0 ? ss.getSheets()[0].setName(nombre) : ss.insertSheet(nombre);
    h.getRange(1, 1, 1, HOJAS[nombre].length).setValues([HOJAS[nombre]]).setFontWeight('bold').setBackground('#1E2229').setFontColor('#FFFFFF');
    h.setFrozenRows(1);
  });
  var cfg = ss.getSheetByName('Config');
  var dominio = (Session.getEffectiveUser().getEmail().split('@')[1] || 'salfamontajes.com').toLowerCase();
  cfg.getRange(2, 1, CONFIG_INICIAL.length, 3).setValues(CONFIG_INICIAL.map(function (f) { return f[0] === 'DOMINIO' ? [f[0], dominio, f[2]] : f; }));
  cfg.autoResizeColumns(1, 3);

  var yo = Session.getEffectiveUser().getEmail();
  var ahora = new Date();
  ss.getSheetByName('Accesos').appendRow([yo, 'Administrador del portal', 'Procesos', 'Administrador', 'SI', ahora, yo, 'Creado por instalar()']);
  ss.getSheetByName('Versiones').appendRow(['V0001', 'B', 0, 'Rev B', 'aprobado', 'Rev B original', ahora, 'Versión inicial del mapa', '', '', '', '', yo, ahora, '']);
  ss.getSheetByName('Bitacora').appendRow([ahora, yo, 'instalar', 'Portal instalado']);

  props.setProperties({
    SS_ID: ss.getId(),
    CARPETA_PORTAL_ID: raiz.getId(),
    CARPETA_DATOS_ID: datos.getId(),
    CARPETA_VERSIONES_ID: versiones.getId(),
    CARPETA_PUBLICADAS_ID: publicadas.getId()
  });
  Logger.log('Portal instalado. Planilla de datos: ' + ss.getUrl());
}

function subcarpeta_(padre, nombre) {
  var it = padre.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : padre.createFolder(nombre);
}

/* =====================================================================
 * Utilidades de datos
 * ===================================================================== */

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  if (!id) throw new Error('El portal no está instalado. Ejecuta instalar() desde el editor.');
  return SpreadsheetApp.openById(id);
}
function hoja_(n) { return ss_().getSheetByName(n); }
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }

function filas_(nombre) {
  var h = hoja_(nombre), v = h.getDataRange().getValues(), cab = v.shift();
  return v.map(function (r, i) {
    var o = {_fila: i + 2};
    cab.forEach(function (c, j) { o[c] = r[j]; });
    return o;
  });
}

function config_() {
  var c = CacheService.getScriptCache().get('cfg');
  if (c) return JSON.parse(c);
  var o = {};
  filas_('Config').forEach(function (r) { if (r.Clave) o[String(r.Clave)] = String(r.Valor); });
  CacheService.getScriptCache().put('cfg', JSON.stringify(o), 60);
  return o;
}
function setConfig_(clave, valor) {
  var h = hoja_('Config'), v = h.getRange(2, 1, Math.max(1, h.getLastRow() - 1), 1).getValues();
  for (var i = 0; i < v.length; i++) {
    if (v[i][0] === clave) { h.getRange(i + 2, 2).setValue(valor); CacheService.getScriptCache().remove('cfg'); return; }
  }
  h.appendRow([clave, valor, '']);
  CacheService.getScriptCache().remove('cfg');
}

function bitacora_(accion, detalle) {
  try { hoja_('Bitacora').appendRow([new Date(), correo_(), accion, detalle || '']); } catch (e) {}
}

function correo_() { return (Session.getActiveUser().getEmail() || '').toLowerCase(); }

/** Valida si el correo pertenece al dominio de la organización o es la cuenta dueña autorizada */
function esDominioValido_(email) {
  if (!email) return false;
  var correo = String(email).trim().toLowerCase();
  var domCfg = String(config_().DOMINIO || 'salfamontajes.com').toLowerCase();
  var partes = correo.split('@');
  if (partes.length !== 2) return false;
  // Permitir dominio configurado (salfamontajes.com)
  if (partes[1] === domCfg) return true;
  // Permitir exclusivamente el correo de prueba personal del dueño
  var dueño = Session.getEffectiveUser().getEmail().toLowerCase();
  if (dueño && correo === dueño) return true;
  return false;
}

function fecha_(d) {
  if (!(d instanceof Date)) return String(d || '');
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
}

/* =====================================================================
 * Sesión y permisos
 * ===================================================================== */

function accesos_() {
  var c = CacheService.getScriptCache().get('acc');
  if (c) return JSON.parse(c);
  var o = {};
  filas_('Accesos').forEach(function (r) {
    var e = String(r.Correo || '').trim().toLowerCase();
    if (e) o[e] = {nombre: String(r.Nombre || ''), area: String(r['Área'] || ''), perfil: String(r.Perfil || ''), vigente: String(r.Vigente).toUpperCase() !== 'NO'};
  });
  CacheService.getScriptCache().put('acc', JSON.stringify(o), 60);
  return o;
}

function sesion_() {
  var email = correo_();
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SS_ID')) return {instalado: false, email: email};
  var cfg = config_();
  var dominioOk = esDominioValido_(email);
  var acc = accesos_()[email];
  var perfil = '';
  if (dominioOk) {
    if (acc && acc.vigente && PERMISOS[acc.perfil]) perfil = acc.perfil;
    else if (!acc && cfg.ACCESO_POR_DEFECTO === 'Visualizador') perfil = 'Visualizador';
  }
  var permisos = perfil ? PERMISOS[perfil] : {};
  var simulado = false;
  if (cfg.PRUEBA_PERFIL && PERMISOS[cfg.PRUEBA_PERFIL] && email === Session.getEffectiveUser().getEmail().toLowerCase()) {
    perfil = cfg.PRUEBA_PERFIL; simulado = true;
    permisos = JSON.parse(JSON.stringify(PERMISOS[perfil])); permisos.admin = true;
  }
  return {
    simulado: simulado,
    instalado: true,
    email: email,
    nombre: acc ? acc.nombre : '',
    perfil: perfil,
    permisos: permisos,
    dominioOk: dominioOk,
    url: ScriptApp.getService().getUrl(),
    portal: cfg.PORTAL_NOMBRE,
    documento: cfg.DOCUMENTO,
    revVigente: cfg.REV_VIGENTE,
    gemUrl: cfg.GEM_URL || '',
    ia: {
      activa: cfg.IA_ACTIVA === 'SI' && !!cfg.IA_PROYECTO,
      modelos: [
        {id: cfg.IA_MODELO_RAPIDO, nombre: 'Gemini rápido (' + cfg.IA_MODELO_RAPIDO + ')'},
        {id: cfg.IA_MODELO_AVANZADO, nombre: 'Gemini avanzado (' + cfg.IA_MODELO_AVANZADO + ')'}
      ],
      limite: Number(cfg.IA_LIMITE_DIARIO || 0)
    },
    segregacion: cfg.SEGREGACION === 'SI'
  };
}

function exigir_(permiso) {
  var s = sesion_();
  if (!s.instalado) throw new Error('El portal no está instalado.');
  if (!s.perfil || !s.permisos[permiso]) throw new Error('Tu perfil (' + (s.perfil || 'sin acceso') + ') no permite esta acción.');
  return s;
}

/* =====================================================================
 * Páginas
 * ===================================================================== */

function doGet(e) {
  var p = (e && e.parameter && e.parameter.p) || '';
  var s = sesion_();
  if (!s.instalado) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:24px">El portal no está instalado. La persona administradora debe ejecutar <b>instalar()</b> desde el editor de Apps Script.</p>');
  }
  if (p === 'mapa' && s.permisos.ver) return pagina_('mapa', s, datosMapa_(s), 'Mapa de Procesos · Salfa Montajes');
  if (p === 'admin' && s.permisos.admin) return pagina_('admin', s, {}, 'Administración · Portal de Procesos');
  return pagina_('portada', s, datosPortada_(s), 'Portal de Procesos · Salfa Montajes');
}

function pagina_(vista, s, datos, titulo) {
  var t = HtmlService.createTemplateFromFile('Envoltorio');
  t.vista = vista;
  t.ctx = JSON.stringify({sesion: s, datos: datos}).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return t.evaluate()
    .setTitle(titulo)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://www.gstatic.com/images/branding/product/2x/apps_script_48dp.png');
}

function incluir(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

function datosPortada_(s) {
  var vig = versionPorId_(config_().VERSION_VIGENTE_ID);
  var d = {vigente: vig ? meta_(vig) : null, pendiente: false};
  if (s.permisos && s.permisos.borradores) {
    var u = ultimaDe_(config_().REV_VIGENTE);
    if (u && u.ID !== (vig && vig.ID)) d.trabajo = meta_(u);
  }
  if (!s.perfil) {
    d.pendiente = filas_('Solicitudes').some(function (r) { return String(r.Correo).toLowerCase() === s.email && r.Estado === 'pendiente'; });
  }
  return d;
}

function datosMapa_(s) {
  var cfg = config_();
  var vig = versionPorId_(cfg.VERSION_VIGENTE_ID);
  var out = {vigente: vig ? conEstado_(vig) : null, trabajo: null};
  if (s.permisos.borradores) {
    var u = ultimaDe_(cfg.REV_VIGENTE);
    if (u && (!vig || u.ID !== vig.ID)) out.trabajo = conEstado_(u);
  }
  return out;
}

/* =====================================================================
 * Versiones
 * ===================================================================== */

function meta_(r) {
  return {
    id: r.ID, rev: String(r['Revisión']), iter: Number(r['Iteración']) || 0, etiqueta: String(r.Etiqueta),
    estado: String(r.Estado), estadoNombre: ESTADOS[r.Estado] || r.Estado, autor: String(r.Autor), fecha: fecha_(r.Fecha),
    comentario: String(r.Comentario || ''), origen: String(r.Origen || ''), reviso: String(r['Revisó'] || ''),
    aprobo: String(r['Aprobó'] || ''), observaciones: String(r.Observaciones || '')
  };
}

function conEstado_(r) {
  var m = meta_(r);
  m.estadoMapa = '';
  if (r.ArchivoId) {
    try {
      var j = JSON.parse(DriveApp.getFileById(String(r.ArchivoId)).getBlob().getDataAsString());
      m.estadoMapa = j.estado || '';
    } catch (e) { m.error = 'No se pudo leer la instantánea: ' + e.message; }
  }
  return m;
}

function versionPorId_(id) {
  var f = filas_('Versiones');
  for (var i = 0; i < f.length; i++) if (f[i].ID === id) return f[i];
  return null;
}

function ultimaDe_(rev) {
  var f = filas_('Versiones').filter(function (r) { return String(r['Revisión']) === String(rev) && r.Estado !== 'obsoleto'; });
  return f.length ? f[f.length - 1] : null;
}

function nuevoId_() {
  var n = Math.max(0, hoja_('Versiones').getLastRow() - 1) + 1;
  return 'V' + ('000' + n).slice(-4);
}

function siguienteLetra_(l) {
  l = String(l || 'A').toUpperCase();
  var a = l.split(''), i = a.length - 1;
  while (i >= 0) {
    if (a[i] !== 'Z') { a[i] = String.fromCharCode(a[i].charCodeAt(0) + 1); return a.join(''); }
    a[i] = 'A'; i--;
  }
  return 'A' + a.join('');
}

function carpetaRev_(rev) {
  return subcarpeta_(DriveApp.getFolderById(prop_('CARPETA_VERSIONES_ID')), 'Rev ' + rev);
}

/** Lista de versiones visibles para la persona. */
function api_versiones() {
  var s = exigir_('ver');
  return filas_('Versiones')
    .filter(function (r) { return s.permisos.borradores || r.Estado === 'aprobado' || r.Estado === 'reemplazado'; })
    .map(meta_).reverse();
}

/** Una versión con su estado del mapa. */
function api_version(id) {
  var s = exigir_('ver');
  var r = versionPorId_(id);
  if (!r) throw new Error('No existe la versión ' + id);
  if (!s.permisos.borradores && r.Estado !== 'aprobado' && r.Estado !== 'reemplazado') throw new Error('Tu perfil solo ve versiones aprobadas.');
  return conEstado_(r);
}

/**
 * Guarda una iteración nueva.
 * @param {string} estadoMapa  JSON del mapa (snapshot de la página)
 * @param {string} texto       Mapa en texto plano (para documento vigente e IA)
 * @param {string} baseId      ID de la versión sobre la que se trabajó
 * @param {string} comentario  Comentario del cambio
 * @param {boolean} forzar     Guardar aunque exista una versión más nueva
 */
function api_guardar(estadoMapa, texto, baseId, comentario, forzar) {
  var s = exigir_('proponer');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var cfg = config_();
    var rev = cfg.REV_VIGENTE;
    var ultima = ultimaDe_(rev);
    if (!forzar && ultima && ultima.ID !== baseId) {
      return {conflicto: true, ultima: meta_(ultima)};
    }
    var iter = filas_('Versiones').filter(function (r) { return String(r['Revisión']) === rev && Number(r['Iteración']) > 0; }).length + 1;
    var etiqueta = rev + ' v.' + ('0' + iter).slice(-2);
    var id = nuevoId_();
    var nombre = 'Mapa ' + etiqueta + ' · ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm') + ' · ' + id + '.json';
    var archivo = carpetaRev_(rev).createFile(nombre, JSON.stringify({id: id, etiqueta: etiqueta, autor: s.email, fecha: new Date().toISOString(), estado: estadoMapa, texto: texto || ''}), 'application/json');
    var estado = s.permisos.guardar ? 'borrador' : 'propuesta';
    hoja_('Versiones').appendRow([id, rev, iter, etiqueta, estado, s.email, new Date(), comentario || '', baseId || '', archivo.getId(), '', '', '', '', '']);
    bitacora_('guardar', etiqueta + ' (' + id + ', ' + estado + ')' + (forzar ? ' forzado' : ''));
    return {ok: true, version: meta_(versionPorId_(id))};
  } finally {
    lock.releaseLock();
  }
}

/** Restaura una versión antigua como iteración nueva. */
function api_restaurar(id) {
  exigir_('restaurar');
  var r = versionPorId_(id);
  if (!r) throw new Error('No existe la versión ' + id);
  var v = conEstado_(r);
  var texto = '';
  if (r.ArchivoId) { try { texto = JSON.parse(DriveApp.getFileById(String(r.ArchivoId)).getBlob().getDataAsString()).texto || ''; } catch (e) {} }
  return api_guardar(v.estadoMapa, texto, '', 'Restaurada desde ' + v.etiqueta + ' (' + id + ')', true);
}

/**
 * Cambia el estado de una versión.
 * acciones: enviar, validar, devolver, aprobar
 */
function api_estado(id, accion, obs) {
  var s = sesion_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var r = versionPorId_(id);
    if (!r) throw new Error('No existe la versión ' + id);
    var cfg = config_(), h = hoja_('Versiones'), col = HOJAS.Versiones;
    var set = function (campo, valor) { h.getRange(r._fila, col.indexOf(campo) + 1).setValue(valor); };
    var est = r.Estado, ahora = new Date();

    if (accion === 'enviar') {
      exigir_('enviar');
      if (['borrador', 'propuesta', 'devuelto'].indexOf(est) < 0) throw new Error('Solo se envía a revisión un borrador, una propuesta o una versión devuelta.');
      set('Estado', 'en_revision');
      avisar_(destinatarios_(['Revisor', 'Aprobador', 'Administrador']), 'Versión ' + r.Etiqueta + ' en revisión',
        s.email + ' envió a revisión la versión ' + r.Etiqueta + ' del ' + cfg.PORTAL_NOMBRE + '.' + (obs ? '\n\nComentario: ' + obs : ''));
    } else if (accion === 'validar') {
      exigir_('revisar');
      if (est !== 'en_revision') throw new Error('Solo se valida una versión en revisión.');
      set('Estado', 'validado'); set('Revisó', s.email); set('Fecha revisión', ahora);
      if (obs) set('Observaciones', obs);
      avisar_(destinatarios_(['Aprobador', 'Administrador']), 'Versión ' + r.Etiqueta + ' validada',
        s.email + ' validó la versión ' + r.Etiqueta + '. Queda lista para aprobación.');
    } else if (accion === 'devolver') {
      exigir_('revisar');
      if (['en_revision', 'validado'].indexOf(est) < 0) throw new Error('Solo se devuelve una versión en revisión o validada.');
      if (!obs) throw new Error('Escribe las observaciones para devolver la versión.');
      set('Estado', 'devuelto'); set('Observaciones', obs); set('Revisó', s.email); set('Fecha revisión', ahora);
      avisar_([String(r.Autor)], 'Versión ' + r.Etiqueta + ' devuelta con observaciones', s.email + ' devolvió la versión ' + r.Etiqueta + '.\n\nObservaciones: ' + obs);
    } else if (accion === 'aprobar') {
      exigir_('aprobar');
      if (est !== 'validado') throw new Error('Solo se aprueba una versión validada.');
      if (cfg.SEGREGACION === 'SI' && String(r.Autor).toLowerCase() === s.email) throw new Error('Segregación de funciones: no puedes aprobar una versión que tú guardaste.');
      var nueva = siguienteLetra_(cfg.REV_VIGENTE);
      var anterior = versionPorId_(cfg.VERSION_VIGENTE_ID);
      if (anterior) h.getRange(anterior._fila, col.indexOf('Estado') + 1).setValue('reemplazado');
      filas_('Versiones').forEach(function (x) {
        if (x.ID !== id && String(x['Revisión']) === cfg.REV_VIGENTE && ['propuesta', 'borrador', 'en_revision', 'validado', 'devuelto'].indexOf(x.Estado) >= 0) {
          h.getRange(x._fila, col.indexOf('Estado') + 1).setValue('obsoleto');
        }
      });
      set('Estado', 'aprobado'); set('Aprobó', s.email); set('Fecha aprobación', ahora);
      set('Revisión', nueva); set('Iteración', 0); set('Etiqueta', 'Rev ' + nueva + ' · desde ' + r.Etiqueta);
      if (obs) set('Observaciones', obs);
      setConfig_('REV_VIGENTE', nueva);
      setConfig_('VERSION_VIGENTE_ID', id);
      var pub = publicar_(id, nueva);
      var dest = cfg.AVISO_APROBACION_A_TODOS === 'SI'
        ? Object.keys(accesos_()).filter(function (e) { return accesos_()[e].vigente; })
        : destinatarios_(['Editor', 'Revisor', 'Aprobador', 'Administrador']);
      avisar_(dest, 'Rev ' + nueva + ' aprobada: ' + cfg.PORTAL_NOMBRE,
        s.email + ' aprobó la Rev ' + nueva + ' (desde ' + r.Etiqueta + ').\n\nPortal: ' + ScriptApp.getService().getUrl() + (pub && pub.pdf ? '\nPDF: ' + pub.pdf : ''));
    } else {
      throw new Error('Acción desconocida: ' + accion);
    }
    bitacora_(accion, r.Etiqueta + ' (' + id + ')' + (obs ? ': ' + obs : ''));
    return meta_(versionPorId_(id));
  } finally {
    lock.releaseLock();
  }
}

/** Documento vigente (para el Gem) + PDF de la revisión aprobada. */
function publicar_(id, rev) {
  var r = versionPorId_(id), texto = '';
  try { if (r && r.ArchivoId) texto = JSON.parse(DriveApp.getFileById(String(r.ArchivoId)).getBlob().getDataAsString()).texto || ''; } catch (e) {}
  return publicarTexto_(texto, rev);
}

/** Publica el documento vigente con el texto que envía la página (sirve para la Rev B original). */
function api_publicarVigente(texto) {
  exigir_('admin');
  var r = publicarTexto_(texto, config_().REV_VIGENTE);
  if (!r) throw new Error('No se pudo publicar el documento. Revisa la bitácora.');
  bitacora_('publicar', 'Documento vigente Rev ' + config_().REV_VIGENTE);
  return r;
}

function publicarTexto_(texto, rev) {
  try {
    var cfg = config_();
    var carpeta = DriveApp.getFolderById(prop_('CARPETA_PUBLICADAS_ID'));
    var docId = prop_('DOC_VIGENTE_ID'), doc;
    if (docId) { try { doc = DocumentApp.openById(docId); } catch (e) { doc = null; } }
    if (!doc) {
      doc = DocumentApp.create('Mapa de Procesos vigente · ' + cfg.PORTAL_NOMBRE);
      DriveApp.getFileById(doc.getId()).moveTo(carpeta);
      PropertiesService.getScriptProperties().setProperty('DOC_VIGENTE_ID', doc.getId());
    }
    var b = doc.getBody();
    b.clear();
    b.appendParagraph('Mapa de Procesos · Salfa Montajes · Rev ' + rev).setHeading(DocumentApp.ParagraphHeading.TITLE);
    b.appendParagraph('Documento ' + cfg.DOCUMENTO + ' · Revisión vigente Rev ' + rev + ' · Publicado el ' + fecha_(new Date()) + '. Este documento lo actualiza el portal en cada aprobación y es la fuente del Gem asistente.');
    String(texto || 'Sin texto disponible.').split('\n').forEach(function (l) {
      var p = b.appendParagraph(l);
      if (/^NIVEL \d/.test(l)) p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    });
    doc.saveAndClose();
    var pdf = carpeta.createFile(DriveApp.getFileById(doc.getId()).getAs('application/pdf')).setName('Mapa de Procesos Rev ' + rev + '.pdf');
    return {doc: doc.getUrl(), pdf: pdf.getUrl()};
  } catch (e) {
    bitacora_('publicar_error', e.message);
    return null;
  }
}

/** Guarda una imagen PNG del mapa en la carpeta Publicadas. */
function api_guardarImagen(base64, nombre) {
  exigir_('imagenDrive');
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/png', nombre || 'mapa.png');
  var f = subcarpeta_(DriveApp.getFolderById(prop_('CARPETA_PUBLICADAS_ID')), 'Imágenes').createFile(blob);
  bitacora_('imagen', f.getName());
  return f.getUrl();
}

/* =====================================================================
 * Correo
 * ===================================================================== */

function destinatarios_(perfiles) {
  var a = accesos_();
  return Object.keys(a).filter(function (e) { return a[e].vigente && perfiles.indexOf(a[e].perfil) >= 0; });
}

function avisar_(para, asunto, texto) {
  try {
    if (config_().AVISOS_CORREO !== 'SI') return;
    para = (para || []).filter(function (x) { return x && x.indexOf('@') > 0; });
    if (!para.length) return;
    MailApp.sendEmail({to: para.join(','), subject: '[Portal de Procesos] ' + asunto, body: texto + '\n\n' + ScriptApp.getService().getUrl(), name: 'Portal de Procesos Salfa'});
  } catch (e) { bitacora_('correo_error', e.message); }
}

/** Envía el mapa por correo desde la cuenta del portal, con respuesta a quien envía. */
function api_enviarCorreo(para, asunto, cuerpo, base64, nombre) {
  var s = exigir_('ver');
  var dom = String(config_().DOMINIO).toLowerCase();
  var lista = String(para || '').split(/[,;\s]+/).filter(function (x) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x); });
  if (!lista.length) throw new Error('Escribe al menos un correo válido.');
  var externos = lista.filter(function (x) { return x.toLowerCase().split('@')[1] !== dom; });
  if (externos.length && config_().CORREO_EXTERNO !== 'SI') throw new Error('El portal solo envía a correos @' + dom + '. Externos: ' + externos.join(', '));
  var opciones = {
    to: lista.join(','), subject: asunto, body: cuerpo + '\n\nEnviado por ' + s.email + ' desde el Portal de Procesos.',
    name: 'Portal de Procesos Salfa (' + s.email + ')', replyTo: s.email
  };
  if (base64) opciones.attachments = [Utilities.newBlob(Utilities.base64Decode(base64), 'image/png', nombre || 'mapa.png')];
  MailApp.sendEmail(opciones);
  bitacora_('correo', lista.join(', ') + (lista.some(function (x) { return x.split('@')[1] !== dom; }) ? ' (incluye externos)' : ''));
  return true;
}

/* =====================================================================
 * Asistente IA (vía A: Gemini en Vertex AI)
 * ===================================================================== */

/**
 * @param {Array} mensajes  [{role:'user'|'assistant', content:string}]
 * @param {Object} op       {model, effort}
 */
function api_ia(mensajes, op) {
  var s = exigir_('ver');
  var cfg = config_();
  if (cfg.IA_ACTIVA !== 'SI' || !cfg.IA_PROYECTO) throw new Error('sampling_disabled');
  var clave = 'ia_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '_' + s.email;
  var props = PropertiesService.getScriptProperties();
  var usados = Number(props.getProperty(clave) || 0), lim = Number(cfg.IA_LIMITE_DIARIO || 0);
  if (lim && usados >= lim) throw new Error('rate_limited');
  var modelos = [cfg.IA_MODELO_RAPIDO, cfg.IA_MODELO_AVANZADO];
  var modelo = modelos.indexOf(op && op.model) >= 0 ? op.model : cfg.IA_MODELO_RAPIDO;
  var presupuesto = {low: 512, medium: 4096, high: 16384}[(op && op.effort) || 'medium'] || 4096;
  var url = 'https://aiplatform.googleapis.com/v1/projects/' + cfg.IA_PROYECTO + '/locations/' + cfg.IA_REGION +
    '/publishers/google/models/' + modelo + ':generateContent';
  if (cfg.IA_REGION && cfg.IA_REGION !== 'global') url = url.replace('https://aiplatform.googleapis.com', 'https://' + cfg.IA_REGION + '-aiplatform.googleapis.com');
  var cuerpo = {
    contents: (mensajes || []).map(function (m) { return {role: m.role === 'assistant' ? 'model' : 'user', parts: [{text: String(m.content || '')}]}; }),
    generationConfig: {maxOutputTokens: 8192, thinkingConfig: {thinkingBudget: presupuesto}}
  };
  var resp = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(cuerpo),
    headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions: true
  });
  var code = resp.getResponseCode(), j = {};
  try { j = JSON.parse(resp.getContentText()); } catch (e) {}
  if (code === 429) throw new Error('rate_limited');
  if (code >= 300) throw new Error('Gemini respondió ' + code + ': ' + ((j.error && j.error.message) || '').slice(0, 300));
  var cand = (j.candidates || [])[0] || {};
  var texto = ((cand.content && cand.content.parts) || []).map(function (p) { return p.thought ? '' : (p.text || ''); }).join('');
  props.setProperty(clave, String(usados + 1));
  return {text: texto, truncated: cand.finishReason === 'MAX_TOKENS', modelApplied: modelo, usados: usados + 1, limite: lim};
}

/* =====================================================================
 * Solicitudes de acceso
 * ===================================================================== */

function api_solicitarAcceso(area, motivo) {
  var s = sesion_();
  if (!s.dominioOk) throw new Error('Solo cuentas @' + config_().DOMINIO + ' pueden solicitar acceso.');
  if (s.perfil) return 'Ya tienes acceso como ' + s.perfil + '.';
  var ya = filas_('Solicitudes').some(function (r) { return String(r.Correo).toLowerCase() === s.email && r.Estado === 'pendiente'; });
  if (ya) return 'Tu solicitud ya está registrada.';
  hoja_('Solicitudes').appendRow([new Date(), s.email, area || '', motivo || '', 'pendiente', '', '']);
  bitacora_('solicitud', s.email);
  avisar_(destinatarios_(['Administrador']), 'Solicitud de acceso de ' + s.email, s.email + ' solicita acceso al ' + config_().PORTAL_NOMBRE + '.\nÁrea: ' + (area || '-') + '\nMotivo: ' + (motivo || '-') + '\n\nAdministra los accesos en: ' + ScriptApp.getService().getUrl() + '?p=admin');
  return 'Solicitud enviada. Te avisaremos por correo cuando tengas acceso.';
}

/* =====================================================================
 * Administración
 * ===================================================================== */

function api_admin_datos() {
  exigir_('admin');
  return {
    perfiles: PERFILES,
    permisos: PERMISOS,
    accesos: filas_('Accesos').map(function (r) {
      return {fila: r._fila, correo: String(r.Correo), nombre: String(r.Nombre || ''), area: String(r['Área'] || ''), perfil: String(r.Perfil || ''),
        vigente: String(r.Vigente).toUpperCase() !== 'NO', alta: fecha_(r.Alta), altaPor: String(r['Alta por'] || ''), nota: String(r.Nota || '')};
    }),
    solicitudes: filas_('Solicitudes').map(function (r) {
      return {fila: r._fila, fecha: fecha_(r.Fecha), correo: String(r.Correo), area: String(r['Área'] || ''), motivo: String(r.Motivo || ''), estado: String(r.Estado), resuelto: String(r['Resuelto por'] || '')};
    }).reverse(),
    config: filas_('Config').map(function (r) { return {clave: String(r.Clave), valor: String(r.Valor), desc: String(r['Descripción'] || '')}; }),
    bitacora: filas_('Bitacora').slice(-200).reverse().map(function (r) { return {fecha: fecha_(r.Fecha), correo: String(r.Correo), accion: String(r['Acción']), detalle: String(r.Detalle)}; }),
    enlaces: {
      planilla: ss_().getUrl(),
      carpeta: DriveApp.getFolderById(prop_('CARPETA_PORTAL_ID') || CARPETA_PORTAL_ID).getUrl(),
      publicadas: DriveApp.getFolderById(prop_('CARPETA_PUBLICADAS_ID')).getUrl()
    }
  };
}

function api_admin_guardarAcceso(a) {
  var s = exigir_('admin');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var correo = String(a.correo || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) throw new Error('Correo no válido.');
    if (!esDominioValido_(correo)) throw new Error('Solo se admiten correos @' + config_().DOMINIO + ' o la cuenta administradora.');
    if (PERFILES.indexOf(a.perfil) < 0) throw new Error('Perfil no válido.');
    if (correo === s.email && a.perfil !== 'Administrador') throw new Error('No puedes quitarte el perfil Administrador a ti mismo.');
    var h = hoja_('Accesos'), filas = filas_('Accesos'), fila = 0;
    filas.forEach(function (r) { if (String(r.Correo).toLowerCase() === correo) fila = r._fila; });
    var vig = a.vigente === false ? 'NO' : 'SI';
    if (fila) {
      h.getRange(fila, 2, 1, 4).setValues([[a.nombre || '', a.area || '', a.perfil, vig]]);
      h.getRange(fila, 8).setValue(a.nota || '');
    } else {
      h.appendRow([correo, a.nombre || '', a.area || '', a.perfil, vig, new Date(), s.email, a.nota || '']);
    }
    filas_('Solicitudes').forEach(function (r) {
      if (String(r.Correo).toLowerCase() === correo && r.Estado === 'pendiente') {
        hoja_('Solicitudes').getRange(r._fila, 5, 1, 3).setValues([['aprobada', s.email, new Date()]]);
      }
    });
    CacheService.getScriptCache().remove('acc');
    bitacora_('acceso', correo + ' → ' + a.perfil + (vig === 'NO' ? ' (no vigente)' : ''));
    if (a.avisar) {
      try {
        avisar_([correo], 'Tienes acceso al portal', 'Se te asignó el perfil ' + a.perfil + ' en el ' + config_().PORTAL_NOMBRE + '.');
      } catch (eMail) {
        // No bloquear la creación del acceso si falla el envío de correo de aviso
      }
    }
    return api_admin_datos();
  } finally { lock.releaseLock(); }
}

function api_admin_eliminarAcceso(correo) {
  var s = exigir_('admin');
  correo = String(correo || '').toLowerCase();
  if (correo === s.email) throw new Error('No puedes eliminar tu propio acceso.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var f = filas_('Accesos').filter(function (r) { return String(r.Correo).toLowerCase() === correo; });
    if (f.length) hoja_('Accesos').deleteRow(f[0]._fila);
    CacheService.getScriptCache().remove('acc');
    bitacora_('acceso_eliminado', correo);
    return api_admin_datos();
  } finally { lock.releaseLock(); }
}

function api_admin_rechazarSolicitud(fila) {
  var s = exigir_('admin');
  hoja_('Solicitudes').getRange(Number(fila), 5, 1, 3).setValues([['rechazada', s.email, new Date()]]);
  bitacora_('solicitud_rechazada', 'fila ' + fila);
  return api_admin_datos();
}

function api_admin_guardarConfig(pares) {
  exigir_('admin');
  var protegidas = ['REV_VIGENTE', 'VERSION_VIGENTE_ID'];
  (pares || []).forEach(function (p) { if (protegidas.indexOf(p.clave) < 0) setConfig_(p.clave, p.valor); });
  bitacora_('config', (pares || []).map(function (p) { return p.clave; }).join(', '));
  return api_admin_datos();
}
