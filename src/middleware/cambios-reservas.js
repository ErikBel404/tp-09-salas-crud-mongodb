const estadosPermitidos = ["pendiente", "confirmada"];

const camposPermitidosPut = [
  "estudiante",
  "email",
  "sala",
  "fecha",
  "turno",
  "personas",
  "estado",
];

function validarReemplazoReserva(req, res, next) {
  const datos = req.body;

  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return res.status(400).json({ error: "Enviá un objeto JSON." });
  }

  for (const campo of Object.keys(datos)) {
    if (!camposPermitidosPut.includes(campo)) {
      return res
        .status(400)
        .json({ error: `El campo ${campo} no se puede modificar.` });
    }
  }

  if (
    typeof datos.estado !== "string" ||
    !estadosPermitidos.includes(datos.estado)
  ) {
    return res
      .status(400)
      .json({ error: "El estado debe ser 'pendiente' o 'confirmada'." });
  }

  req.cambiosValidos = {
    ...req.reservaValidada,
    estado: datos.estado,
  };

  next();
}

function validarActualizacionReserva(req, res, next) {
  const datos = req.body;

  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return res.status(400).json({ error: "Enviá un objeto JSON." });
  }

  const claves = Object.keys(datos);
  for (const campo of claves) {
    if (campo !== "personas" && campo !== "estado") {
      return res
        .status(400)
        .json({ error: "Solo se puede cambiar personas o estado." });
    }
  }

  if (datos.personas === undefined && datos.estado === undefined) {
    return res.status(400).json({ error: "Enviá personas o estado." });
  }

  const cambios = {};

  if (datos.personas !== undefined) {
    const valorPersonas = datos.personas;
    const esTipoValido =
      typeof valorPersonas === "number" ||
      (typeof valorPersonas === "string" && valorPersonas.trim() !== "");

    const numeroPersonas = esTipoValido ? Number(valorPersonas) : NaN;

    if (
      !Number.isInteger(numeroPersonas) ||
      numeroPersonas < 1 ||
      numeroPersonas > 6
    ) {
      return res
        .status(400)
        .json({ error: "Personas debe ser un número entero entre 1 y 6." });
    }

    cambios.personas = numeroPersonas;
  }

  if (datos.estado !== undefined) {
    if (
      typeof datos.estado !== "string" ||
      !estadosPermitidos.includes(datos.estado)
    ) {
      return res
        .status(400)
        .json({ error: "El estado debe ser 'pendiente' o 'confirmada'." });
    }

    cambios.estado = datos.estado;
  }

  req.cambiosValidos = cambios;
  next();
}

module.exports = {
  validarReemplazoReserva,
  validarActualizacionReserva,
};
