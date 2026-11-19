# Capability `tasks`

Es la lista de trabajo del equipo: **una sola lista compartida** con todas las tareas del espacio. Crear una tarea solo pide el título, y en cada fila se ve quién la lleva y en qué estado está. Cada tarea puede tener además una fecha de vencimiento opcional, y la condición de vencida se calcula según el día de quien mira.

Las reglas de negocio están en la spec, que es su única fuente: **[`openspec/specs/tasks/spec.md`](../../../openspec/specs/tasks/spec.md)**. Este README no las repite. Solo cuenta dónde vive cada una en el código y cómo probarla. Si una regla cambia, se cambia en la spec, y aquí solo hace falta tocar algo si cambia el código que la implementa.

## Endpoints

Todos van bajo `/api/v1`, exigen `Authorization: Bearer <token>` y responden envueltos en `{ "data": ... }` (ver `providers/api_provider.ts`). Las rutas se declaran en [`backend/start/routes.ts`](../../../backend/start/routes.ts).

| Método | Ruta | Controlador | Qué hace |
|---|---|---|---|
| `GET` | `/api/v1/tasks` | `TasksController.index` | La lista. Admite `?status=` para acotarla a un solo estado. |
| `POST` | `/api/v1/tasks` | `TasksController.store` | Crea una tarea a partir de `{ "title" }`. |
| `GET` | `/api/v1/tasks/:id` | `TasksController.show` | Una tarea suelta con su vencimiento. Pide `?today=AAAA-MM-DD`. |
| `PATCH` | `/api/v1/tasks/:id/status` | `TaskStatusesController.update` | Cambia el estado con `{ "status" }`. |
| `PUT` | `/api/v1/tasks/:id/due-date` | `TaskDueDatesController.update` | Fija o retira la fecha con `{ "dueDate", "today" }`. |

El contrato detallado (parámetros, códigos de respuesta y forma de cada objeto) está en el documento OpenAPI que genera el propio backend. No se mantiene a mano:

- Interfaz (Scalar): `http://localhost:3333/api`
- Documento: `http://localhost:3333/api.json` (también en `api.yaml`)

Los esquemas reutilizables de ese documento están en [`backend/app/openapi/schemas.ts`](../../../backend/app/openapi/schemas.ts), y las anotaciones de cada operación, en los propios controladores.

## Reglas de negocio

Cada enlace lleva al requirement de la spec, con sus scenarios.

