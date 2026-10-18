# Configuración de Tracking — Ser Café

Este documento explica **qué ya quedó listo en el código** y **qué tienes que
configurar tú** en Google Tag Manager (GTM), Google Analytics 4 (GA4) y Google Ads.

> ⚠️ La conexión a tus cuentas de Google (crear etiquetas, publicar el contenedor,
> definir conversiones) **se hace desde los paneles web de Google**; no puede
> automatizarse desde el código. Lo que sí está listo es todo el disparo de eventos
> en la web, que es la parte técnica.

---

## 1. Lo que ya quedó en el código

- **`tracking.js`** carga GTM (y opcionalmente GA4) y expone tres funciones:
  - `trackPurchase(pedido, cliente)` → evento **`purchase`**
  - `trackLead(cliente)` → evento **`generate_lead`**
  - `trackWhatsApp(origen)` → evento **`whatsapp_click`**
- Los eventos se envían al **`dataLayer`** (estándar de GTM).
- **Enhanced Conversions**: email, nombre y teléfono se envían **hasheados en
  SHA-256** dentro de `user_data`, y **solo si el usuario dio consentimiento**.
- Se agregó al carrito la captura de **nombre, correo y teléfono** + un
  **checkbox de consentimiento**, y una página **`privacidad.html`**.

### Dónde se dispara cada evento
| Evento | Dónde | Datos de cliente |
|---|---|---|
| `purchase` | `gracias.html` (pago aceptado) | sí (del carrito) |
| `generate_lead` | `contactanos.html` (formulario) | sí (del formulario) |
| `whatsapp_click` | botón flotante y cualquier enlace `wa.me` | no |

---

## 2. Pega tus IDs

Edita **`tracking.js`** (parte superior):

```js
window.SERCAFE_TRACKING = {
    GTM_ID: "GTM-XXXXXXX",   // <-- tu ID de Google Tag Manager
    GA4_ID: "",              // opcional: G-XXXXXXXXXX si no usas GA4 dentro de GTM
    activo: true
};
```

---

## 3. Configuración en Google Tag Manager

1. Crea (o abre) tu contenedor GTM y copia el ID `GTM-XXXXXXX` a `tracking.js`.
2. **Variables** → activa las variables integradas de capa de datos o crea
   *Variables de capa de datos* para:
   - `ecommerce.transaction_id`, `ecommerce.value`, `ecommerce.shipping`,
     `ecommerce.currency`, `ecommerce.items`
   - `user_data`
   - `whatsapp_origen`
3. **Activadores (Triggers)** → *Evento personalizado* para cada uno:
   - `purchase`
   - `generate_lead`
   - `whatsapp_click`
4. **Etiquetas (Tags)**:
   - **GA4 Configuration** (tu `G-XXXXXXXXXX`).
   - **GA4 Event** `purchase` (con los parámetros de `ecommerce`).
   - **GA4 Event** `generate_lead`.
   - **GA4 Event** `whatsapp_click`.
   - **Google Ads Conversion Tracking** para compra y para lead (ver paso 5).
   - **Google Ads — Enhanced Conversions**: en la etiqueta de conversión,
     activa *Enhanced conversions* y mapea el campo **User-provided data** a la
     variable `user_data` (ya viene hasheada desde el código).
5. **Publica** el contenedor.

---

## 4. Google Analytics 4

- Marca `purchase`, `generate_lead` y `whatsapp_click` como **eventos clave**
  (Admin → Eventos).
- Si quieres el embudo de e-commerce completo, usa el reporte de Monetización
  (el evento `purchase` ya envía `items`, `value` y `currency`).

---

## 5. Google Ads — Conversiones

1. **Herramientas → Conversiones → Nueva acción de conversión → Sitio web.**
2. Crea estas acciones de conversión e **impórtalas desde GA4** o vincúlalas a la
   etiqueta de GTM:
   - **Compra** (valor = `value`, moneda COP, transacción única).
   - **Lead** (formulario de contacto).
   - **Contacto WhatsApp** (recuento: una por clic).
3. En **Compra** y **Lead**, activa **Conversiones mejoradas (Enhanced
   Conversions)** → método **Google Tag Manager** → mapea `user_data`.
