# Arquitectura de FlowSync

Diagrama de contenedores (nivel 2 de C4) de FlowSync. Muestra las tres piezas que se ejecutan por separado (la SPA de React, la API de AdonisJS y la base de datos SQLite), quién habla con quién y por qué canal. Todo lo que aparece se ha comprobado leyendo el código del repo: `backend/start/routes.ts`, `backend/app/` (controladores, modelos, transformers y validadores), `backend/database/migrations/`, `backend/config/database.ts` y `frontend/src/`. Lo que solo está configurado pero no se usa, como el guard `web` de sesión o las conexiones de Postgres/MySQL que están comentadas, no aparece.

```mermaid
C4Container
    title FlowSync: diagrama de contenedores

    Person(user, "Miembro del equipo", "Se registra, inicia sesión y gestiona las tareas del equipo")

    System_Boundary(flowsync, "FlowSync") {
        Container(spa, "SPA", "React 19, Vite 8, react-router, Tailwind v4, shadcn/ui", "Rutas /login, /register, /tasks, /tasks/:id y /profile. Guarda el token en localStorage (flowsync.token). Toda llamada al backend pasa por src/lib/api.ts")
        Container(api, "API REST", "AdonisJS 7, VineJS 4, Lucid 22, puerto 3333", "Prefijo /api/v1. Controladores: NewAccount, AccessTokens, Profile, Tasks, TaskStatuses y TaskDueDates. Valida con VineJS y responde { data } a través de los transformers User, Task, TaskDetail y TaskAssignee")
        ContainerDb(db, "Base de datos", "SQLite (better-sqlite3), tmp/db.sqlite3", "Tablas users, auth_access_tokens y tasks (assignee_id → users, status, due_date)")
    }

    Rel(user, spa, "Usa", "Navegador")
    Rel(spa, api, "auth/signup, auth/login, account/profile, account/logout; GET/POST tasks, GET tasks/:id, PATCH tasks/:id/status, PUT tasks/:id/due-date", "HTTP/JSON, Authorization: Bearer")
    Rel(api, db, "Lee y escribe con los modelos User y Task (Task belongsTo User)", "Lucid / SQL")
```
