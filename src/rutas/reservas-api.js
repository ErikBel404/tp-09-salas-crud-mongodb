const express = require("express");
const { validarReserva } = require("../middleware/reservas");
const {
  validarReemplazoReserva,
  validarActualizacionReserva,
} = require("../middleware/cambios-reservas");

function crearRouterReservasApi(controlador) {
  const router = express.Router();

  router.get("/", controlador.listarApi);

  router.get("/:id", controlador.obtenerApi);

  router.post("/", validarReserva, controlador.crearApi);

  router.delete("/:id", controlador.eliminarApi);

  router.put(
    "/:id",
    validarReserva,
    validarReemplazoReserva,
    controlador.reemplazarApi,
  );

  router.patch("/:id", validarActualizacionReserva, controlador.actualizarApi);

  return router;
}

module.exports = { crearRouterReservasApi };
