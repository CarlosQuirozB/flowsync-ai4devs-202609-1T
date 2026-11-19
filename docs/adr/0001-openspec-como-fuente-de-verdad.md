# 1. Las delta-specs de OpenSpec como fuente de verdad viva

## Contexto

FlowSync describe el comportamiento de sus dos capabilities, `auth` y `tasks`, con OpenSpec (`openspec/config.yaml`, `schema: spec-driven`). En el repo conviven dos tipos de documento:

- **Specs vivas** (`openspec/specs/<capability>/spec.md`): describen lo que el sistema hace hoy, como requirements con `SHALL` y scenarios `WHEN`/`THEN`. Hoy son dos: `auth`, con 19 requirements, y `tasks`, con 32.
- **Changes** (`openspec/changes/<nombre>/`): cada uno tiene `proposal.md`, `design.md`, `tasks.md` y una **delta-spec** por capability afectada, organizada en `ADDED`, `MODIFIED`, `REMOVED` y `RENAMED Requirements`. Al archivar un change, su delta se fusiona en la spec viva y la carpeta se mueve a `changes/archive/AAAA-MM-DD-<nombre>/`.

Hay tres changes archivados, los tres el 2026-08-13. Juntos explican la spec viva de `tasks` entera:

| Change | Delta sobre `tasks` | Delta sobre `auth` |
|---|---|---|
| `add-task-list` | 14 ADDED, más el `## Purpose` | 1 ADDED, 3 MODIFIED |
| `add-task-status-filter` | 7 ADDED, 4 MODIFIED | — |
| `add-task-due-date` | 11 ADDED, 1 MODIFIED | — |

14 + 7 + 11 = 32, los mismos requirements que tiene hoy `openspec/specs/tasks/spec.md`. Dos changes modificaron el mismo requirement («Una sola vista de tareas, sin señales de presencia»), y la spec viva conserva los scenarios de ambos.

La historia del repo muestra tres cosas que motivan este ADR:

1. **El código se adelantó al contrato una vez, y se corrigió documentando, no deshaciendo.** El filtro por estado (FS-142) se implementó sin tocar `openspec/`. El commit `209df12` lo cuenta así: «el código filtraba y el contrato no se enteraba. Peor, lo contradecía en dos sitios». Se arregló escribiendo a posteriori el change `add-task-status-filter`, cuyo `proposal.md` dice: «Este change documenta comportamiento que ya está implementado».
2. **El código se ha separado del contrato y nada lo ha detectado.** El 2026-08-18, dos commits de tipo `refactor` cambiaron el comportamiento sin tocar la spec:
   - `8c15707` cambió el filtro de `vine.enum(TASK_STATUSES)` a `vine.string()`. Ahora un estado inventado devuelve `200` con lista vacía en vez del `422` que exige el requirement «Un estado que no existe se rechaza, no se responde vacío».
   - `99d1425` hizo que `Task.isOverdueOn()` dejara de mirar si la tarea está en `done`, contra los scenarios «Darla por hecha la deja de vencer» y «Una tarea hecha con la fecha pasada».

   Las dos desviaciones siguen abiertas y están anotadas en `docs/capabilities/tasks/README.md`.
3. **Ya hay artefactos que remiten a la spec en vez de copiarla**: el README de la capability, y las anotaciones OpenAPI de los controladores de tasks, que describen el contrato HTTP de esos requirements.

Hace falta dejar escrito qué documento manda cuando código, spec y documentación no coinciden, y por qué vía se cambia ese documento.

## Decisión

**La spec viva de `openspec/specs/` es la fuente de verdad del comportamiento de FlowSync, y solo cambia a través de delta-specs dentro de un change de OpenSpec.**

En concreto:

- Ante una discrepancia entre la spec viva y el código, la referencia es la spec. Se corrige el código, o bien se abre un change que cambie la spec, pero nunca se deja la discrepancia sin registrar.
- La spec viva no se edita a mano. Todo cambio de comportamiento pasa por un change con su delta, que se archiva cuando el código lo cumple. El archivo es lo que fusiona la delta en la spec viva.
- Si el código se adelanta a la spec, como pasó con el filtro, se escribe el change a posteriori para documentar lo que existe, igual que se hizo con `add-task-status-filter`. No se reescribe la spec viva directamente.
- Los changes archivados no se tocan: son el historial de por qué cada requirement dice lo que dice.
- El resto de la documentación (`docs/capabilities/*/README.md`, `docs/architecture.md`, las anotaciones OpenAPI) enlaza a los requirements de la spec y no repite sus reglas.

## Estado

Aceptada.

La práctica está en uso desde el 2026-08-13, fecha de los tres changes archivados. Este ADR la registra a posteriori el 2026-11-19.

## Consecuencias

### Lo que ganamos

- **Un solo sitio que consultar.** La pregunta «¿qué debe hacer esto?» tiene una respuesta, y el resto de documentos la enlazan en vez de mantener su propia versión.
- **Cada requirement tiene historia.** Desde `changes/archive/` se puede saber qué change introdujo o modificó cada requirement y con qué motivo (`proposal.md`) y diseño (`design.md`). La spec viva por sí sola no lo cuenta.
- **Revisiones más pequeñas.** Una delta muestra solo lo que cambia (`ADDED`/`MODIFIED`), no la spec entera.
- **Los scenarios sirven para verificar.** Su forma `WHEN`/`THEN` se traduce directamente a tests y a revisiones del código. Gracias a eso fue posible encontrar las dos desviaciones del 2026-08-18 comparando código y spec.

### Lo que nos cuesta

- **Nada impide que la spec mienta.** La decisión dice qué manda, pero no lo hace cumplir. Los dos `refactor` del 2026-08-18 rompieron tres scenarios y nadie se enteró hasta que alguien comparó código y spec a mano. Mientras no haya tests por scenario, que la spec sea «la verdad» es una aspiración: hoy solo 3 de los 124 scenarios de `tasks` (los del responsable) tienen un test que falle si se incumplen.
- **Hay que mantener el proceso, y saltárselo sale caro.** Todo cambio de comportamiento exige proposal, design, tasks y delta antes de archivar. Cuando se ha ido por el atajo (FS-142), arreglarlo costó un change entero escrito a posteriori: 7 requirements nuevos y 4 MODIFIED para que la spec volviera a decir lo que hacía el código.
- **Las specs crecen mucho.** La de `tasks` ya tiene 32 requirements y unas 750 líneas, mezclando contrato de API y comportamiento de pantalla. Leerla entera para un cambio pequeño es lento, y es fácil no ver que otro requirement contradice el que se está tocando.
- **Las deltas tienen límites.** Un `MODIFIED` sustituye el requirement entero, así que hay que copiarlo completo y cualquier scenario que se olvide desaparece en silencio. Además, el `## Purpose` no se puede modificar con una delta: en `209df12` quedó una mención a «todas las tareas del espacio» que ningún `MODIFIED` puede corregir.
- **Fuera de las specs, nada describe el resto.** `auth` ya tenía spec viva cuando se archivó el primer change, así que sus 18 requirements originales no tienen proposal ni design detrás. Lo que no está en `openspec/`, como los detalles de despliegue o los fallos del paquete OpenAPI, sigue viviendo en READMEs, commits y comentarios.
- **Dependemos de la herramienta y de saber usarla.** El ciclo (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `openspec validate`) es parte del flujo de trabajo. Quien no lo conozca, sea persona o agente, tenderá a editar `specs/` directamente o a no tocarlo, que son los dos fallos que este ADR intenta evitar.
