// =========================
// PRODUCTOS
// =========================

const productos = [

    {
        id: 1,
        nombre: "Castillo Sur",
        presentacion: 250,
        precio: 23000,
        imagen: "Img/250gr.png"
    },
    {
        id: 2,
        nombre: "Castillo Sur",
        presentacion: 500,
        precio: 42000,
        imagen: "Img/500gr.png"
    },
    {
        id: 3,
        nombre: "Castillo Sur",
        presentacion: 2500,
        precio: 189900,
        imagen: "Img/2500gr.png"
    },

    {
        id: 4,
        nombre: "Chiroso",
        presentacion: 250,
        precio: 32000,
        imagen: "Img/250gr.png"
    },
    {
        id: 5,
        nombre: "Chiroso",
        presentacion: 500,
        precio: 59000,
        imagen: "Img/500gr.png"
    },
    {
        id: 6,
        nombre: "Chiroso",
        presentacion: 2500,
        precio: 247500,
        imagen: "Img/2500gr.png"
    },

    {
        id: 7,
        nombre: "Catimor",
        presentacion: 250,
        precio: 26000,
        imagen: "Img/250gr.png"
    },
    {
        id: 8,
        nombre: "Catimor",
        presentacion: 500,
        precio: 49000,
        imagen: "Img/500gr.png"
    },
    {
        id: 9,
        nombre: "Catimor",
        presentacion: 2500,
        precio: 219500,
        imagen: "Img/2500gr.png"
    }

];


// =========================
// CARRITO
// =========================

let carrito =
    JSON.parse(localStorage.getItem("carrito")) || [];


// =========================
// GUARDAR CARRITO
// =========================

function guardarCarrito() {

    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );

}


// =========================
// INVALIDAR BOTÓN EPAYCO
// =========================

function invalidarPago() {

    const contenedor =
        document.getElementById(
            "epayco-button-container"
        );

    if (contenedor) {
        contenedor.innerHTML = "";
    }

}


// =========================
// ABRIR CARRITO
// =========================

function abrirCarrito() {

    document
        .getElementById("carritoPanel")
        .classList.add("activo");

    document
        .getElementById("overlay")
        .classList.add("activo");

}


// =========================
// CERRAR CARRITO
// =========================

function cerrarCarrito() {

    document
        .getElementById("carritoPanel")
        .classList.remove("activo");

    document
        .getElementById("overlay")
        .classList.remove("activo");

}


// =========================
// CONTADOR
// =========================

function actualizarContador() {

    let total = 0;

    carrito.forEach(item => {
        total += item.cantidad;
    });

    document.getElementById(
        "contadorCarrito"
    ).innerText = total;

}


// =========================
// RENDER PRODUCTOS
// =========================

function renderProductos() {

    const contenedor =
        document.getElementById(
            "contenedorProductos"
        );

    const template =
        document.getElementById(
            "templateProducto"
        );

    contenedor.innerHTML = "";

    productos.forEach(producto => {

        const clone =
            template.content.cloneNode(true);

        clone.querySelector(
            ".producto-imagen"
        ).src = producto.imagen;

        clone.querySelector(
            ".producto-imagen"
        ).alt =
            producto.nombre +
            " " +
            producto.presentacion +
            "g";

        clone.querySelector(
            ".producto-imagen"
        ).onerror = function () {
            this.onerror = null;
            this.src = "Img/logoSC-10.png";
        };

        clone.querySelector(
            ".producto-nombre"
        ).innerText =
            producto.nombre;

        clone.querySelector(
            ".producto-presentacion"
        ).innerText =
            producto.presentacion + " g";

        clone.querySelector(
            ".producto-precio"
        ).innerText =
            "$" +
            producto.precio.toLocaleString(
                "es-CO"
            );

        let cantidad = 1;

        const cantidadSpan =
            clone.querySelector(
                ".cantidad"
            );

        clone.querySelector(
            ".aumentar"
        ).addEventListener(
            "click",
            () => {

                cantidad++;

                cantidadSpan.innerText =
                    cantidad;

            }
        );

        clone.querySelector(
            ".disminuir"
        ).addEventListener(
            "click",
            () => {

                if (cantidad > 1) {

                    cantidad--;

                    cantidadSpan.innerText =
                        cantidad;

                }

            }
        );

        clone.querySelector(
            ".btn-agregar"
        ).addEventListener(
            "click",
            (e) => {

                const card =
                    e.target.closest(
                        ".producto"
                    );

                const molienda =
                    card.querySelector(
                        ".molienda"
                    ).value;

                agregarAlCarrito(
                    producto,
                    molienda,
                    cantidad
                );

            }
        );

        contenedor.appendChild(
            clone
        );

    });

}


