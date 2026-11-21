# Calibración del revisor de PRs

Solo para revisiones de código. Lo demás está en `CLAUDE.md`.

## Grave: comentario en línea, siempre

- Rompe un scenario de `openspec/specs/`. Cita el scenario por su título.
- Fuga de datos o de acceso: el email u otro dato de cuenta sale en una respuesta, una ruta de escritura no
  lleva `middleware.auth()`, o un modelo se devuelve en crudo sin pasar por un transformer.
- Una entrada que la spec manda rechazar con 422 se acepta. Ejemplo: un `vine.string()` donde va un `vine.enum`.
- Un comentario, un JSDoc, el README de la capability o el OpenAPI afirman algo que el código no hace.
- Un test que pasa sin comprobar lo que dice su título.
- Se edita a mano un fichero generado.
- Un error de tipos o de lint que puedas citar. **Ningún job de CI corre `tsc` ni el lint**, así que
  si no lo marcas tú, nadie lo marca.

Nada más es grave. Nombres, refactors, legibilidad, rendimiento sin un caso medido y tests que faltan
para código que el PR no toca son **sugerencias**.

## Tope de sugerencias

Como mucho **3 sugerencias en línea** por revisión: las de más valor. El resto va en el comentario
final como una sola línea contada: «N sugerencias más: 2 de nombres, 1 de duplicación…».

## Dónde no reportar

- Lo que ya vigila otra comprobación: que `docs/api/openapi.json` coincida con las rutas lo vigila el
  job `openapi-check`. Es la única que corre en CI.
- El formato puro (espacios, comillas, saltos de línea): es estilo y se arregla con Prettier.
- Ficheros generados: `backend/database/schema.ts`, `backend/.adonisjs/`, `docs/api/openapi.json`,
  `frontend/src/components/ui/` (shadcn) y los `package-lock.json`. Sí es grave que se editen a mano.
- Código que el diff no toca, salvo que el cambio lo rompa.
- El estilo de la prosa en docs y comentarios. Que digan algo falso sí es grave, ver arriba.

## Evidencia obligatoria

- **Comportamiento:** para afirmar que algo se comporta de cierta manera, cita `archivo:línea` donde
  lo has leído. No lo deduzcas del nombre de una función, de un comentario ni de un test.
- **Lo que no puedas citar:** no lo afirmes. Si no lo encuentras, dilo como pregunta.
- **Grave:** cada hallazgo grave incluye el escenario de fallo concreto (entrada → resultado) y, si
  aplica, el scenario de la spec que rompe.
