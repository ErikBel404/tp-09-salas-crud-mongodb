function crearManejadorErrores({ vistaFormulario, tituloFormulario }) {
  return function manejarErrores(error, req, res, next) {
    if (res.headersSent) {
      return next(error);
    }

    const esValidacion = error.name === "ValidationError";
    const esEntrada =
      esValidacion ||
      error.name === "CastError" ||
      error.codigo === "ENTRADA_INVALIDA" ||
      error.codigo === "ID_INVALIDO" ||
      error.codigo === "FILTRO_INVALIDO" ||
      error.type === "entity.parse.failed";

    const estado = esEntrada ? 400 : 500;
    let mensaje = esEntrada
      ? "Revisá los datos enviados."
      : "No se pudo completar la operación.";

    if (error.codigo === "ID_INVALIDO") {
      mensaje = "El identificador debe tener 24 caracteres hexadecimales.";
    }

    if (error.codigo === "FILTRO_INVALIDO") {
      mensaje = "El filtro especificado no es válido.";
    }

    // Log interno en consola
    console.error(
      "Solicitud fallida:",
      res.locals.solicitudId ?? "",
      error.name,
    );

    // Canal API JSON
    if (req.path.startsWith("/api/")) {
      return res.status(estado).json({
        error: mensaje,
        campos:
          esValidacion && error.errors ? Object.keys(error.errors) : undefined,
      });
    }

    // Canal Sitio Web (Formulario POST con error de validación)
    if (esValidacion && req.method === "POST") {
      return res.status(400).render(vistaFormulario, {
        titulo: tituloFormulario,
        error: mensaje,
        valores: req.body ?? {},
      });
    }

    // Canal Sitio Web (Error general o 400 por ID inválido en navegador)
    return res.status(estado).render("no-encontrado", {
      titulo: esEntrada ? "Solicitud inválida" : "Error del servicio",
      mensaje,
    });
  };
}

module.exports = { crearManejadorErrores };
