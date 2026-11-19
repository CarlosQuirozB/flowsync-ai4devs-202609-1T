# Arquitectura de FlowSync

Diagrama de contenedores (nivel 2 de C4) de FlowSync: muestra las tres piezas que se despliegan por separado —la SPA de React, la API de AdonisJS y la base de datos SQLite—, quién habla con quién y por qué canal. Todo lo dibujado se ha comprobado leyendo el código del repo (`backend/start/routes.ts`, `backend/app/`, `backend/database/`, `frontend/src/`); lo que solo está configurado pero sin uso (el guard `web` de sesión) no aparece.

```mermaid
C4Container
    title FlowSync — diagrama de contenedores

    Person(user, "Miembro del equipo", "Se registra, inicia sesión y gestiona las tareas del equipo")

    System_Boundary(flowsync, "FlowSync") {
        Container(spa, "SPA", "React 19, Vite 8, react-router, Tailwind v4, shadcn/ui", "Páginas: login, registro, perfil, lista de tareas y detalle de tarea. Guarda el token en localStorage y toda llamada pasa por src/lib/api.ts. Puerto 5173")
        Container(api, "API REST", "AdonisJS 7, VineJS 4, Lucid 22", "Prefijo /api/v1. Controladores: NewAccount, AccessTokens, Profile, Tasks, TaskStatuses y TaskDueDates. Valida con VineJS y responde { data } vía transformers. Puerto 3333")
        ContainerDb(db, "Base de datos", "SQLite (better-sqlite3), tmp/db.sqlite3", "Tablas users, auth_access_tokens y tasks (con assignee_id → users y due_date)")
    }

    Rel(user, spa, "Usa", "Navegador")
    Rel(spa, api, "Llama a /auth/signup, /auth/login, /account/profile, /account/logout y /tasks", "HTTP/JSON, Authorization: Bearer")
    Rel(api, db, "Lee y escribe con los modelos User y Task", "Lucid / SQL")
```