**Crear**
- [Creación de una tarea con solo el título](../../../openspec/specs/tasks/spec.md#requirement-creación-de-una-tarea-con-solo-el-título)
- [Ninguna tarea sin título](../../../openspec/specs/tasks/spec.md#requirement-ninguna-tarea-sin-título)
- [Aviso ante un título demasiado largo](../../../openspec/specs/tasks/spec.md#requirement-aviso-ante-un-título-demasiado-largo)

**La lista y su filtro**
- [Una sola lista compartida del espacio](../../../openspec/specs/tasks/spec.md#requirement-una-sola-lista-compartida-del-espacio)
- [Lo que cada tarea muestra de su responsable](../../../openspec/specs/tasks/spec.md#requirement-lo-que-cada-tarea-muestra-de-su-responsable)
- [Acotar la lista por estado](../../../openspec/specs/tasks/spec.md#requirement-acotar-la-lista-por-estado)
- [Un filtro válido sin resultados es una lista vacía legítima](../../../openspec/specs/tasks/spec.md#requirement-un-filtro-válido-sin-resultados-es-una-lista-vacía-legítima)
- [Un estado que no existe se rechaza, no se responde vacío](../../../openspec/specs/tasks/spec.md#requirement-un-estado-que-no-existe-se-rechaza-no-se-responde-vacío)

**Estados**
- [Tres estados fijos](../../../openspec/specs/tasks/spec.md#requirement-tres-estados-fijos)
- [Cambio de estado de cualquier tarea](../../../openspec/specs/tasks/spec.md#requirement-cambio-de-estado-de-cualquier-tarea)

**Vencimiento**
- [Fecha de vencimiento opcional](../../../openspec/specs/tasks/spec.md#requirement-fecha-de-vencimiento-opcional)
- [Fijar, cambiar y retirar la fecha de vencimiento](../../../openspec/specs/tasks/spec.md#requirement-fijar-cambiar-y-retirar-la-fecha-de-vencimiento)
- [Cuándo una tarea está vencida](../../../openspec/specs/tasks/spec.md#requirement-cuándo-una-tarea-está-vencida)
- [El día de referencia lo pone quien mira](../../../openspec/specs/tasks/spec.md#requirement-el-día-de-referencia-lo-pone-quien-mira)
- [Consulta de una tarea suelta](../../../openspec/specs/tasks/spec.md#requirement-consulta-de-una-tarea-suelta)
- [La lista no lleva el vencimiento](../../../openspec/specs/tasks/spec.md#requirement-la-lista-no-lleva-el-vencimiento)

**Acceso**
- [Las tareas exigen sesión](../../../openspec/specs/tasks/spec.md#requirement-las-tareas-exigen-sesión)

**Interfaz.** Los requirements de pantalla (lista, pantalla de una tarea, filtro en la URL, avisos, señal de vencida…) están en la misma spec, a partir de [Pantalla de la lista del equipo](../../../openspec/specs/tasks/spec.md#requirement-pantalla-de-la-lista-del-equipo).

## Dónde vive cada cosa en el código

**Backend** (`backend/`)
- `app/models/task.ts`: el modelo. Contiene `TASK_STATUSES`, `DEFAULT_LIST_STATUSES` (lo que devuelve la lista sin filtro) e `isOverdueOn()`, que es la única definición de «vencida» del sistema; el frontend nunca compara fechas.
- `app/validators/task.ts`: los validadores de VineJS de creación, filtro, cambio de estado, día de referencia y fecha.
- `app/transformers/`: hay dos formas de tarea a propósito. `TaskTransformer` (lista, creación y cambio de estado) no lleva vencimiento; `TaskDetailTransformer` (consulta suelta y cambio de fecha) sí lo lleva. Las dos usan `TaskAssigneeTransformer`, que expone `id`, `fullName` e `initials`, sin email.
- `database/migrations/`: la tabla `tasks` (`title`, `status`, `assignee_id` → `users`, `due_date`). Los modelos no declaran columnas: `database/schema.ts` se genera desde las migraciones.

**Frontend** (`frontend/src/`)
- `lib/api.ts`: `listTasks`, `createTask`, `getTask`, `updateTaskStatus` y `setTaskDueDate`. Son el único punto de contacto con estos endpoints. `getTask` y `setTaskDueDate` envían como `today` el día local del navegador.
- `pages/tasks-page.tsx` (ruta `/tasks`) y `pages/task-page.tsx` (ruta `/tasks/:id`).
- `components/task-item.tsx` y `components/task-filter.tsx`.

## Cómo probarla en local

### 1. Arrancar

```bash
# Backend (http://localhost:3333)
cd backend
npm install
cp .env.example .env && node ace generate:key   # solo la primera vez
node ace migration:run
npm run dev

# Frontend (en otra terminal; por defecto apunta a http://localhost:3333 vía VITE_API_URL)
cd frontend
npm install
npm run dev
```

### 2. Tests automáticos

```bash
cd backend
npm test                      # todas las suites
node ace test --files='tasks/*'   # solo los de tasks (--files=tasks a secas no encuentra ninguno)
```

Hoy los únicos tests de la capability son los de [`backend/tests/functional/tasks/assignee.spec.ts`](../../../backend/tests/functional/tasks/assignee.spec.ts), que cubren lo que cada tarea muestra de su responsable. Ningún test automático cubre aún la creación, la lista, el filtro, los estados ni el vencimiento.

Los tests functional usan el mismo `tmp/db.sqlite3` que el dev server. Por eso cada grupo envuelve sus tests en `testUtils.db().withGlobalTransaction()`: si añades tests que escriben, haz lo mismo.

### 3. A mano contra la API

La forma más cómoda es la interfaz de `http://localhost:3333/api`. Con `curl`:

```bash
API=http://localhost:3333/api/v1

# Crear una cuenta; la respuesta trae data.token
curl -s -H 'content-type: application/json' \
  -d '{"fullName":"Ada Lovelace","email":"ada@example.test","password":"una-clave-larga","passwordConfirmation":"una-clave-larga"}' \
  $API/auth/signup

TOKEN=...   # el data.token de la respuesta anterior
AUTH="Authorization: Bearer $TOKEN"

curl -s -H "$AUTH" -H 'content-type: application/json' -d '{"title":"Revisar el informe"}' $API/tasks
curl -s -H "$AUTH" "$API/tasks"
curl -s -H "$AUTH" "$API/tasks?status=done"
curl -s -H "$AUTH" "$API/tasks/1?today=2026-08-27"
curl -s -X PATCH -H "$AUTH" -H 'content-type: application/json' -d '{"status":"in_progress"}' $API/tasks/1/status
curl -s -X PUT   -H "$AUTH" -H 'content-type: application/json' -d '{"dueDate":"2026-08-26","today":"2026-08-27"}' $API/tasks/1/due-date
```

Ten en cuenta que esto escribe en la base de datos de desarrollo (`backend/tmp/db.sqlite3`). Para empezar de cero, ejecuta `node ace migration:fresh`.

## Desviaciones conocidas entre código y spec

Estado a 2026-11-19. Cuando se corrija una, se borra de aquí.

- **Un estado inventado en el filtro no se rechaza.** `listTasksValidator` declara `status` como `vine.string().optional()` y no como enum, así que `GET /api/v1/tasks?status=archivado` devuelve `200 {"data":[]}` en vez del `422` que exige [Un estado que no existe se rechaza, no se responde vacío](../../../openspec/specs/tasks/spec.md#requirement-un-estado-que-no-existe-se-rechaza-no-se-responde-vacío).
- **Una tarea hecha con la fecha pasada sigue saliendo vencida.** `Task.isOverdueOn()` solo comprueba que haya fecha y que sea anterior al día de referencia; no mira si el estado es `done`, aunque su comentario diga que sí. Esto incumple los scenarios «Darla por hecha la deja de vencer» y «Una tarea hecha con la fecha pasada» de [Cuándo una tarea está vencida](../../../openspec/specs/tasks/spec.md#requirement-cuándo-una-tarea-está-vencida).
