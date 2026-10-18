// =========================================================
// TRACKING CENTRAL - Ser Café
// Google Tag Manager + GA4 + Google Ads (Enhanced Conversions)
// ---------------------------------------------------------
// Conversiones soportadas:
//   - purchase        (compra confirmada en gracias.html)
//   - generate_lead   (envío del formulario de contacto)
//   - whatsapp_click  (clic en botones/enlaces de WhatsApp)
//
// Enhanced Conversions: enviamos email, nombre y teléfono
// HASHEADOS (SHA-256) a Google para mejorar el emparejamiento
// y la creación de públicos similares. NUNCA se envían en texto
// plano. Requiere consentimiento del usuario (ver abajo).
// =========================================================

// ---------------------------------------------------------
// 1) CONFIGURACIÓN — reemplaza con tus IDs reales
// ---------------------------------------------------------
window.SERCAFE_TRACKING = {
    // ID del contenedor de Google Tag Manager, formato GTM-XXXXXXX
    GTM_ID: "GTM-XXXXXXX",

    // (Opcional) ID de medición de GA4, formato G-XXXXXXXXXX.
    // Déjalo vacío si configuras GA4 directamente dentro de GTM
    // (recomendado). Si lo pones, se carga gtag.js como respaldo.
    GA4_ID: "",

    // ¿Está activado el tracking? Útil para pruebas.
    activo: true
};

// ---------------------------------------------------------
// 2) dataLayer + carga de GTM
// ---------------------------------------------------------
window.dataLayer = window.dataLayer || [];

(function cargarGTM() {
    var cfg = window.SERCAFE_TRACKING;
    if (!cfg.activo) return;
    if (!cfg.GTM_ID || cfg.GTM_ID.indexOf("GTM-") !== 0 || cfg.GTM_ID === "GTM-XXXXXXX") {
        console.warn("[Ser Café tracking] Falta configurar GTM_ID en tracking.js");
        return;
    }

    (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
        var f = d.getElementsByTagName(s)[0],
            j = d.createElement(s),
            dl = l !== "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", cfg.GTM_ID);

    // GA4 directo (opcional / respaldo)
    if (cfg.GA4_ID && cfg.GA4_ID.indexOf("G-") === 0) {
        var g = document.createElement("script");
        g.async = true;
        g.src = "https://www.googletagmanager.com/gtag/js?id=" + cfg.GA4_ID;
        document.head.appendChild(g);
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", cfg.GA4_ID);
    }
})();

// ---------------------------------------------------------
// 3) CONSENTIMIENTO
//    Solo enviamos datos personales (aunque sean hasheados) si
//    el usuario dio consentimiento. Guardamos la decisión en
//    localStorage ("sercafe_consent" = "si" / "no").
// ---------------------------------------------------------
window.sercafeTieneConsentimiento = function () {
    try {
        return localStorage.getItem("sercafe_consent") === "si";
    } catch (e) {
        return false;
    }
};

// ---------------------------------------------------------
// 4) HASH SHA-256 (Enhanced Conversions)
//    Google exige los datos normalizados y hasheados en SHA-256
//    (hex, minúsculas). Normalización: trim + minúsculas; el
//    teléfono en formato E.164 (+57...), sin espacios ni guiones.
// ---------------------------------------------------------
async function sha256Hex(texto) {
    if (!texto) return "";
    var limpio = String(texto).trim().toLowerCase();
    if (!limpio) return "";
    var buffer = new TextEncoder().encode(limpio);
    var hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash))
        .map(function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
}

function normalizarTelefono(tel) {
    if (!tel) return "";
    var limpio = String(tel).replace(/[\s()-]/g, "");
    // Si no trae prefijo internacional, asumimos Colombia (+57).
    if (limpio && limpio[0] !== "+") {
        limpio = limpio.replace(/^0+/, "");
        limpio = "+57" + limpio;
    }
    return limpio;
}

function separarNombre(nombreCompleto) {
    var partes = String(nombreCompleto || "").trim().split(/\s+/);
    var nombre = partes.shift() || "";
    var apellido = partes.join(" ");
    return { nombre: nombre, apellido: apellido };
}

// Construye el objeto de datos de usuario hasheado para Enhanced Conversions.
async function construirUserData(datos) {
    datos = datos || {};
    var partes = separarNombre(datos.nombre);
    var tel = normalizarTelefono(datos.telefono);

    var userData = {};
    if (datos.email) userData.sha256_email_address = await sha256Hex(datos.email);
    if (tel)        userData.sha256_phone_number   = await sha256Hex(tel);

    var address = {};
    if (partes.nombre)   address.sha256_first_name = await sha256Hex(partes.nombre);
    if (partes.apellido) address.sha256_last_name  = await sha256Hex(partes.apellido);
    if (Object.keys(address).length) userData.address = address;

    return userData;
}

// ---------------------------------------------------------
// 5) EVENTOS DE CONVERSIÓN (push al dataLayer)
// ---------------------------------------------------------

// Compra confirmada
window.trackPurchase = async function (pedido, cliente) {
    if (!window.SERCAFE_TRACKING.activo) return;
    pedido = pedido || {};

    var evento = {
        event: "purchase",
        ecommerce: {
            transaction_id: pedido.transaction_id || "",
            value: Number(pedido.value) || 0,
            shipping: Number(pedido.shipping) || 0,
            currency: pedido.currency || "COP",
            items: pedido.items || []
        }
    };

    // Enhanced Conversions (solo con consentimiento y datos disponibles)
    if (cliente && window.sercafeTieneConsentimiento()) {
        try {
            evento.user_data = await construirUserData(cliente);
        } catch (e) { /* si falla el hash, enviamos la conversión sin user_data */ }
    }

    // Limpia ecommerce previo (recomendación de Google) y empuja el evento
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push(evento);
};

// Lead (formulario de contacto)
window.trackLead = async function (cliente) {
    if (!window.SERCAFE_TRACKING.activo) return;

    var evento = { event: "generate_lead", currency: "COP", value: 0 };

    if (cliente && window.sercafeTieneConsentimiento()) {
        try {
            evento.user_data = await construirUserData(cliente);
        } catch (e) { /* sin user_data */ }
    }

    window.dataLayer.push(evento);
};

// Clic en WhatsApp
window.trackWhatsApp = function (origen) {
    if (!window.SERCAFE_TRACKING.activo) return;
    window.dataLayer.push({
        event: "whatsapp_click",
        whatsapp_origen: origen || "desconocido"
    });
};
