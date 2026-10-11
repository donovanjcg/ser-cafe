/**
 * ============================================================
 *  Ser Café — Backend del formulario de contacto (Google Apps Script)
 * ============================================================
 *
 *  Qué hace:
 *   1. Recibe los datos del formulario propio (contactanos-v2.html).
 *   2. Los guarda como una nueva fila en una hoja de cálculo (Google Sheets).
 *   3. Envía un correo de aviso a quien gestiona los mensajes (MailApp).
 *
 *  Es la MISMA capacidad del formulario de Google que ya usabas, pero el
 *  formulario de la web ahora es propio y 100% estilizable.
 *
 * ------------------------------------------------------------
 *  CÓMO PUBLICARLO (una sola vez):
 * ------------------------------------------------------------
 *  1. Crea una Google Sheet nueva (ahí se guardarán los mensajes).
 *  2. En esa Sheet: menú  Extensiones > Apps Script.
 *  3. Borra el contenido y pega TODO este archivo.
 *  4. Cambia el valor de CORREO_DESTINO por el correo que debe recibir el aviso.
 *  5. Guarda. Luego:  Implementar > Nueva implementación.
 *       - Tipo: Aplicación web
 *       - Ejecutar como: Yo (tu cuenta)
 *       - Quién tiene acceso: Cualquier usuario
 *  6. Copia la URL que termina en  /exec  y pégala en contactanos-v2.html,
 *     en la constante  APPS_SCRIPT_URL.
 *  7. La primera vez te pedirá autorizar permisos (Sheets + Gmail). Acepta.
 * ------------------------------------------------------------
 */

// 👉 Cambia este correo por el que debe recibir los mensajes
const CORREO_DESTINO = "correo-que-recibe@ejemplo.com";

// Nombre de la pestaña donde se guardan los mensajes (se crea sola si no existe)
const NOMBRE_HOJA = "Mensajes";

function doPost(e) {
  try {
    const datos = (e && e.parameter) ? e.parameter : {};

    const nombre   = (datos.nombre   || "").toString().trim();
    const correo   = (datos.correo   || "").toString().trim();
    const telefono = (datos.telefono || "").toString().trim();
    const mensaje  = (datos.mensaje  || "").toString().trim();
    const fecha    = new Date();

    // 1) Guardar en la hoja
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = ss.getSheetByName(NOMBRE_HOJA);
    if (!hoja) {
      hoja = ss.insertSheet(NOMBRE_HOJA);
      hoja.appendRow(["Fecha", "Nombre", "Correo", "Teléfono", "Mensaje"]);
    }
    hoja.appendRow([fecha, nombre, correo, telefono, mensaje]);

    // 2) Enviar correo de aviso
    const cuerpo =
      "Nuevo mensaje desde el formulario de Ser Café:\n\n" +
      "Nombre: "   + nombre   + "\n" +
      "Correo: "   + correo   + "\n" +
      "Teléfono: " + telefono + "\n\n" +
      "Mensaje:\n" + mensaje  + "\n\n" +
      "Fecha: " + fecha;

    MailApp.sendEmail({
      to: CORREO_DESTINO,
      subject: "📩 Nuevo contacto Ser Café — " + (nombre || "sin nombre"),
      body: cuerpo,
      replyTo: correo || CORREO_DESTINO
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Permite abrir la URL en el navegador y comprobar que está publicada
function doGet() {
  return ContentService.createTextOutput("Ser Café — endpoint de contacto activo.");
}
