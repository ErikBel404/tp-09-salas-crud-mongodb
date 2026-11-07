// Listas de valores permitidos
const {
  salasPermitidas,
  turnosPermitidos,
} = require("./../../datos/constantes");

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  next();
}

// Middleware de validación del formulario y de la API
function validarReserva(req, res, next) {
  const valores = req.body ?? {};

  // Función auxiliar para responder según sea la API o el sitio web
  function responderError(mensaje) {
    if (req.baseUrl.startsWith("/api")) {
      return res.status(400).json({ error: mensaje });
    }
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      error: mensaje,
      valores,
      salasPermitidas,
      turnosPermitidos,
    });
  }

  // Extracción segura verificando tipo string
  const estudiante =
    typeof valores.estudiante === "string" ? valores.estudiante.trim() : "";
  const email = typeof valores.email === "string" ? valores.email.trim() : "";
  const sala = typeof valores.sala === "string" ? valores.sala.trim() : "";
  const fecha = typeof valores.fecha === "string" ? valores.fecha.trim() : "";
  const turno = typeof valores.turno === "string" ? valores.turno.trim() : "";

  // Validación estricta del tipo numérico (evita true, false, [], {})
  const personasRecibidas = valores.personas;

  const tipoPersonasValido =
    typeof personasRecibidas === "number" ||
    (typeof personasRecibidas === "string" && personasRecibidas.trim() !== "");

  const personas = tipoPersonasValido ? Number(personasRecibidas) : NaN;

  // 1. Campos de texto obligatorios
  if (!estudiante || !email || !sala || !fecha || !turno) {
    return responderError("Todos los campos son obligatorios.");
  }

  // 2. Validación de email con @
  if (!email.includes("@")) {
    return responderError(
      "El correo electrónico debe ser válido y contener '@'.",
    );
  }

  // 3. Sala permitida
  if (!salasPermitidas.includes(sala)) {
    return responderError("La sala seleccionada no es válida.");
  }

  // 4. Turno permitido
  if (!turnosPermitidos.includes(turno)) {
    return responderError("El turno seleccionado no es válido.");
  }

  // 5. Cantidad de personas: entero entre 1 y 6
  if (!Number.isInteger(personas) || personas < 1 || personas > 6) {
    return responderError(
      "La cantidad de personas debe ser un número entero entre 1 y 6.",
    );
  }

  // Se asignan únicamente los 6 campos admitidos (ignora estado o _id)
  req.reservaValidada = {
    estudiante,
    email,
    sala,
    fecha,
    turno,
    personas,
  };

  next();
}

module.exports = { prepararAreaReservas, validarReserva };
