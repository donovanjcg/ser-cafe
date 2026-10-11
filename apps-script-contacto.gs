/**
 * ============================================================
 *  Ser Café — Backend del formulario de contacto (Google Apps Script)
 * ============================================================
 *
 *  Qué hace:
 *   1. Recibe los datos del formulario propio (contactanos-v2.html).
 *   2. Los guarda como una nueva fila en una hoja de cálculo (Google Sheets).
 *   3. Envía un correo de aviso con MailApp.
 *
 * ------------------------------------------------------------
 *  PASOS PARA QUE FUNCIONE (muy importante):
 * ------------------------------------------------------------
 *  1. Cambia CORREO_DESTINO por TU correo real (abajo).
 *  2. Guarda (icono de disco).
 *  3. Implementar > Gestionar implementaciones > ✏️ editar
 *       - Versión: "Versión nueva"   <-- SIN ESTO, LA URL SIGUE VIEJA
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *       - Implementar
 *  4. La primera vez autoriza los permisos (Gmail + Sheets).
 *  5. Prueba abriendo la URL /exec en el navegador: debe decir
 *     "endpoint activo". Luego prueba el formulario de la web.
 *
 *  TIP para depurar: Apps Script > menú "Ejecuciones" muestra cada
 *  llamada y si hubo error (p. ej. correo inválido o permisos).
 * ------------------------------------------------------------
 */

// 👉 CAMBIA ESTO por el correo que debe recibir los mensajes
const CORREO_DESTINO = "correo-que-recibe@ejemplo.com";

// Pestaña donde se guardan los mensajes (se crea sola si no existe)
const NOMBRE_HOJA = "Mensajes";


// Punto de entrada para POST (lo usa el formulario de la web)
function doPost(e) {
  return procesar(e);
}

// Punto de entrada para GET: permite probar desde el navegador
//   .../exec                         -> muestra "endpoint activo"
//   .../exec?nombre=Ana&correo=a@a.co&mensaje=hola  -> guarda y envía (prueba)
function doGet(e) {
  if (e && e.parameter && (e.parameter.nombre || e.parameter.mensaje)) {
    return procesar(e);
  }
  return ContentService.createTextOutput("Ser Café — endpoint de contacto activo.");
}


function procesar(e) {
  try {
    const datos = (e && e.parameter) ? e.parameter : {};

    const nombre   = (datos.nombre   || "").toString().trim();
    const correo   = (datos.correo   || "").toString().trim();
    const telefono = (datos.telefono || "").toString().trim();
    const mensaje  = (datos.mensaje  || "").toString().trim();
    const fecha    = new Date();

    // 1) Guardar SIEMPRE en la hoja (aunque luego falle el correo)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = ss.getSheetByName(NOMBRE_HOJA);
    if (!hoja) {
      hoja = ss.insertSheet(NOMBRE_HOJA);
      hoja.appendRow(["Fecha", "Nombre", "Correo", "Teléfono", "Mensaje"]);
    }
    hoja.appendRow([fecha, nombre, correo, telefono, mensaje]);

    // 2) Enviar correo de aviso (si falla, se registra pero no rompe el guardado)
    let correoEnviado = false;
    let errorCorreo = "";
    try {
      MailApp.sendEmail({
        to: CORREO_DESTINO,
        subject: "📩 Nuevo contacto Ser Café — " + (nombre || "sin nombre"),
        body:
          "Nuevo mensaje desde el formulario de Ser Café:\n\n" +
          "Nombre: "   + nombre   + "\n" +
          "Correo: "   + correo   + "\n" +
          "Teléfono: " + telefono + "\n\n" +
          "Mensaje:\n" + mensaje  + "\n\n" +
          "Fecha: " + fecha,
        replyTo: correo || CORREO_DESTINO
      });
      correoEnviado = true;
    } catch (errMail) {
      errorCorreo = errMail.toString();
      Logger.log("Error al enviar correo: " + errorCorreo);
    }

    return salida({ ok: true, correoEnviado: correoEnviado, errorCorreo: errorCorreo });

  } catch (err) {
    return salida({ ok: false, error: err.toString() });
  }
}


function salida(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