// =========================
// AGREGAR AL CARRITO
// =========================

function agregarAlCarrito(
    producto,
    molienda,
    cantidad
) {

    const existente =
        carrito.find(item =>
            item.id === producto.id &&
            item.molienda === molienda
        );

    if (existente) {

        existente.cantidad +=
            cantidad;

    } else {

        carrito.push({

            id:
                producto.id,

            nombre:
                producto.nombre,

            presentacion:
                producto.presentacion,

            precio:
                producto.precio,

            imagen:
                producto.imagen,

            molienda:
                molienda,

            cantidad:
                cantidad

        });

    }

    guardarCarrito();

    actualizarContador();

    renderCarrito();

    invalidarPago();

    actualizarResumen();

    mostrarToast(
        `${producto.nombre} ${producto.presentacion}g agregado al carrito`
    );

}


// =========================
// NOTIFICACIÓN (TOAST)
// =========================

let toastTimeout;

function mostrarToast(mensaje) {

    let toast =
        document.getElementById("toastCarrito");

    if (!toast) {

        toast = document.createElement("div");
        toast.id = "toastCarrito";
        toast.className = "toast-carrito";
        document.body.appendChild(toast);

    }

    toast.innerText = mensaje;
    toast.classList.add("activo");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("activo");
    }, 2500);

}


// =========================
// RENDER CARRITO
// =========================

function renderCarrito() {

    const contenedor =
        document.getElementById(
            "carritoItems"
        );

    contenedor.innerHTML = "";

    if (
        carrito.length === 0
    ) {

        contenedor.innerHTML =
            "<p>Tu carrito está vacío</p>";

        return;

    }

    carrito.forEach(
        (item, index) => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "item-carrito";

            div.innerHTML = `

                <img
                    src="${item.imagen}"
                    class="img-carrito"
                    onerror="this.onerror=null;this.src='Img/logoSC-10.png';">

                <div class="info-carrito">

                    <strong>
                        ${item.nombre}
                    </strong>

                    <br>

                    ${item.presentacion} g

                    <br>

                    ${item.molienda}

                    <br>

                    $${item.precio.toLocaleString("es-CO")}

                </div>

                <div class="acciones-carrito">

                    <button
                        onclick="disminuirCarrito(${index})">
                        -
                    </button>

                    <span>
                        ${item.cantidad}
                    </span>

                    <button
                        onclick="aumentarCarrito(${index})">
                        +
                    </button>

                    <button
                        onclick="eliminarProducto(${index})">
                        🗑️
                    </button>

                </div>

            `;

            contenedor.appendChild(
                div
            );

        }
    );
    actualizarResumen();
}


// =========================
// AUMENTAR
// =========================

function aumentarCarrito(
    index
) {

    carrito[index].cantidad++;

    guardarCarrito();

    renderCarrito();

    actualizarContador();

    invalidarPago();

    actualizarResumen();

}


// =========================
// DISMINUIR
// =========================

