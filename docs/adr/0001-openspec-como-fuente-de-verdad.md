# 1. OpenSpec y sus delta-specs como fuente de verdad viva

## Estado

Reemplazada por el [ADR 0002](0002-tests-como-fuente-de-verdad-ejecutable.md). Estuvo aceptada desde 2026-10-17.

## Contexto

FlowSync necesita un sitio único que diga qué hace el producto, y que se pueda contrastar con el código. Lo que hay hoy en `openspec/` es lo siguiente:

- **Specs vivas por capability** en `openspec/specs/<capability>/spec.md`: `auth` (19 requisitos, 307 líneas) y `tasks` (32 requisitos, 753 líneas). Cada requisito es un `### Requirement` redactado con `SHALL` y con `#### Scenario` en forma `WHEN`/`THEN`. Un solo fichero mezcla API y pantallas del frontend.
- **Changes con delta-specs** en `openspec/changes/<nombre>/`: cada uno trae `proposal.md` (por qué, qué cambia, fuera de alcance, impacto), `design.md`, `tasks.md` y `specs/<capability>/spec.md`, que contiene **solo el delta**, con secciones `## ADDED Requirements` y `## MODIFIED Requirements`. Al terminar, el change se archiva en `openspec/changes/archive/AAAA-MM-DD-<nombre>/` y su delta se funde en la spec viva. Hoy no hay ningún change activo.
- **Tres changes archivados**, todos con fecha 2026-08-13:
  - `add-task-list` crea la capability `tasks` (ADDED) y modifica `auth` (MODIFIED) porque la lista pasa a ser la pantalla de entrada.
  - `add-task-due-date` añade la fecha de vencimiento, con requisitos ADDED y MODIFIED sobre `tasks`.
  - `add-task-status-filter` **documenta comportamiento ya implementado**: no toca código y corrige dos requisitos vivos que el filtro había vuelto falsos («devuelve todas las tareas del espacio»). Se hizo así porque el filtro se había implementado por delegación directa, sin pasar por `openspec/`, y el código y el contrato se separaron (commit `209df12`).
- El `config.yaml` solo fija `schema: spec-driven`; el contexto del proyecto y las reglas por artefacto siguen sin rellenar.
- Hay skills del repositorio que operan sobre este flujo (`openspec-propose`, `-apply-change`, `-verify-change`, `-sync-specs`, `-archive-change`, `-update-change`), y la documentación del repositorio ya enlaza la spec en lugar de copiar sus reglas (`docs/capabilities/tasks/README.md`).

La alternativa implícita es la que ya probamos sin querer con el filtro: especificar a posteriori, o no especificar, y dejar que el código sea la única verdad.

## Decisión

La **spec viva** (`openspec/specs/<capability>/spec.md`) es la fuente de verdad de lo que el sistema hace. Se cambia **solo a través de un change**: toda modificación de comportamiento se propone como delta-spec (ADDED / MODIFIED / REMOVED) en `openspec/changes/`, se implementa contra ese delta y, al cerrarse, se archiva y se funde en la spec viva.

Consecuencias de esa regla para el trabajo diario:

- Los demás documentos (READMEs, OpenAPI, diagramas) **enlazan** los requisitos y no los copian.
- Si el código se adelanta a la spec, la desviación se corrige abriendo un change que la documente, como se hizo con `add-task-status-filter`, y no dejándola.
- Las decisiones de diseño y lo que queda fuera de alcance se registran en el `proposal.md` y el `design.md` del change, que se conservan en el archivo.

## Consecuencias

**Lo que ganamos**

- Un único lugar donde leer qué hace una capability, con escenarios verificables (`WHEN`/`THEN`) que sirven de punto de partida para tests y para revisar un PR.
- El delta hace pequeño y revisable cada cambio de comportamiento, y el archivo conserva el porqué (`proposal.md`) y el diseño (`design.md`) de cada uno.
- Lo que se decide no hacer queda escrito (por ejemplo, «sin tests» o CA-11/12/14 sin implementar), en vez de perderse.

**Lo que nos cuesta**

- **Nada obliga a que el código cumpla la spec.** No hay verificación automática: hoy solo hay tests de `auth` y del responsable de `tasks`, y de los 32 requisitos de `tasks` la mayoría no tiene test. El contrato puede mentir sin que nada falle, y ya pasó con el filtro. La spec es verdad por convención, no por mecanismo.
- **Los tres changes archivados dejaron tareas sin marcar** en su `tasks.md`: 4 en `add-task-list` y 5 en `add-task-due-date`, todas de comprobación manual. Se archivaron con verificación incompleta, así que «archivado» no significa «verificado».
- **Disciplina y coste de proceso.** Para cambiar una línea de comportamiento hay que escribir proposal, design, tasks y delta, y archivar después. El atajo de implementar directamente es el que causó la divergencia del filtro, y seguirá siendo tentador.
- **Dos sitios que mantener coherentes** mientras un change está abierto (delta y spec viva), y la fusión al archivar es un paso que puede hacerse mal. Las specs han crecido deprisa: `tasks` ya tiene 753 líneas y mezcla backend y pantallas, lo que ya dificulta leerla entera.
- **Prosa sin esquema.** Los requisitos son texto: dos requisitos pueden contradecirse (el filtro tuvo que reescribir dos) y nada lo detecta salvo la lectura.
- **Dependencia de una herramienta y de un esquema** (`spec-driven`) joven, con skills propios que hay que mantener. Si OpenSpec cambia de formato o se abandona, las specs siguen siendo Markdown legible, pero se pierde el flujo de deltas.
- **Contexto de proyecto sin rellenar** en `config.yaml`: las propuestas generadas no reciben stack, convenciones ni reglas por artefacto, y eso empeora su calidad hasta que se complete.

**Qué habría que hacer para que la decisión se sostenga** (no está hecho, queda como deuda): enlazar los tests a los requisitos que cubren, cerrar o descartar explícitamente las tareas manuales abiertas, y rellenar `config.yaml`.
