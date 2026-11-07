# Trabajo Práctico 09 - Actualización y Eliminación de Reservas de Salas (CRUD Completo)

## 1. Origen y Contexto
Este proyecto es una evolución modular del **TP 08**. Se implementaron las operaciones restantes del CRUD (`PUT`, `PATCH`, `DELETE`) sobre una base de datos en MongoDB Atlas, manteniendo intactos los contratos previos de lectura (`GET`) y creación (`POST`), así como las vistas del sitio web y el endpoint `/estado`.

- **Tecnologías principales:** Node.js (v20+), Express 5, Mongoose 8.
- **Módulo de persistencia:** MongoDB Atlas Free Tier (`reservas_salas_u9`, colección `reservas`).
- **Formato de módulos:** CommonJS (`require` / `module.exports`).

---

## 2. Configuración y Ejecución

### Variables de entorno
Copiar la plantilla de ejemplo y completar con las credenciales locales:

```bash
copy .env.example .env
```

Estructura de `.env`:
```ini
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<USUARIO>:<CLAVE>@<CLUSTER>/reservas_salas_u9?retryWrites=true&w=majority
```

### Instalación e Inicio
```bash
# Instalar dependencias
npm install

# Verificar estilo y sintaxis
npm run format
npm run check

# Iniciar servidor con variables de entorno nativas
node --env-file=.env src/index.js

# Iniciar con el script
npm start
```

---

## 3. Arquitectura y Separación de Responsabilidades

El proyecto preserva la arquitectura en capas:

1. **Rutas (`src/rutas/`):**
   - Define los endpoints y encadena la secuencia estricta de middlewares y controladores.
   - Rutas API montadas en `/api/reservas`.
   - Rutas de navegación HTML montadas en `/reservas`.

2. **Middlewares de Validación (`src/middleware/`):**
   - `validarReserva`: Reutilizado de TP 08 para comprobar campos base (estudiante, email, sala, fecha, turno, personas). Rechaza asignación externa de `estado` o `_id` en creación.
   - `validarReemplazoReserva`: Valida la ficha completa requerida por `PUT`. Exige `estado` ("pendiente" o "confirmada") y rechaza campos no editables.
   - `validarActualizacionReserva`: Valida cambios parciales de `PATCH`. Admite únicamente `personas` (entero entre 1 y 6) y/o `estado`. Rechaza operadores de MongoDB (`$set`), cuerpos vacíos o campos adicionales.

3. **Controladores (`src/controladores/`):**
   - Recibe la solicitud HTTP (`req`), coordina la llamada al servicio asíncrono y responde con los códigos de estado correspondientes (`200`, `201`, `204`, `404`, `400`). No contiene consultas directas a la base de datos.

4. **Servicio MongoDB (`src/servicios/reservas-mongo.js`):**
   - Encapsula las operaciones Mongoose:
     - `reemplazar(id, datos)`: Emplea `findOneAndReplace` con `{ runValidators: true, returnDocument: "after", upsert: false }`.
     - `actualizar(id, datos)`: Emplea `findOneAndUpdate` con `$set` dinámico para los campos permitidos presentes.
     - `eliminar(id)`: Emplea `deleteOne({ _id: id })` y comprueba `resultado.deletedCount === 1` para distinguir documentos existentes de ausentes.

5. **Manejador de Errores (`src/middleware/errores.js`):**
   - Captura errores centralizados (`CastError`, `ValidationError`, `ID_INVALIDO`, `ENTRADA_INVALIDA`), traduciéndolos a código `400` y devolviendo JSON seguro sin exponer credenciales ni trazas internas.

---

## 4. Contratos de la API (`/api/reservas`)