function disminuirCarrito(
    index
) {

    if (
        carrito[index].cantidad > 1
    ) {

        carrito[index].cantidad--;

    } else {

        carrito.splice(
            index,
            1
        );

    }

    guardarCarrito();

    renderCarrito();

    actualizarContador();

    invalidarPago();

    actualizarResumen();

}


// =========================
// ELIMINAR
// =========================

function eliminarProducto(
    index
) {

    carrito.splice(
        index,
        1
    );

    guardarCarrito();

    renderCarrito();

    actualizarContador();

    invalidarPago();

    actualizarResumen();

}


// =========================
// INICIO
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderProductos();

        renderCarrito();

        actualizarContador();

        actualizarResumen();

    }
);

// =========================
// MUNICIPIOS
// =========================

const municipiosPorDepartamento = {

    "Antioquia": [

        "Medellín",
        "Envigado",
        "Bello",
        "La Estrella",
        "Sabaneta",
        "Copacabana",
        "Girardota",
        "Itagüí",
        "Rionegro",
        "Caldas",
        "Guarne",
        "Otro"

    ],

    "Otro": [

        "Otro"

    ]

};

// =========================
// CARGAR MUNICIPIOS
// =========================

function cargarMunicipios() {

    const departamento =
        document.getElementById(
            "departamento"
        ).value;

    const municipioSelect =
        document.getElementById(
            "municipio"
        );

    municipioSelect.innerHTML =
        '<option value="">Seleccione municipio</option>';

    if (
        municipiosPorDepartamento[
            departamento
        ]
    ) {

        municipiosPorDepartamento[
            departamento
        ].forEach(
            municipio => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    municipio;

                option.textContent =
                    municipio;

                municipioSelect.appendChild(
                    option
                );

            }
        );

    }

    actualizarResumen();

}

// =========================
// PESO FACTURABLE
// =========================

function calcularKilosFacturables() {

    let gramosTotales = 0;

    carrito.forEach(item => {

        const pesoUnitario =

            item.presentacion + 300;

        gramosTotales +=
            pesoUnitario *
            item.cantidad;

    });

    return Math.ceil(
        gramosTotales / 1000
    );

}

// =========================
// ENVÍO
// =========================

function calcularEnvio() {

    const departamento =
        document.getElementById(
            "departamento"
        ).value;

    const municipio =
        document.getElementById(
            "municipio"
        ).value;

    const gratis = [

        "Medellín",
        "Envigado",
        "Bello",
        "La Estrella",
        "Sabaneta",
        "Copacabana",
        "Girardota",
        "Itagüí"

    ];

    if (
        departamento === "Antioquia" &&
        gratis.includes(
            municipio
        )
    ) {

        return 0;

    }

    let envio = 18000;

    if (
        departamento === "Antioquia"
    ) {

        if (
            [
                "Rionegro",
                "Caldas"
            ].includes(
                municipio
            )
        ) {

            envio = 8800;

        }

        if (
            municipio === "Guarne"
        ) {

            envio = 11000;

        }

    }

    const kilos =
        calcularKilosFacturables();

    if (
        kilos > 1
    ) {

        envio +=
            (
                kilos - 1
            ) * 4400;

    }

    return envio;

}

// =========================
// SUBTOTAL
// =========================

function calcularSubtotal() {

    let subtotal = 0;

    carrito.forEach(item => {

        subtotal +=

            item.precio *
            item.cantidad;

    });

    return subtotal;

}

// =========================
// RESUMEN
// =========================

function actualizarResumen() {

    const subtotal =
        calcularSubtotal();

    const envio =
        calcularEnvio();

    const total =
        subtotal + envio;

    document.getElementById(
        "subtotal"
    ).innerText =

        "$" +
        subtotal.toLocaleString(
            "es-CO"
        );

    document.getElementById(
        "envio"
    ).innerText =

        "$" +
        envio.toLocaleString(
            "es-CO"
        );

    document.getElementById(
        "totalPagar"
    ).innerText =

        "$" +
        total.toLocaleString(
            "es-CO"
        );

}

