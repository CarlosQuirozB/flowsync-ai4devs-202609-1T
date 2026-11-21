# Revisor automático en CI

El workflow [`.github/workflows/claude-review.yml`](../.github/workflows/claude-review.yml) lanza
Claude Code con la acción oficial
[`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action) en cada pull
request que se abre, se actualiza, se reabre o sale de borrador. Los borradores no se revisan
mientras lo son, y los PR de Dependabot tampoco (GitHub les da su propio almacén de secretos, no el
de Actions). Claude lee el diff y los ficheros
que necesite, y publica los hallazgos **como comentarios en el PR**: uno en línea por hallazgo y un
resumen final. No edita ficheros ni hace commits. Solo puede usar `Read`, `Grep`, `Glob`, la
herramienta de comentarios en línea y `gh pr diff|view|comment`. Además, `--permission-mode default`
hace que esa lista sea estricta: lo que no está en ella se deniega.

Qué cuenta como grave, el tope de sugerencias, dónde no reportar y la evidencia que exige cada
hallazgo están en [`REVIEW.md`](../REVIEW.md), en la raíz. El prompt le pide a Claude que lo lea
antes que nada.

## Pasos manuales pendientes

Hasta que no se hagan, el workflow existe pero no revisa nada.

1. **Guardar la credencial como secreto del repositorio.** Se hace en *Settings → Secrets and
   variables → Actions → New repository secret*. Hay dos caminos, explicados
   [más abajo](#credencial-dos-caminos-que-no-son-intercambiables). Sin secreto, la acción falla antes
   de llamar al modelo, al validar el entorno: `Either ANTHROPIC_API_KEY, CLAUDE_CODE_OAUTH_TOKEN, or
   workload identity federation ... is required`. Visto en la primera ejecución del PR #2.
2. **Comprobar los permisos de Actions del repositorio.** En *Settings → Actions → General*, Actions
   tiene que estar habilitado. El workflow declara sus permisos (`contents: read`,
   `pull-requests: write`), así que el ajuste por defecto del `GITHUB_TOKEN` no hace falta cambiarlo.
   Si una política de la organización limita el token a solo lectura, los comentarios fallan con
   `403`.
3. **Ver una primera ejecución de verdad.** En el PR que introduce este workflow, la primera revisión
   corre ya con el fichero de la propia rama. Si el secreto aún no existe, esa ejecución sale en rojo.
   Después de crearlo, relanza el job desde la pestaña *Actions* o empuja un commit.

No hace falta instalar la GitHub App de Claude. El workflow le pasa a la acción el `GITHUB_TOKEN` del
job, así que no necesita `id-token: write`. A cambio, los comentarios aparecen firmados por
`github-actions[bot]` y no por `claude[bot]`.

## En qué se va el dinero

Cada ejecución es una sesión de Claude Code. El gasto depende del modelo, del esfuerzo de razonamiento
y de cuántos turnos y tokens consume la revisión (el diff, los ficheros que abre y los comentarios que
escribe).

- **Modelo: `--model sonnet`.** Es un alias, no una versión fija: apunta siempre al Sonnet más
  reciente. Se eligió porque una revisión de diff es lectura y razonamiento acotado, donde Sonnet
  rinde de sobra por bastante menos que Opus. Haiku sale aún más barato, pero se queda corto para
  razonar sobre contratos y specs.
- **Esfuerzo: `--effort medium`.** Esfuerzo de razonamiento intermedio: menos tokens de pensamiento
  que `high` por revisión.
- **Topes:**
  - `--max-turns 40` corta la sesión a los 40 turnos aunque no haya terminado.
  - `timeout-minutes: 10` mata el job a los 10 minutos.
  - `concurrency` cancela la revisión en curso cuando llega otro push al mismo PR, así no se paga una
    revisión que ya no sirve.

  Los topes acotan el gasto de un PR, pero no el gasto total: cada push a un PR abierto es una
  revisión nueva.
- **Cómo cambiarlo:** edita las líneas de `claude_args` en el workflow.
  - `--model opus` o `--model haiku` cambian de familia.
  - Un ID completo, por ejemplo `--model claude-sonnet-5-5`, fija la versión para que no cambie sola
    cuando salga un Sonnet nuevo.
  - `--effort low|medium|high` ajusta el razonamiento.

  Los modelos disponibles y sus IDs están en la
  [página de modelos](https://platform.claude.com/docs/en/models/overview).

**Precio:** no se cita ninguna cifra aquí porque cambian. Consulta siempre la página oficial:

- Con el token de suscripción, las revisiones consumen el cupo de uso de tu plan Pro o Max, no se
  facturan aparte. Planes en [claude.com/pricing](https://claude.com/pricing).
- Con la clave de API, se paga por token según la tarifa del modelo en
  [la página de precios de la API](https://platform.claude.com/docs/en/about-claude/pricing).

## Credencial: dos caminos que no son intercambiables

Cada camino usa una entrada distinta de la acción y un secreto con un nombre distinto. El workflow
viene preparado para el primero.

### 1. Token de suscripción (Pro o Max), recomendado

- **Cómo se obtiene:** ejecuta `claude setup-token` en local, con la sesión iniciada en tu cuenta de
  Claude, y copia el token que imprime.
- **Secreto:** `CLAUDE_CODE_OAUTH_TOKEN`.
- **Entrada de la acción:** `claude_code_oauth_token`. Es la que ya trae el workflow:

  ```yaml
  claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
  ```

- **Cuidado:** el token tiene caducidad. Cuando caduque, las revisiones fallarán hasta que generes
  otro y actualices el secreto.

### 2. Clave de API de la consola

- **Cómo se obtiene:** se crea en [la consola de Claude](https://platform.claude.com/) y empieza por
  `sk-ant-`.
- **Secreto:** `ANTHROPIC_API_KEY`.
- **Entrada de la acción:** `anthropic_api_key`. En el workflow hay que sustituir la línea de
  `claude_code_oauth_token` por:

  ```yaml
  anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
  ```

### No los cruces

Un token de suscripción metido en `anthropic_api_key`, o una clave de API metida en
`claude_code_oauth_token`, no da ningún error al arrancar. La acción acepta el valor, pero lo envía
como el tipo de credencial equivocado, y **la primera llamada al modelo falla con un error de
autenticación que no dice cuál es el problema**.

Si ves ese fallo, revisa tres cosas, que tienen que corresponder al mismo camino:

- qué entrada usa el workflow;
- cómo se llama el secreto;
- qué pegaste dentro.

## Pull requests desde un fork en un repositorio público

GitHub **no entrega los secretos del repositorio** a los workflows `pull_request` que vienen de un
fork. Además, les da un `GITHUB_TOKEN` de solo lectura. Así que el revisor no tendría credencial para
llamar al modelo ni permiso para comentar.

Por eso el job tiene un `if:` que lo salta cuando la rama del PR está en otro repositorio, y la acción
lleva `allow_fork_prs: "false"` como segunda barrera. En la pestaña *Checks* ese PR aparece con el job
**saltado**, no aprobado: **los PR desde forks no se revisan**.

No lo «arregles» cambiando el disparador a `pull_request_target`. Ese evento sí trae los secretos,
pero entonces el código de un desconocido corre con tu credencial y con permiso de escritura. Si hace
falta revisar un PR de fuera, lo más seguro es que alguien con acceso de escritura lo traiga a una rama
del propio repositorio. Entonces el revisor corre como en cualquier otro PR.
