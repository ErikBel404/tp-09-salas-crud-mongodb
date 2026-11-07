const express = require("express");
const path = require("node:path");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const { crearSolicitudes, medirDuracion } = require("./middleware/solicitudes");
const { crearManejadorErrores } = require("./middleware/errores");
const { crearControladorReservas } = require("./controladores/reservas");
const { crearRouterReservas } = require("./rutas/reservas");
const { crearRouterReservasApi } = require("./rutas/reservas-api");

function crearApp({ serviciosReservas, formatoRegistro }) {
  const app = express();

  const controladoresReservas = crearControladorReservas(serviciosReservas);
  const reservasRouter = crearRouterReservas(controladoresReservas);
  const reservasRouterApi = crearRouterReservasApi(controladoresReservas);

  // Configuración de motor de vistas
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("layout", "layouts/main");

  // Pipeline de Middlewares Globales
  app.use(morgan(formatoRegistro));
  app.use(crearSolicitudes());
  app.use(medirDuracion);
  app.use(expressLayouts);
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Ruta principal
  app.get("/", (req, res) => {
    res.render("inicio", { titulo: "Inicio - Sistema de Reservas" });
  });

  // Ruta /estado (conteo directo desde MongoDB)
  app.get("/estado", async (req, res, next) => {
    try {
      const cantidad = await serviciosReservas.contar();
      res.json({
        servicio: "activo",
        reservas: cantidad,
        solicitudId: res.locals.solicitudId,
      });
    } catch (error) {
      next(error);
    }
  });

  // Enlace de routers: API JSON y Sitio Web
  app.use("/api/reservas", reservasRouterApi);
  app.use("/reservas", reservasRouter);

  // Middleware para rutas no encontradas (404)
  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Ruta no encontrada." });
    }
    res.status(404).render("no-encontrado", {
      titulo: "Página no encontrada",
      mensaje: "La dirección solicitada no existe.",
    });
  });

  // Middleware central de errores (Express 5)
  app.use(
    crearManejadorErrores({
      vistaFormulario: "reservas/nueva",
      tituloFormulario: "Nueva reserva",
    }),
  );

  return app;
}

module.exports = { crearApp };
