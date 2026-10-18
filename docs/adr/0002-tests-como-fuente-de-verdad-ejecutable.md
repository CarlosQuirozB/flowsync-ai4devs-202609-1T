# 2. Los tests de integración como única fuente de verdad ejecutable

## Estado

Aceptada, con fecha prevista 2027-10-17. Reemplaza a [ADR 0001](0001-openspec-como-fuente-de-verdad.md).

> Este ADR se escribe el 2026-10-17 como el registro anticipado de un cambio que se plantea para dentro de un año. Lo que sigue en «Contexto» describe el estado de hoy y lo que damos por supuesto para entonces; cuando llegue la fecha hay que revisar esos supuestos antes de darlo por bueno.

## Contexto

El [ADR 0001](0001-openspec-como-fuente-de-verdad.md) fijó la spec viva de OpenSpec como fuente de verdad, y se reconoció entonces su punto débil: **nada obligaba a que el código cumpliera la spec**. Hoy se ve así:

- `openspec/specs/` tiene `auth` (19 requisitos) y `tasks` (32 requisitos), en prosa con escenarios `WHEN`/`THEN`.
- De esos escenarios, los tests functional solo cubren `auth` y el responsable de la tarea (`tests/functional/tasks/assignee.spec.ts`). Los tres changes archivados declararon «sin tests» a propósito, y dejaron tareas de comprobación manual sin marcar.
- El contrato ya divergió una vez del código (el filtro por estado, commit `209df12`) y nada lo detectó hasta que alguien lo leyó.
- El mantenimiento de la spec cuesta proceso por cada cambio (proposal, design, tasks, delta, archivo) y la spec de `tasks` ya ocupa 753 líneas.

Supuestos para el momento en que se aplique esta decisión, a verificar entonces:

- Existe una suite de integración que cubre los comportamientos que hoy describen las specs. **Hoy no existe**; escribirla es condición previa a esta decisión (ver Consecuencias).
- Los tests corren en CI en cada PR y su fallo bloquea la fusión.
- Los tests aíslan su base de datos (hoy comparten el SQLite del servidor de desarrollo salvo que usen `testUtils.db().withGlobalTransaction()`).

## Decisión

Los **tests de integración** de `backend/tests/functional/` son la única fuente de verdad ejecutable de lo que el sistema hace. Un comportamiento existe si un test lo comprueba, y un cambio de comportamiento es un cambio de test.

- Se **deja de mantener** `openspec/specs/` y el flujo de changes con delta-specs. No se borran: quedan congelados en el repositorio como historia, con un aviso al principio de cada spec indicando que ya no se actualiza y apuntando a los tests.
- Cada test se nombra por el comportamiento que garantiza, en términos de negocio (el título del test es la frase que antes era un `Scenario`), para que la lista de tests se lea como la especificación.
- Los **porqués y lo que se decide no hacer** dejan de tener un hogar propio (`proposal.md`, `design.md`). Pasan a los mensajes de commit, a la descripción del PR y a comentarios junto al código o al test, como ya se hace en los controladores y validadores.
- Los documentos derivados (README de capability, OpenAPI) se alinean con los tests, no con una spec: el README enlaza los ficheros de test en lugar de los requisitos.
- Lo que no es verificable por un test de integración del backend (pantallas, accesibilidad, texto de interfaz) **no queda cubierto por esta fuente** y requiere otra decisión (ver Consecuencias).

## Consecuencias

**Lo que ganamos**

- La fuente de verdad deja de poder mentir en silencio: si el código cambia el comportamiento, un test falla. Desaparece la clase de divergencia que sufrió el filtro.
- Un solo artefacto que mantener en lugar de spec, delta y código; el coste de proceso por cambio baja.
- Los tests son ejecutables: sirven a la vez de documentación, de red de seguridad para refactorizar y de comprobación en CI.

**Lo que nos cuesta**

- **Condición previa y trabajo grande.** Hoy casi ninguno de los 32 requisitos de `tasks` tiene test. Antes de congelar la spec hay que portar sus escenarios a tests; si no se hace, al congelarla perdemos documentación de comportamiento que ningún test sustituye. Una migración a medias es peor que cualquiera de los dos extremos.
- **Se pierde legibilidad para quien no programa.** Producto y quien revisa sin leer TypeScript ya no tienen un documento en prosa. Un test dice *qué* se comprueba, mal *por qué* importa y nada de lo que queda fuera.
- **Los tests solo describen lo que alguien pensó probar.** Una spec puede afirmar «nunca ocurre X»; un test prueba casos concretos. Los requisitos negativos y las decisiones deliberadas de no hacer algo («sin lista viva», «no se filtra por responsable») se vuelven difíciles de expresar y fáciles de olvidar.
- **El porqué se dispersa.** Los `proposal.md` y `design.md` archivados dejan de tener continuación; el razonamiento acaba en historial de git y comentarios, que son más difíciles de encontrar y de recorrer en orden.
- **Cobertura de frontend sin resolver.** No hay runner de tests en `frontend/`, y la spec actual describe pantallas enteras. Hasta que se monte uno (o se acepte explícitamente que el frontend queda sin fuente de verdad ejecutable), una parte del producto queda sin fuente de verdad.
- **Los tests de integración son más lentos y frágiles** que una spec: dependen de la base de datos, del orden de datos y de los tipos generados en `.adonisjs/`. Una suite lenta o intermitente se acaba ignorando y con ella la fuente de verdad.
- **Tests y comportamiento pueden estar mal a la vez.** Un test verde prueba que el código hace lo que el test dice, no que sea lo que se quería. Sin una spec independiente, ningún artefacto contrasta el test.
- **Trabajo ya hecho que se abandona.** Las skills `openspec-*` y la carpeta `openspec/` quedan sin uso, y las referencias a la spec (README de `tasks`, ADR 0001) hay que reapuntar.

**Qué hay que hacer para que la decisión se sostenga:** portar los escenarios de la spec a tests antes de congelarla; hacer obligatoria la suite en CI; decidir qué pasa con el frontend; y reapuntar los documentos que enlazan la spec.
