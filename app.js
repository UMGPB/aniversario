/* ============================================================
   ANIVERSARIO UMG 2026 — Utilidades compartidas (app.js)
   Conexión con el backend de Google Apps Script + manejo de sesión
   ============================================================ */

// ⚠️ IMPORTANTE: si hay algun inconveniente o error hay que recordar reemplazar esta URL por la de la Web App publicado
// (Apps Script → Implementar → Nueva implementación → Aplicación web)
const API_URL = "https://script.google.com/macros/s/AKfycbwR_UmTuLyidlCNzrrv78jP70rxIOczfe7rpd5NceQHVvpuShO6hWkqJ9PPguACS2eg2A/exec";

/**
 * Llama al backend de Apps Script enviando una "acción" y datos asociados.
 * Centralizar esto evita repetir el mismo bloque fetch en cada página.
 */
async function llamarAPI(accion, datos = {}) {
  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      // Apps Script Web Apps requieren este content-type para no disparar
      // un preflight CORS que el servicio no responde correctamente.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ accion, ...datos })
    });
    return await respuesta.json();
  } catch (error) {
    return { ok: false, error: "No se pudo conectar con el servidor. Verifica tu conexión." };
  }
}

/* ---------------- MANEJO DE SESIÓN ---------------- */
// Guardamos los datos del usuario en sessionStorage: se borran solos
// al cerrar la pestaña, y son independientes por pestaña/dispositivo.

function guardarSesion(usuario) {
  sessionStorage.setItem("umg_sesion", JSON.stringify(usuario));
}

function obtenerSesion() {
  const data = sessionStorage.getItem("umg_sesion");
  return data ? JSON.parse(data) : null;
}

function cerrarSesion() {
  sessionStorage.removeItem("umg_sesion");
  window.location.href = "login.html";
}

/**
 * Protege una página: si no hay sesión activa, redirige al login.
 * Si se pasa un arreglo de roles permitidos y el rol del usuario no
 * está incluido, también redirige (bloqueo de acceso directo por URL).
 */
function requerirSesion(rolesPermitidos = null) {
  const sesion = obtenerSesion();
  if (!sesion) {
    window.location.href = "login.html";
    return null;
  }
  if (rolesPermitidos && !rolesPermitidos.includes(sesion.rol)) {
    alert("No tienes permiso para acceder a esta sección.");
    window.location.href = "index.html";
    return null;
  }
  return sesion;
}

/**
 * Pinta el bloque de usuario (nombre + rol) en el header de cada página
 * y conecta el botón de salir. Se llama una vez al cargar cada página.
 */
function pintarHeaderUsuario(sesion) {
  const nombreEl = document.getElementById("headerNombre");
  const rolEl = document.getElementById("headerRol");
  if (nombreEl) nombreEl.textContent = sesion.nombre;
  if (rolEl) rolEl.textContent = sesion.rol;

  const btnSalir = document.getElementById("btnSalir");
  if (btnSalir) btnSalir.addEventListener("click", cerrarSesion);
}

/* ---------------- FORMATO DE MONEDA ---------------- */
function formatoQuetzales(valor) {
  const numero = parseFloat(valor) || 0;
  return "Q" + numero.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------------- COUNTDOWN AL EVENTO ---------------- */
// ⌚⏰💡El evento es el 01 de agosto de 2026 a las 18:00 hrs (hora local de Guatemala)
const FECHA_EVENTO = new Date("2026-08-01T18:00:00");
//El formato es: AAAA-MM-DDTHH:MM:SS-06:00, la parte -06:00 es la zona horaria de Guatemala, pero no se incluye porque crea conflicto.
/* Se puede usar UTC equivalente: 18:00 GMT-6 = 00:00 del día siguiente en UTC. 
     Esto evita que distintos navegadores interpreten la zona horaria de forma
     diferente y muestren horas incorrectas (como el "00 HRS" que se veía antes).
const FECHA_EVENTO = new Date("2026-08-02T00:00:00Z"); // equivale a 01-ago-2026 18:00 GMT-6 */


function iniciarCountdown() {
  const elDias = document.getElementById("cdDias");
  const elHoras = document.getElementById("cdHoras");
  const elMinutos = document.getElementById("cdMinutos");
  const elSegundos = document.getElementById("cdSegundos");
  if (!elDias) return; // esta página no tiene countdown

/*El contenedor completo de la barra (".countdown-bar"), para poder
 reemplazar todo su contenido por el mensaje cuando el evento ya inició. */
  const contenedor = elDias.closest(".countdown-bar");
  let mensajeYaMostrado = false;

   function actualizar() {
    const ahora = new Date();
    let diferencia = FECHA_EVENTO - ahora;

/* función solo contador countdown pero al llegar a la fecha y hora se queda en 00:00:00
    if (diferencia <= 0) {
      elDias.textContent = "00";
      elHoras.textContent = "00";
      elMinutos.textContent = "00";
      elSegundos.textContent = "00";
      return;
    } */
/* condición que hace que si el countdown llego a la fecha y hora no se quede en 00:00 
   sino que muestre otro mensaje*/
if (diferencia <= 0) {
      /* 🚩 Ya llegó (o pasó) la fecha/hora del evento: se reemplaza la barra
         de números por un mensaje único. Se hace solo una vez (mensajeYaMostrado)
         para no estar reescribiendo el HTML en cada segundo del intervalo y evitar 
         que parpadee constantemente */
      
   if (!mensajeYaMostrado && contenedor) {
        contenedor.innerHTML = '<span class="cd-evento-iniciado">🎉 ¡El evento ha comenzado!</span>';
        mensajeYaMostrado = true;
      }
      return;
    }
      
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
    const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
    const segundos = Math.floor((diferencia / 1000) % 60);

    elDias.textContent = String(dias).padStart(2, "0");
    elHoras.textContent = String(horas).padStart(2, "0");
    elMinutos.textContent = String(minutos).padStart(2, "0");
    elSegundos.textContent = String(segundos).padStart(2, "0");
  }

  actualizar();
  setInterval(actualizar, 1000);
}
