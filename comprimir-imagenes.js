/**
 * comprimir-imagenes.js
 * ---------------------------------------------------------------
 * Optimiza las imágenes de la carpeta Img/ para web:
 *   - Redimensiona a un ancho máximo razonable (las actuales llegan
 *     a 5751x8001 px, lo que es enorme para una tienda web).
 *   - Genera versiones WebP (mucho más livianas que PNG/JPG).
 *   - Deja los originales intactos (escribe junto a ellos un .webp).
 *
 * ESTE ENTORNO (sandbox) NO TIENE INTERNET NI LIBRERÍAS DE IMAGEN,
 * por eso este script se ejecuta en TU máquina local:
 *
 *   1. cd a la carpeta del repo (donde está este archivo)
 *   2. npm init -y           (si no hay package.json)
 *   3. npm install sharp
 *   4. node comprimir-imagenes.js
 *
 * Después, para usar los WebP, cambia las rutas en el HTML/JS
 * (por ejemplo Img/CH-250gr.png -> Img/CH-250gr.webp) o usa
 * <picture> con fallback. Ver IMAGENES-README.md.
 * ---------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = path.join(__dirname, "Img");
const ANCHO_MAX = 1400;   // px: suficiente para producto/hero en alta densidad
const CALIDAD = 80;       // calidad WebP (0-100)

const EXTENSIONES = [".png", ".jpg", ".jpeg"];

async function procesarArchivo(rutaCompleta) {
    const ext = path.extname(rutaCompleta).toLowerCase();
    if (!EXTENSIONES.includes(ext)) return;

    const salida = rutaCompleta.replace(/\.(png|jpe?g)$/i, ".webp");

    try {
        const entrada = sharp(rutaCompleta);
        const meta = await entrada.metadata();

        let pipeline = entrada;
        if (meta.width && meta.width > ANCHO_MAX) {
            pipeline = pipeline.resize({ width: ANCHO_MAX });
        }

        await pipeline.webp({ quality: CALIDAD }).toFile(salida);

        const antes = fs.statSync(rutaCompleta).size;
        const despues = fs.statSync(salida).size;
        const ahorro = (100 - (despues / antes) * 100).toFixed(1);
        console.log(
            `✓ ${path.basename(rutaCompleta)} ` +
            `(${(antes / 1048576).toFixed(2)} MB) -> ` +
            `${path.basename(salida)} (${(despues / 1048576).toFixed(2)} MB) ` +
            `· -${ahorro}%`
        );
    } catch (e) {
        console.error(`✗ Error con ${rutaCompleta}:`, e.message);
    }
}

async function recorrer(dir) {
    const entradas = fs.readdirSync(dir, { withFileTypes: true });
    for (const entrada of entradas) {
        const ruta = path.join(dir, entrada.name);
        if (entrada.isDirectory()) {
            await recorrer(ruta);
        } else {
            await procesarArchivo(ruta);
        }
    }
}

(async () => {
    console.log("Comprimiendo imágenes en", DIR, "...\n");
    await recorrer(DIR);
    console.log("\nListo. Revisa los archivos .webp generados en Img/.");
})();
