/**
 * ============================================================
 *  Ser Café — Confirmación de pagos ePayco (Google Apps Script)
 * ============================================================
 *  Versión extendida del script original. Mantiene todo lo que ya
 *  funcionaba (Lock, Logs, Pedidos, número de pedido y correos) y
 *  agrega:
 *
 *   1. CORRECCIÓN: el detalle del pedido (molienda, tamaño, total,
 *      productos) viene en `x_extra1` como JSON, NO en x_description.
 *      Antes se parseaba x_description y por eso esas columnas
 *      quedaban vacías.
 *   2. Enhanced Conversions a Google Ads desde el servidor
 *      (email, nombre y teléfono hasheados en SHA-256) para que
 *      Google mida mejor las compras y encuentre públicos similares.
 *   3. Credenciales (p_key, Google Ads) leídas desde
 *      PropertiesService en vez de estar escritas en el código.
 *
 *  ⚠️ SEGURIDAD: tu p_key de ePayco quedó expuesta en un chat.
 *     Rótala en el panel de ePayco y guárdala con guardarSecretos().
 * ============================================================
 */

const SPREADSHEET_ID = "1osW00ZwiQtxomygCuZ60vkX2Aj7xgruXvDxzRAZC7gA";

// ------------------------------------------------------------
// GUARDAR SECRETOS (ejecútala UNA VEZ desde el editor y luego
// borra los valores de aquí). Evita credenciales en el código.
// ------------------------------------------------------------
function guardarSecretos() {
  PropertiesService.getScriptProperties().setProperties({
    EPAYCO_CUST_ID: "1583501",
    EPAYCO_P_KEY: "PON_AQUI_TU_NUEVA_P_KEY",   // <- rótala en ePayco primero

    // Google Ads (rellena cuando tengas la API habilitada)
    ADS_ACTIVO: "false",
    ADS_CUSTOMER_ID: "",            // sin guiones
    ADS_CONVERSION_ACTION_ID: "",   // ID de la acción "Compra"
    ADS_DEVELOPER_TOKEN: "",
    ADS_CLIENT_ID: "",
    ADS_CLIENT_SECRET: "",
    ADS_REFRESH_TOKEN: ""
  });
}

function prop(nombre) {
  return PropertiesService.getScriptProperties().getProperty(nombre) || "";
}

