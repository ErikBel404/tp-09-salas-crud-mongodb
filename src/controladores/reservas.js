const {
  salasPermitidas,
  turnosPermitidos,
} = require("./../../datos/constantes");

function crearControladorReservas(servicioReserva) {
  async function listar(req, res) {
    const reservas = await servicioReserva.listar();
    res.render("reservas/lista", {
      titulo: "Reservas de salas",
      reservas,
    });
  }

  function mostrarFormulario(req, res) {
    res.render("reservas/nueva", {
      titulo: "Nueva reserva",
      error: null,
      valores: {},
      salasPermitidas,
      turnosPermitidos,
    });
  }

  async function mostrarDetalle(req, res) {
    const reserva = await servicioReserva.obtenerPorId(req.params.id);

    if (!reserva) {
      return res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: "No existe una reserva con ese identificador.",
      });
    }

    res.render("reservas/detalle", {
      titulo: `Reserva de ${reserva.estudiante}`,
      reserva,
    });
  }

  async function crear(req, res) {
    await servicioReserva.crear(req.reservaValidada);
    res.redirect("/reservas");
  }

  // --- Endpoints para la API JSON ---

  async function listarApi(req, res) {
    const reservas = await servicioReserva.listar(req.query.sala);
    res.json(reservas);
  }

  async function obtenerApi(req, res) {
    const reserva = await servicioReserva.obtenerPorId(req.params.id);

    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }

    res.json(reserva);
  }

  async function crearApi(req, res) {
    const reserva = await servicioReserva.crear(req.reservaValidada);
    res.location(`/api/reservas/${reserva.id}`).status(201).json(reserva);
  }

  async function eliminarApi(req, res) {
    const eliminado = await servicioReserva.eliminar(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ error: "Recurso no encontrado." });
    }
    res.status(204).end();
  }

  async function reemplazarApi(req, res) {
    const reserva = await servicioReserva.reemplazar(
      req.params.id,
      req.cambiosValidos,
    );

    if (!reserva) {
      return res.status(404).json({ error: "Recurso no encontrado." });
    }

    res.json(reserva);
  }

  async function actualizarApi(req, res) {
    const reserva = await servicioReserva.actualizar(
      req.params.id,
      req.cambiosValidos,
    );

    if (!reserva) {
      return res.status(404).json({ error: "Recurso no encontrado." });
    }

    res.json(reserva);
  }

  return {
    listar,
    mostrarFormulario,
    mostrarDetalle,
    crear,
    listarApi,
    obtenerApi,
    crearApi,
    eliminarApi,
    reemplazarApi,
    actualizarApi,
  };
}

module.exports = { crearControladorReservas };
