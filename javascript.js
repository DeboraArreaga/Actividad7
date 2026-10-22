/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */

// ==========================================
// 1. CONFIGURACIÓN DE LA BASE DE DATOS (IndexedDB con Dexie)
// ==========================================
const db = new Dexie("RestauranteDB");

db.version(1).stores({
    pedidos: '++id, plato, bebida, extras, total, fecha'
});

// ==========================================
// UTILIDAD: Toast (notificación flotante)
// ==========================================
function mostrarToast(mensaje, color = "#28a745") {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = mensaje;
    toast.style.background = color;
    toast.classList.add("visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

// ==========================================
// 2. EVENTO DEL FORMULARIO
// ==========================================
document.getElementById('formularioRestaurante').addEventListener('submit', async function(event) {
    event.preventDefault();

    // 🆕 PRECIOS ACTUALIZADOS: agregamos 'pollo' y 'pieQueso'
    const PRECIOS = {
        pizza: 12.00,
        hamburguesa: 7.50,
        pollo: 8.00,          // ← NUEVO
        pequena: 1.00,
        mediana: 1.50,
        grande: 2.00,
        papas: 2.50,
        helado: 1.80,
        pieQueso: 3.00        // ← NUEVO
    };

    let cuentaDetalle = "<strong>🧾 DETALLE DE TU PEDIDO:</strong><br><hr>";
    let total = 0;

    // Capturar Plato
    const plato = document.getElementById('platoPrincipal').value;
    if (plato === 'pizza') {
        total += PRECIOS.pizza;
        cuentaDetalle += `• Pizza Familiar: $${PRECIOS.pizza.toFixed(2)}<br>`;
    } else if (plato === 'hamburguesa') {
        total += PRECIOS.hamburguesa;
        cuentaDetalle += `• Hamburguesa con Queso: $${PRECIOS.hamburguesa.toFixed(2)}<br>`;
    } else if (plato === 'pollo') {  // 🆕 NUEVO PLATO
        total += PRECIOS.pollo;
        cuentaDetalle += `• Pollo Frito: $${PRECIOS.pollo.toFixed(2)}<br>`;
    }

    // Capturar Bebida
    const bebidaSeleccionada = document.querySelector('input[name="tamanoBebida"]:checked').value;
    total += PRECIOS[bebidaSeleccionada];
    cuentaDetalle += `• Bebida (${bebidaSeleccionada}): $${PRECIOS[bebidaSeleccionada].toFixed(2)}<br>`;

    // Capturar Extras
    const quierePapas = document.getElementById('extraPapas').checked;
    const quiereHelado = document.getElementById('extraHelado').checked;
    const quierePieQueso = document.getElementById('extraPieQueso').checked;  // 🆕 NUEVO EXTRA
    let listaExtras = [];

    if (quierePapas) {
        total += PRECIOS.papas;
        listaExtras.push("Papas Fritas");
        cuentaDetalle += `• Extra Papas Fritas: $${PRECIOS.papas.toFixed(2)}<br>`;
    }
    if (quiereHelado) {
        total += PRECIOS.helado;
        listaExtras.push("Helado");
        cuentaDetalle += `• Extra Helado: $${PRECIOS.helado.toFixed(2)}<br>`;
    }
    if (quierePieQueso) {  // 🆕 NUEVO EXTRA
        total += PRECIOS.pieQueso;
        listaExtras.push("Pie de Queso");
        cuentaDetalle += `• Extra Pie de Queso: $${PRECIOS.pieQueso.toFixed(2)}<br>`;
    }

    cuentaDetalle += `<hr><strong>💰 TOTAL A PAGAR: $${total.toFixed(2)}</strong>`;

    // Mostrar el recibo en pantalla
    const areaRecibo = document.getElementById('reciboRespuesta');
    areaRecibo.innerHTML = cuentaDetalle;
    areaRecibo.style.display = "block";

    areaRecibo.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // ==========================================
    // 3. GUARDAR LOS DATOS EN LA BASE DE DATOS
    // ==========================================
    try {
        await db.pedidos.add({
            plato: plato,
            bebida: bebidaSeleccionada,
            extras: listaExtras.join(", ") || "Ninguno",
            total: total,
            fecha: new Date().toLocaleString()
        });

        mostrarToast("✅ Pedido guardado en la base de datos");
    } catch (error) {
        console.error("Error al guardar en la base de datos: ", error);
        mostrarToast("❌ Error al guardar el pedido", "#dc3545");
    }
});

// ==========================================
// 4. FUNCIONALIDAD DE ADMINISTRACIÓN
// ==========================================
async function actualizarHistorialPantalla() {
    const divHistorial = document.getElementById('tablaHistorial');
    const todosLosPedidos = await db.pedidos.toArray();

    if (todosLosPedidos.length === 0) {
        divHistorial.innerHTML = "<p style='text-align:center; color:#6c757d;'>No hay pedidos registrados todavía.</p>";
        return;
    }

    let htmlContenido = "";
    let gananciasTotales = 0;

    todosLosPedidos.forEach(function(pedido) {
        gananciasTotales += pedido.total;
        htmlContenido += `
            <div class="item-pedido">
                <strong>Pedido #${pedido.id}</strong> — 📅 ${pedido.fecha}<br>
                🍕 Plato: ${pedido.plato} | 🥤 Bebida: ${pedido.bebida}<br>
                🍟 Extras: ${pedido.extras}<br>
                💰 Subtotal: <strong>$${pedido.total.toFixed(2)}</strong>
            </div>
        `;
    });

    htmlContenido = `<strong>📈 Caja Total: $${gananciasTotales.toFixed(2)}</strong><br><hr>` + htmlContenido;
    divHistorial.innerHTML = htmlContenido;
}

// BOTÓN 1: Mostrar / Ocultar Historial
document.getElementById('btnVerHistorial').addEventListener('click', async function() {
    const divHistorial = document.getElementById('tablaHistorial');

    if (divHistorial.style.display === "none" || divHistorial.style.display === "") {
        await actualizarHistorialPantalla();
        divHistorial.style.display = "block";
    } else {
        divHistorial.style.display = "none";
    }
});

// BOTÓN 2: Vaciar toda la Base de Datos
document.getElementById('btnBorrarHistorial').addEventListener('click', async function() {
    const confirmar = confirm("⚠ ¿Estás seguro de que deseas eliminar TODOS los pedidos del historial?");

    if (confirmar) {
        await db.pedidos.clear();
        mostrarToast("🗑️ Base de datos vaciada", "#6c757d");
        actualizarHistorialPantalla();
    }
});