// ------------------------------------------------------------
// ENTRADA
// ------------------------------------------------------------
function doPost(e) {

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const logs = ss.getSheetByName("Logs");
    const pedidos = ss.getSheetByName("Pedidos");

    // Registrar todos los parámetros recibidos
    logs.appendRow([new Date(), JSON.stringify(e.parameter)]);

    const params = e.parameter || {};

    const estado          = params.x_cod_response;
    const respuestaestado = params.x_response_reason_text;
    const ref_payco       = params.x_ref_payco;
    const transaction_id  = params.x_transaction_id;
    const amount          = params.x_amount;
    const currency        = params.x_currency_code;
    const firma           = params.x_signature;
    const descripcion     = params.x_description;
    const email           = params.x_customer_email;
    const telefono        = params.x_customer_movil;
    const nombre          = params.x_customer_name;
    const metodopago      = params.x_payment_method;

    Logger.log(JSON.stringify(params));

    // ============================
    // VALIDACIÓN DE FIRMA (MD5)
    // ============================
    const p_cust_id_cliente = prop("EPAYCO_CUST_ID") || "1583501";
    const p_key = prop("EPAYCO_P_KEY");

    const firmaCadena =
      p_cust_id_cliente + "^" +
      p_key + "^" +
      ref_payco + "^" +
      transaction_id + "^" +
      amount + "^" +
      currency;

    const firmaLocal = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      firmaCadena
    )
      .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0"))
      .join("");

    // Descomenta cuando quieras rechazar firmas inválidas:
    /*
    if (p_key && firmaLocal !== firma) {
      return ContentService.createTextOutput("Firma inválida")
        .setMimeType(ContentService.MimeType.TEXT);
    }
    */

    // ============================
    // DATOS DEL PEDIDO
    //  El JSON del pedido viaja en x_extra1 (data-epayco-extra1).
    //  x_description es solo texto legible. Dejamos un respaldo por
    //  si algún día el JSON llega en la descripción.
    // ============================
    let datosPedido = {};
    try {
      datosPedido = JSON.parse(params.x_extra1 || "{}");
    } catch (err) {
      try { datosPedido = JSON.parse(descripcion); }
      catch (err2) { datosPedido = { descripcion: descripcion }; }
    }

    const productos = Array.isArray(datosPedido.productos) ? datosPedido.productos : [];

    // Resúmenes legibles de molienda y tamaños (hay varios productos)
    const moliendas = productos.map(p => p.molienda).filter(Boolean).join(", ");
    const tamanos   = productos.map(p => (p.presentacion + "g x " + p.cantidad)).join(", ");
    const totalPedido = datosPedido.total || amount;
    const departamento = params.x_extra2 || datosPedido.departamento || "";
    const municipio    = params.x_extra3 || datosPedido.municipio || "";

    // ============================
    // SOLO PAGOS APROBADOS
    // ============================
    if (estado == "1") {

      const existe = pedidos
        .getRange("B:B")
        .createTextFinder(ref_payco)
        .matchEntireCell(true)
        .findNext() !== null;

      if (!existe) {
        const numeroPedido = generarNumeroPedido();

        pedidos.appendRow([
          new Date(),
          ref_payco,
          respuestaestado,
          transaction_id,
          amount,
          metodopago,
          moliendas,        // antes: datosPedido.molienda (vacío)
          tamanos,          // antes: datosPedido.tamano   (vacío)
          totalPedido,      // antes: datosPedido.total    (vacío)
          nombre,
          email,
          telefono,
          firma,
          firmaLocal,
          numeroPedido
        ]);

        enviarCorreoCliente(
          numeroPedido, nombre, email, metodopago, amount, moliendas, tamanos
        );

        enviarCorreoSerCafe(
          numeroPedido, nombre, email, telefono, metodopago, amount,
          moliendas, tamanos, transaction_id, ref_payco
        );

        // ============================
        // GOOGLE ADS — Enhanced Conversion (servidor)
        // ============================
        if (prop("ADS_ACTIVO") === "true") {
          try {
            const r = subirConversionGoogleAds({
              ref: ref_payco,
              valor: parseFloat(totalPedido) || parseFloat(amount) || 0,
              moneda: currency || "COP",
              email: email, nombre: nombre, telefono: telefono
            });
            Logger.log("Google Ads: " + r);
          } catch (adsErr) {
            Logger.log("Error Google Ads: " + adsErr);
          }
        }

      } else {
        Logger.log("Pedido duplicado: " + ref_payco);
      }
    }

    return ContentService.createTextOutput("OK")
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    Logger.log(err);
    return ContentService.createTextOutput("ERROR: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}

// ------------------------------------------------------------
// NÚMERO DE PEDIDO (igual que el original)
// ------------------------------------------------------------
function generarNumeroPedido() {
  const fecha = Utilities.formatDate(new Date(), "America/Bogota", "yyMMdd");
  const consecutivo = Utilities.formatString(
    "%06d",
    SpreadsheetApp.openById(SPREADSHEET_ID)
      .getSheetByName("Pedidos")
      .getLastRow()
  );
  return "SC" + fecha + "-" + consecutivo;
}

// ============================================================
// GOOGLE ADS — Enhanced Conversions (uploadClickConversions)
// ============================================================
function subirConversionGoogleAds(datos) {
  const customerId = prop("ADS_CUSTOMER_ID");
  const conversionActionId = prop("ADS_CONVERSION_ACTION_ID");
  const developerToken = prop("ADS_DEVELOPER_TOKEN");

  const accessToken = obtenerAccessTokenGoogle();

  const userIdentifiers = [];
  if (datos.email) {
    userIdentifiers.push({ hashedEmail: sha256Hex(String(datos.email).trim().toLowerCase()) });
  }
  const tel = normalizarTelefono(datos.telefono);
  if (tel) {
    userIdentifiers.push({ hashedPhoneNumber: sha256Hex(tel) });
  }
  const partes = separarNombre(datos.nombre);
  if (partes.nombre || partes.apellido) {
    const addr = { countryCode: "CO" };
    if (partes.nombre)   addr.hashedFirstName = sha256Hex(partes.nombre.toLowerCase());
    if (partes.apellido) addr.hashedLastName  = sha256Hex(partes.apellido.toLowerCase());
    userIdentifiers.push({ addressInfo: addr });
  }

  const cuerpo = {
    conversions: [{
      conversionAction: "customers/" + customerId +
                        "/conversionActions/" + conversionActionId,
      conversionDateTime: Utilities.formatDate(
        new Date(), "America/Bogota", "yyyy-MM-dd HH:mm:ss") + "-05:00",
      conversionValue: datos.valor,
      currencyCode: datos.moneda || "COP",
      orderId: datos.ref,
      userIdentifiers: userIdentifiers
    }],
    partialFailure: true
  };

  const url = "https://googleads.googleapis.com/v17/customers/" +
              customerId + ":uploadClickConversions";

  const resp = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "developer-token": developerToken
    },
    payload: JSON.stringify(cuerpo),
    muteHttpExceptions: true
  });

  return "HTTP " + resp.getResponseCode() + " " + resp.getContentText();
}

function obtenerAccessTokenGoogle() {
  const resp = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    payload: {
      client_id: prop("ADS_CLIENT_ID"),
      client_secret: prop("ADS_CLIENT_SECRET"),
      refresh_token: prop("ADS_REFRESH_TOKEN"),
      grant_type: "refresh_token"
    },
    muteHttpExceptions: true
  });
  const json = JSON.parse(resp.getContentText());
  if (!json.access_token) {
    throw new Error("No se obtuvo access_token: " + resp.getContentText());
  }
  return json.access_token;
}

// ------------------------------------------------------------
// UTILIDADES DE HASH / NORMALIZACIÓN
// ------------------------------------------------------------
function sha256Hex(texto) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, String(texto), Utilities.Charset.UTF_8);
  return bytes.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0")).join("");
}

function normalizarTelefono(tel) {
  let limpio = String(tel || "").replace(/[\s()-]/g, "");
  if (limpio && limpio[0] !== "+") {
    limpio = "+57" + limpio.replace(/^0+/, "");
  }
  return limpio;
}

function separarNombre(nombreCompleto) {
  const partes = String(nombreCompleto || "").trim().split(/\s+/);
  const nombre = partes.shift() || "";
  return { nombre: nombre, apellido: partes.join(" ") };
}

/* ============================================================
 *  NOTA: las funciones enviarCorreoCliente() y enviarCorreoSerCafe()
 *  son las tuyas (ya existentes en tu proyecto). No se incluyen aquí
 *  para no sobrescribirlas; mantenlas como están.
 * ============================================================ */
