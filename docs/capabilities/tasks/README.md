# Capability `tasks`

## Qué hace

Da al equipo una única lista de trabajo compartida: todas las tareas del espacio, visibles para cualquier cuenta con sesión. Apuntar una tarea cuesta escribir un título; el responsable, el estado y, opcionalmente, la fecha de vencimiento se leen sin abrir nada. Sirve para responder «¿en qué anda cada uno?» sin preguntar a nadie.

Una tarea tiene título, estado (`pending`, `in_progress` o `done`), responsable y una fecha de vencimiento opcional.

## Fuente de verdad de las reglas

Las reglas de negocio **viven solo en la spec**: [`openspec/specs/tasks/spec.md`](../../../openspec/specs/tasks/spec.md). Este README no las copia, para que no haya dos sitios que puedan desincronizarse. Si una regla cambia, se cambia allí.

La spec agrupa los requisitos en estos temas (los nombres son los de sus `### Requirement`):

| Tema | Requisitos de la spec |
|---|---|
| Alta | Creación de una tarea con solo el título · Ninguna tarea sin título · Aviso ante un título demasiado largo |
| Lista | Una sola lista compartida del espacio · Lo que cada tarea muestra de su responsable · La lista no lleva el vencimiento |
| Estado | Tres estados fijos · Cambio de estado de cualquier tarea |
| Filtro por estado | Acotar la lista por estado · Un filtro válido sin resultados es una lista vacía legítima · Un estado que no existe se rechaza, no se responde vacío |
| Vencimiento | Fecha de vencimiento opcional · Fijar, cambiar y retirar la fecha · Cuándo una tarea está vencida · El día de referencia lo pone quien mira · No tener fecha no se penaliza |
| Consulta suelta | Consulta de una tarea suelta |
| Acceso | Las tareas exigen sesión |
| Pantallas (frontend) | Los requisitos restantes de la spec describen la lista, la pantalla de una tarea y sus avisos |

Dónde se implementan, en `backend/`:

| Pieza | Fichero |
|---|---|
| Estados y definición de «vencida» | `app/models/task.ts` |
| Validación de entrada | `app/validators/task.ts` |
| Forma de las respuestas | `app/transformers/task_transformer.ts`, `task_detail_transformer.ts`, `task_assignee_transformer.ts` |
| Controladores | `app/controllers/tasks_controller.ts`, `task_statuses_controller.ts`, `task_due_dates_controller.ts` |
| Esquemas OpenAPI | `app/openapi/schemas.ts` |

## Endpoints

Todos bajo `/api/v1/tasks`, con `Authorization: Bearer <token>` y respuesta envuelta en `{ "data": ... }`.

| Método | Ruta | Controlador | Éxito | Otros códigos |
|---|---|---|---|---|
| GET | `/api/v1/tasks` | `TasksController.index` | 200 | 401, 422 |
| POST | `/api/v1/tasks` | `TasksController.store` | 201 | 401, 422 |
| GET | `/api/v1/tasks/:id` | `TasksController.show` | 200 | 401, 404, 422 |
| PATCH | `/api/v1/tasks/:id/status` | `TaskStatusesController.update` | 200 | 401, 404, 422 |
| PUT | `/api/v1/tasks/:id/due-date` | `TaskDueDatesController.update` | 200 | 401, 404, 422 |

Parámetros y cuerpos:

- `GET /tasks` — query opcional `status` (`pending | in_progress | done`).
- `POST /tasks` — cuerpo `{ "title": string }`.
- `GET /tasks/:id` — query obligatoria `today` (`AAAA-MM-DD`).
- `PATCH /tasks/:id/status` — cuerpo `{ "status": ... }`.
- `PUT /tasks/:id/due-date` — cuerpo `{ "dueDate": "AAAA-MM-DD" | null, "today": "AAAA-MM-DD" }`.

La referencia completa y siempre al día (esquemas, códigos, formas de respuesta) es el documento OpenAPI que sirve el propio backend, generado de los decoradores de los controladores: con el servidor en marcha, `http://localhost:3333/api` (interfaz) y `http://localhost:3333/api.json`.

## Probarlo en local

Los comandos se ejecutan desde `backend/` (no hay `package.json` en la raíz).

```bash
cd backend
npm install
cp .env.example .env && node ace generate:key   # solo la primera vez
node ace migration:run
npm run dev                                     # http://localhost:3333
```

No hay seeders: crea una cuenta y obtén un token.

```bash
curl -s -X POST localhost:3333/api/v1/auth/signup -H 'content-type: application/json' \
  -d '{"fullName":"Ada","email":"ada@example.com","password":"secreto123","passwordConfirmation":"secreto123"}'

curl -s -X POST localhost:3333/api/v1/auth/login -H 'content-type: application/json' \
  -d '{"email":"ada@example.com","password":"secreto123"}'
# → { "data": { "user": ..., "token": "<token>" } }
```

Con el token:

```bash
T=<token>
curl -s -X POST localhost:3333/api/v1/tasks -H "authorization: Bearer $T" \
  -H 'content-type: application/json' -d '{"title":"Revisar el informe"}'
curl -s "localhost:3333/api/v1/tasks?status=pending" -H "authorization: Bearer $T"
curl -s "localhost:3333/api/v1/tasks/1?today=2026-10-17" -H "authorization: Bearer $T"
curl -s -X PATCH localhost:3333/api/v1/tasks/1/status -H "authorization: Bearer $T" \
  -H 'content-type: application/json' -d '{"status":"done"}'
curl -s -X PUT localhost:3333/api/v1/tasks/1/due-date -H "authorization: Bearer $T" \
  -H 'content-type: application/json' -d '{"dueDate":"2026-10-20","today":"2026-10-17"}'
```

También puedes probar los endpoints desde la interfaz en `/api`, o desde el frontend (`cd frontend && npm run dev`, `http://localhost:5173`).

### Tests

```bash
cd backend
node ace test functional --files=assignee   # tests de tasks
npm run typecheck && npm run lint
```

Cobertura actual: **solo** `tests/functional/tasks/assignee.spec.ts` (el responsable de la tarea: nombre, iniciales, sin email). El resto de la capability —alta, validación, filtro, estado, vencimiento— **no tiene tests todavía**. Los scenarios de la spec son el punto de partida para escribirlos.

Ojo con la base de datos: las suites functional usan el **mismo fichero SQLite** que el servidor de desarrollo (`tmp/db.sqlite3`). Los tests que escriben deben aislarse con `testUtils.db().withGlobalTransaction()`, como hace `assignee.spec.ts`, o el estado se filtra entre ejecuciones.
