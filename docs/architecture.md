# Arquitectura de FlowSync

Diagrama de contenedores (nivel 2 de C4) de FlowSync tal y como está hoy en el código: una SPA de React que habla por HTTP/JSON con una API de AdonisJS, que persiste en un fichero SQLite. Solo aparece lo verificado en `backend/` y `frontend/`; no hay colas, cachés ni servicios externos porque no existen en el repo.

```mermaid
C4Container
    title FlowSync - Diagrama de contenedores

    Person(user, "Usuario", "Persona con cuenta que gestiona tareas")

    System_Boundary(flowsync, "FlowSync") {
        Container(spa, "Frontend SPA", "React 19, Vite 8, react-router, Tailwind v4, shadcn/ui", "Páginas: /login, /register, /tasks, /tasks/:id, /profile. Guards ProtectedRoute y PublicOnlyRoute. Guarda el token en localStorage (flowsync.token). Todas las llamadas pasan por src/lib/api.ts")

        Container_Boundary(api, "Backend API (AdonisJS 7, :3333)") {
            Component(routes, "Rutas /api/v1", "start/routes.ts", "auth/*, account/* y tasks/*; las dos últimas tras middleware auth (access tokens opacos)")
            Component(ctrl, "Controladores", "app/controllers", "NewAccount, AccessTokens, Profile, Tasks, TaskStatuses, TaskDueDates")
            Component(val, "Validadores", "VineJS, app/validators", "task.ts y user.ts")
            Component(tr, "Transformers", "app/transformers", "Task, TaskDetail, TaskAssignee, User; serialize() envuelve en { data }")
            Component(models, "Modelos Lucid", "app/models", "User (con access tokens) y Task (belongsTo assignee, isOverdueOn)")
        }

        ContainerDb(db, "Base de datos", "SQLite (better-sqlite3), tmp/db.sqlite3", "Tablas: users, auth_access_tokens, tasks. Esquema generado desde las migraciones")
    }

    Rel(user, spa, "Usa", "Navegador")
    Rel(spa, routes, "Peticiones JSON con Authorization: Bearer", "HTTP, VITE_API_URL")
    Rel(routes, ctrl, "Despacha a")
    Rel(ctrl, val, "Valida la petición con")
    Rel(ctrl, models, "Lee y escribe con")
    Rel(ctrl, tr, "Da forma a la respuesta con")
    Rel(models, db, "Consultas SQL", "Lucid / Knex")
```

## Endpoints

| Método | Ruta | Controlador | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | `NewAccountController.store` | no |
| POST | `/api/v1/auth/login` | `AccessTokensController.store` | no |
| GET | `/api/v1/account/profile` | `ProfileController.show` | sí |
| POST | `/api/v1/account/logout` | `AccessTokensController.destroy` | sí |
| GET | `/api/v1/tasks` | `TasksController.index` | sí |
| POST | `/api/v1/tasks` | `TasksController.store` | sí |
| GET | `/api/v1/tasks/:id` | `TasksController.show` | sí |
| PATCH | `/api/v1/tasks/:id/status` | `TaskStatusesController.update` | sí |
| PUT | `/api/v1/tasks/:id/due-date` | `TaskDueDatesController.update` | sí |
