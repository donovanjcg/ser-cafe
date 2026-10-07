// =========================================================
// COMPONENTES COMPARTIDOS - Ser Café
// Footer con redes sociales + botón flotante de WhatsApp
// Se inyectan automáticamente en todas las páginas.
// =========================================================

// --- Datos de contacto / redes ---
const SERCAFE_REDES = {
    whatsapp: "573145825227", // +57 314 582 5227 (formato internacional sin + ni espacios)
    whatsappMensaje: "Hola Ser Café, me gustaría más información sobre su café ☕",
    facebook: "https://www.facebook.com/share/1EkrrGGVoV/",
    instagram: "https://www.instagram.com/sercafe_?igsh=MTB3MzYyMnJxdHN5MA=="
};

// =========================================================
// FOOTER
// =========================================================
function inyectarFooter() {

    // Evitar duplicados si la página ya trae un footer
    if (document.querySelector("footer.footer-sercafe")) return;

    const anio = new Date().getFullYear();

    const footer = document.createElement("footer");
    footer.className = "footer-sercafe";
    footer.innerHTML = `
        <div class="footer-contenido">

            <img
                src="Img/logoSC-letra-02.png"
                alt="Ser Café"
                class="footer-logo">

            <p>Café de especialidad colombiano, desde la Finca Lucitania en Nariño.</p>

            <div class="footer-redes">
                <a href="${SERCAFE_REDES.facebook}" target="_blank" rel="noopener"
                    class="red-social facebook" aria-label="Facebook de Ser Café">
                    <img src="Img/facebook.svg" alt="Facebook">
                </a>
                <a href="${SERCAFE_REDES.instagram}" target="_blank" rel="noopener"
                    class="red-social instagram" aria-label="Instagram de Ser Café">
                    <img src="Img/instagram.svg" alt="Instagram">
                </a>
                <a href="https://wa.me/${SERCAFE_REDES.whatsapp}" target="_blank" rel="noopener"
                    class="red-social whatsapp" aria-label="WhatsApp de Ser Café">
                    <img src="Img/whatsapp.svg" alt="WhatsApp">
                </a>
            </div>

            <p class="footer-copy">© ${anio} Ser Café. Todos los derechos reservados.</p>

        </div>
    `;

    document.body.appendChild(footer);
}

// =========================================================
// BOTÓN FLOTANTE WHATSAPP
// =========================================================
function inyectarBotonWhatsApp() {

    if (document.querySelector(".whatsapp-flotante")) return;

    const enlace = document.createElement("a");
    enlace.className = "whatsapp-flotante";
    enlace.href =
        "https://wa.me/" +
        SERCAFE_REDES.whatsapp +
        "?text=" +
        encodeURIComponent(SERCAFE_REDES.whatsappMensaje);
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.setAttribute("aria-label", "Escríbenos por WhatsApp");
    enlace.innerHTML = `<img src="Img/whatsapp.svg" alt="WhatsApp">`;

    document.body.appendChild(enlace);
}

// =========================================================
// INICIO
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    inyectarFooter();
    inyectarBotonWhatsApp();
});
