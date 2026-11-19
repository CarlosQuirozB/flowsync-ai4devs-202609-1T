# 2. Los tests de integración como fuente de verdad ejecutable

## Contexto

El [ADR 0001](0001-openspec-como-fuente-de-verdad.md) estableció que la spec viva de `openspec/specs/` es la fuente de verdad del comportamiento de FlowSync, y que solo cambia a través de las delta-specs de un change de OpenSpec. Ese mismo ADR ya apuntaba los costes que han acabado pesando más que sus ventajas:

- **Nada hacía cumplir la spec.** Cuando se escribió el 0001, solo 3 de los 124 scenarios de `tasks` tenían un test que fallara si se incumplían. Los dos commits de tipo `refactor` del 2026-08-18 (`8c15707`, que dejó el filtro de estado como texto libre, y `99d1425`, que hizo que `isOverdueOn` dejara de mirar `done`) rompieron tres scenarios sin que fallara nada. Solo se detectaron comparando código y spec a mano.
- **La spec y el código se desincronizan en las dos direcciones.** El filtro por estado se implementó antes de especificarse y hubo que escribir el change a posteriori. Los `refactor` hicieron lo contrario: cambiaron el código y dejaron la spec intacta. En ambos casos el documento que «mandaba» no podía saber que mentía.
- **El proceso tiene un coste fijo por cambio.** Cada cambio de comportamiento exige proposal, design, tasks y delta. Los cambios pequeños pagan el mismo peaje que los grandes, y la tentación de saltárselo es justo lo que generó la primera desincronización.
- **Las specs crecen y las deltas tienen límites.** La spec de `tasks` ya ocupaba 753 líneas. Un `MODIFIED` sustituye el requirement entero, y el `## Purpose` no se puede modificar con una delta.

La conclusión es que una fuente de verdad que no se ejecuta solo es verdad mientras alguien la compare a mano. El backend ya tiene lo necesario para ejecutar ese contrato: tests functional de Japa en `backend/tests/functional/`, con `apiClient` tipado a partir del registro de Tuyau (`tests/bootstrap.ts`) y aislamiento de base de datos con `testUtils.db().withGlobalTransaction()`.

## Decisión

**Los tests de integración del backend (`backend/tests/functional/`) pasan a ser la única fuente de verdad ejecutable del comportamiento de FlowSync. Las specs de OpenSpec dejan de mantenerse.**

En concreto:

- **Una regla de comportamiento existe si y solo si hay un test que falla cuando se incumple.** El título del `test()` dice la regla en castellano, igual que hoy `tests/functional/tasks/assignee.spec.ts`, y el cuerpo la comprueba contra la API.
- **Antes de congelar OpenSpec se migran todos los scenarios de API** de `openspec/specs/auth/spec.md` y `openspec/specs/tasks/spec.md` a tests, uno o más por scenario, agrupados por requirement con `test.group()`. Un scenario que no pueda expresarse como test de integración se registra como excluido en la lista de la migración, con el motivo. No se descarta en silencio.
- **Las dos desviaciones conocidas** (el filtro que acepta cualquier texto y `isOverdueOn` sin `done`) se resuelven al migrar. Para cada una se decide si el test codifica lo que pedía la spec, y entonces se corrige el código, o lo que hace el código, y entonces queda registrado que la regla cambió. No se migran como «lo que haya».
- **`openspec/` queda congelado como histórico.** No se borra ni se edita: `specs/` y `changes/archive/` siguen explicando por qué cada regla se escribió así. No se abren changes nuevos.
- **El resto de la documentación enlaza a los tests en vez de a la spec**, y el contrato HTTP lo sigue describiendo el documento OpenAPI generado desde los controladores. Esto incluye `docs/capabilities/*/README.md` y las anotaciones OpenAPI.
- **Un cambio de comportamiento se hace cambiando o añadiendo el test en el mismo commit que el código.** La revisión del PR lee el diff de los tests como el diff del contrato.

## Estado

Aceptada. Reemplaza al [ADR 0001](0001-openspec-como-fuente-de-verdad.md).

## Consecuencias

### Lo que ganamos

- **El contrato se hace cumplir solo.** Un `refactor` como los del 2026-08-18 rompe la suite en vez de pasar desapercibido. La pregunta «¿el código cumple la regla?» la responde `npm test`, no una revisión manual.
- **No puede haber dos versiones.** El test se ejecuta contra el código real, así que un contrato desincronizado es un test en rojo, no un documento que miente.
- **El coste por cambio es proporcional al cambio.** Un ajuste pequeño es un test pequeño, sin proposal, design ni delta.
- **Las herramientas ya están.** Japa, el `apiClient` tipado y el aislamiento por transacción vienen del propio stack, sin dependencias nuevas.

### Lo que nos cuesta

- **Se pierde el porqué.** Un test dice qué se cumple, no por qué se decidió así. Los `proposal.md` y `design.md` explicaban alternativas descartadas y decisiones deliberadas, como que la vista por defecto no sea «todas» o que el filtro viva en la URL. A partir de ahora ese razonamiento solo queda en commits, PRs o ADRs nuevos, y nada obliga a escribirlo.
- **La interfaz se queda sin fuente de verdad.** Buena parte de los requirements de `tasks` son de pantalla (la lista, la pantalla de una tarea, el control de filtro, la señal de vencida, los cuatro tipos de lista vacía). El frontend no tiene runner de tests, así que esos requirements no tienen dónde ejecutarse. O se añade un runner y tests de UI, que es un coste nuevo, o esas reglas pasan a no estar escritas en ningún sitio vigente.
- **La migración es un proyecto en sí.** Hay que convertir decenas de scenarios en tests, y cada uno exige preparar datos, usuarios y tokens. Hasta que termine, conviven una spec congelada y una suite incompleta, y no hay ninguna fuente de verdad entera.
- **Un test también puede codificar un error.** Si un test afirma un comportamiento equivocado, la suite lo protege con la misma fuerza que a uno correcto. Antes, al menos, la spec y el código podían contradecirse y delatar el fallo; ahora solo queda el test.
- **Leer el contrato exige leer código.** Producto, diseño o quien llegue nuevo ya no tienen un documento en prosa con `SHALL`/`WHEN`/`THEN`. Tienen ficheros `.spec.ts` y el documento OpenAPI. Los títulos en castellano ayudan, pero no sustituyen a una spec.
- **Los tests comparten base de datos con el dev server.** `config/database.ts` usa un único `tmp/db.sqlite3`. Cualquier test que olvide el aislamiento por transacción contamina el estado y produce fallos intermitentes, y la fiabilidad de la fuente de verdad pasa a depender de esa disciplina.
- **Más tests, más lenta la suite.** Pasar de unas decenas a cientos de tests functional alarga cada ejecución de `npm test`, y con ello cada vuelta de comprobación antes de un commit.