// =========================
// DESCRIPCIÓN PEDIDO
// =========================

function construirDescripcionPedido() {

    return carrito.map(item => {

        return `${item.nombre} ${item.presentacion}g - ${item.molienda} x ${item.cantidad}`;

    }).join(" | ");

}

// =========================
// DETALLE PEDIDO
// =========================

function construirDetallePedido() {

    const departamento =
        document.getElementById("departamento").value;

    const municipio =
        document.getElementById("municipio").value;

    return JSON.stringify({

        fecha: new Date().toISOString(),

        departamento,

        municipio,

        subtotal: calcularSubtotal(),

        envio: calcularEnvio(),

        total: calcularSubtotal() + calcularEnvio(),

        productos: carrito

    });

}

// =========================
// LIMPIAR EPAYCO
// =========================

function invalidarPago() {

    const contenedor =
        document.getElementById(
            "epayco-button-container"
        );

    if (contenedor) {

        contenedor.innerHTML = "";

    }

}

// =========================
// GENERAR PAGO
// =========================

function generarBotonPago() {

    if (carrito.length === 0) {

        alert(
            "Agrega productos al carrito"
        );

        return;

    }

    const departamento =
        document.getElementById(
            "departamento"
        ).value;

    const municipio =
        document.getElementById(
            "municipio"
        ).value;

    if (!departamento) {

        alert(
            "Selecciona el departamento"
        );

        return;

    }

    if (!municipio) {

        alert(
            "Selecciona el municipio"
        );

        return;

    }

    const total =

        calcularSubtotal() +
        calcularEnvio();

    invalidarPago();

    const contenedor =
        document.getElementById(
            "epayco-button-container"
        );

    const referencia =

        "SERCAFE-" +
        Date.now();

    const descripcion =
        construirDescripcionPedido();

    const detalle =
        construirDetallePedido();

    const script =
        document.createElement(
            "script"
        );

    script.src =
        "https://checkout.epayco.co/checkout.js";

    script.setAttribute(
        "class",
        "epayco-button"
    );

    script.setAttribute(
        "data-epayco-key",
        "30a566319a8faf42b3c7728630533513"
    );

    script.setAttribute(
        "data-epayco-amount",
        total
    );

    script.setAttribute(
        "data-epayco-tax",
        "0"
    );

    script.setAttribute(
        "data-epayco-tax-base",
        "0"
    );

    script.setAttribute(
        "data-epayco-tax-ico",
        "0"
    );

    script.setAttribute(
        "data-epayco-name",
        "Pedido Ser Café"
    );

    script.setAttribute(
        "data-epayco-description",
        descripcion
    );

    script.setAttribute(
        "data-epayco-ref_payco",
        referencia
    );

    script.setAttribute(
        "data-epayco-currency",
        "COP"
    );

    script.setAttribute(
        "data-epayco-country",
        "CO"
    );

    script.setAttribute(
        "data-epayco-test",
        "false"
    );

    script.setAttribute(
        "data-epayco-external",
        "false"
    );

    // URL de respuesta
    script.setAttribute(
        "data-epayco-response",
        "https://script.google.com/macros/s/AKfycbz5YHtZpU3QLR0GzPLOo0iXgIPcivR9nHHZX76MuRyUDB9omOpL1f5W6b68sCtTBYUPqA/exec"
    );

    // URL confirmación
    script.setAttribute(
        "data-epayco-confirmation",
        "https://ser-cafe.com/#details"
    );

    script.setAttribute(
        "data-epayco-button",
        "https://multimedia.epayco.co/dashboard/btns/btn2.png"
    );

    // Información adicional

    script.setAttribute(
        "data-epayco-extra1",
        detalle
    );

    script.setAttribute(
        "data-epayco-extra2",
        departamento
    );

    script.setAttribute(
        "data-epayco-extra3",
        municipio
    );

    contenedor.appendChild(
        script
    );

}