| Método | Endpoint | Cuerpo Solicitud | Código Éxito | Respuesta / Observación |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/reservas` | Ninguno | `200 OK` | Arreglo JSON plano con todas las reservas. |
| **GET** | `/api/reservas/:id` | Ninguno | `200 OK` | Documento individual solicitado (o `404 Not Found`). |
| **POST** | `/api/reservas` | 6 campos (sin `estado`) | `201 Created` | Reserva creada, cabecera `Location` y `estado: "pendiente"`. |
| **PUT** | `/api/reservas/:id` | 7 campos completos | `200 OK` | Ficha editable reemplazada íntegramente. |
| **PATCH**| `/api/reservas/:id` | `personas` y/o `estado` | `200 OK` | Reserva con campos indicados actualizados; el resto se conserva intacto. |
| **DELETE**| `/api/reservas/:id` | Ninguno | `204 No Content` | Documento retirado físicamente de MongoDB (sin cuerpo). |

### Criterio de Borrado Físico vs. Estado
- **`DELETE`**: Retira definitivamente el documento de la colección `reservas` mediante `deleteOne`. Una vez borrado, cualquier consulta (`GET`) o modificación posterior devuelve `404 Not Found`.
- **Modificación de `estado` (PATCH/PUT)**: Cambiar entre `"pendiente"` y `"confirmada"` no elimina ni oculta la ficha; preserva su identidad (`id`), su presencia en el listado y el conteo en `/estado`.

---

## 5. Matriz de Pruebas Realizadas (Evidencias)

| Caso de Prueba | Método / Endpoint | Cuerpo / Parámetros | Código Esperado | Resultado Observado |
| :--- | :--- | :--- | :--- | :--- |
| **Creación válida** | `POST /api/reservas` | `{ estudiante, email, sala, fecha, turno, personas }` | `201 Created` | Creada con `estado: "pendiente"` y cabecera `Location`. |
| **Reemplazo íntegro** | `PUT /api/reservas/:id` | 7 campos válidos, `estado: "confirmada"` | `200 OK` | Documento actualizado preservando su `_id`. |
| **PUT incompleto** | `PUT /api/reservas/:id` | Omisión de `estado` o `turno` | `400 Bad Request` | Rechazado; el documento en la base no sufrió cambios. |
| **PUT con campos extra** | `PUT /api/reservas/:id` | Campo adicional `"rol": "admin"` | `400 Bad Request` | Rechazado por validación de campos permitidos. |
| **PATCH personas** | `PATCH /api/reservas/:id` | `{"personas": 4}` | `200 OK` | `personas` pasó a 4; estudiante, sala y estado se mantuvieron. |
| **PATCH estado** | `PATCH /api/reservas/:id` | `{"estado": "confirmada"}` | `200 OK` | `estado` actualizado a confirmada. |
| **PATCH vacío** | `PATCH /api/reservas/:id` | `{}` | `400 Bad Request` | Error `"Enviá personas o estado."`. |
| **PATCH no admitido** | `PATCH /api/reservas/:id` | `{"sala": "Sala Sur"}` | `400 Bad Request` | Error `"Solo se puede cambiar personas o estado."`. |
| **PATCH personas no entero** | `PATCH /api/reservas/:id` | `{"personas": 3.5}` o `{"personas": "muchos"}` | `400 Bad Request` | Rechazado con mensaje de entero entre 1 y 6. |
| **ID inválido** | `GET /api/reservas/123abc` | Ninguno | `400 Bad Request` | Error por ID hexadecimal inválido. |
| **ID ausente (404)** | `PUT /api/reservas/60c72b2f9b1d8b0015b8d234` | Ficha completa | `404 Not Found` | No existe el recurso; no se ejecutó inserción (`upsert: false`). |
| **DELETE exitoso** | `DELETE /api/reservas/:id` | Ninguno | `204 No Content` | Respuesta sin cuerpo; el documento desaparece de `/api/reservas`. |
| **DELETE repetido** | `DELETE /api/reservas/:id` | Mismo ID anterior | `404 Not Found` | Confirmación de que el recurso ya no existe. |

---

## 6. Persistencia tras Reinicio del Servidor

Para garantizar que los cambios operan sobre MongoDB Atlas y no en memoria volatil:

1. Se registró una reserva de prueba con `id: 67123...` y se modificó vía `PATCH` a `personas: 5` y `estado: "confirmada"`.
2. Se eliminó una reserva de ejercicio mediante `DELETE`.
3. Se detuvo el servidor con `Ctrl + C` y se reinició ejecutando `node --env-file=.env src/index.js`.
4. Al consultar nuevamente `GET /api/reservas/67123...`, los datos persistieron con sus valores modificados.
5. Al consultar el ID eliminado, el servidor continuó respondiendo `404 Not Found`.
6. La ruta `/estado` y el listado web `/reservas` reflejaron el total neto real de documentos guardados en Atlas.