4. Para que Google "busque más gente así" (públicos similares / Smart Bidding):
   - Vincula Google Ads con GA4.
   - Usa la conversión de **Compra** con Enhanced Conversions como objetivo de
     puja; Google usará los datos (hasheados) para mejorar el emparejamiento y
     generar audiencias similares.

---

## 6. Privacidad y consentimiento (importante)

- Los datos personales solo se envían si el usuario marca el **checkbox de
  consentimiento** del carrito (se guarda en `localStorage` como
  `sercafe_consent`).
- Revisa y ajusta **`privacidad.html`** con tus datos reales (razón social,
  NIT, correo de contacto para derechos Habeas Data).
- Recomendado: configurar el **Modo de Consentimiento (Consent Mode v2)** de
  Google en GTM para cumplir con la normativa.

---

## 7. Compra: arquitectura recomendada (navegador + servidor)

ePayco **no devuelve** el email/nombre/teléfono del comprador en la URL de
retorno del navegador, pero **sí los envía en el webhook de confirmación**
servidor-a-servidor (`data-epayco-confirmation`, que ya apunta a tu Apps Script).
Aprovechamos eso con un esquema de dos capas:

| Capa | Archivo | Para qué sirve |
|---|---|---|
| **Navegador** | `gracias.js` → evento `purchase` | Medición en **GA4** (reportes de e-commerce). Rápido pero depende de que el cliente vuelva al sitio. |
| **Servidor** | `apps-script-epayco.gs` | **Conversión de compra de Google Ads con Enhanced Conversions**. Fiable (ePayco siempre llama al webhook) y con el **email/nombre reales** del pago. |

**Para evitar doble conteo en Google Ads:** cuenta la conversión de **Compra de
Google Ads** SOLO desde el servidor (Apps Script). En GTM, la etiqueta GA4
`purchase` del navegador sirve para analítica, no la enlaces como conversión de
Ads si ya la subes por servidor.

### Configurar el Apps Script de ePayco (`apps-script-epayco.gs`)
Este archivo es la **versión extendida de tu script actual**. Mantiene tu lógica
(Lock, Logs, Pedidos, número de pedido `SC...`, correos) y corrige/añade cosas.

1. En tu proyecto Apps Script de confirmación, reemplaza tu `doPost` y
   `generarNumeroPedido` por los de este archivo. **Conserva tus funciones
   `enviarCorreoCliente()` y `enviarCorreoSerCafe()`** (no las incluí para no
   sobrescribirlas).
2. Ejecuta **una vez** `guardarSecretos()` desde el editor para guardar las
   credenciales en `PropertiesService`; luego borra los valores del código.
3. Implementa una **versión nueva** (Ejecutar como: Yo · Acceso: Cualquiera).
4. Mientras `ADS_ACTIVO = "false"`, toda venta aprobada se guarda en la hoja
   **"Pedidos"** (como ya hacías). Puedes subir esas conversiones a Google Ads
   manualmente (importación de conversiones offline con datos de cliente).
5. Al poner `ADS_ACTIVO = "true"` con las credenciales OAuth + developer token,
   cada compra aprobada sube la Enhanced Conversion a Google Ads **en tiempo real**.

#### Correcciones y mejoras aplicadas sobre tu script
- 🐛 **Detalle del pedido:** tu código parseaba `x_description` (texto plano),
  por eso las columnas de molienda/tamaño/total quedaban vacías. El JSON real
  del pedido viaja en **`x_extra1`**; ahora se lee de ahí. Como hay varios
  productos, se guarda un resumen de moliendas y tamaños.
- 🔒 **Firma:** ePayco usa **MD5** (tu código ya lo hacía bien). Se mantiene.
- 🔑 **Credenciales fuera del código:** `p_key` y las de Google Ads se leen de
  `PropertiesService`, no se escriben en el archivo.

> ⚠️ **Seguridad urgente:** tu `p_key` de ePayco quedó visible en el chat.
> **Rótala** en el panel de ePayco (Integraciones) y guarda la nueva con
> `guardarSecretos()`.

### ¿Y los datos que capturamos en el carrito?
Siguen siendo útiles: pre-llenan el checkout de ePayco y se guardan en
`ultimoPedido` para mostrar el resumen en `gracias.html`. La fuente de verdad
para Google Ads, sin embargo, es el webhook del servidor.
