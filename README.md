<!-- Generado desde la lección de ejercicio del módulo: no se edita a mano. -->

# Ejercicio FlowSync: audita las reglas que escribiste

Es la última lección del módulo y la que más se subestima: leerla son once minutos, **hacerla** lleva bastante más. Todo lo que hay que traer hecho está aquí, y solo aquí.

Cuatro partes. La primera explica cómo funciona el módulo, y conviene leerla aunque tengas prisa. La segunda deja el entorno listo. La tercera es la tarea, que **es la que lleva tiempo de verdad**. La cuarta es cómo se entrega.

---

## 🔁 Cómo funciona este módulo

Hay tres momentos, y saberlos cambia cómo aprovechas cada uno.

**1. Lo intentas tú.** Sobre el proyecto de abajo, con tu agente, con el reloj puesto. Entregas lo que te salga, **con lo que tenga**. La entrega a medias no es un problema: este paso no se puntúa por completarlo.

**2. Lo ves resuelto en el directo.** El mentor hace esta misma auditoría, sobre este mismo proyecto. Si no te salió, ahí ves que se puede y cómo. Por eso conviene **mirar sin teclear**: lo vas a repetir con calma después.

**3. Lo replicas.** Los prompts que use el mentor te llegan por escrito. Con ellos vuelves a tu entorno y rehaces el recorrido, que es donde se asienta.

> ⚠️ **En el paso 3 no esperes salidas idénticas, y no es un fallo tuyo.** El agente no es determinista: con el mismo prompt y el mismo repositorio cambian la redacción, el orden de las filas y hasta cuántas devuelve. Lo que se repite es **la forma del recorrido**, no el texto.

---

## 🛠️ Deja el entorno listo

### 1. Lo que necesita tu máquina

El proyecto funciona en **macOS** y en **Linux**, tal cual, y en **Windows dentro de WSL** (Windows Subsystem for Linux, el Linux que corre dentro de Windows). **En PowerShell no**: los atajos del `Makefile` están escritos para la terminal de macOS y Linux, así que ahí fallan aunque consigas instalar `make`.

> 🪟 **Si trabajas en Windows, haz todo lo de esta lección dentro de la terminal de Ubuntu de WSL**: el clon, Node y `make`. Lo que tengas instalado en Windows no existe dentro de WSL, y al revés. Y clona el proyecto dentro de tu carpeta de Linux (`~/…`), no en `/mnt/c`: desde ahí `npm install` va muy lento. Si aún no tienes WSL, se instala con `wsl --install` desde PowerShell **abierto como administrador**, según la [guía oficial de Microsoft](https://learn.microsoft.com/es-es/windows/wsl/install).

- **Node.js 24 o superior**: `node -v` responde `v24` o más. Con la 20 el proyecto no arranca (`make setup` se para con `Unknown file extension ".ts"`); con la 22 arranca, pero con una pantalla de avisos `EBADENGINE` porque el proyecto pide la 24. La versión **LTS** (*long term support*, la de soporte largo) de [nodejs.org/en/download](https://nodejs.org/en/download) cumple.
- **`make`**: `make --version` responde con un número. Si no: en macOS, `xcode-select --install`; en Linux y en WSL con Ubuntu, `sudo apt install make`.

### 2. Tu fork del repositorio, en la rama de partida

El repositorio del proyecto es:

**`https://github.com/LIDR-academy/flowsync-ai4devs-202609-1`**

Trabaja sobre **tu propio fork**, no sobre un clon directo: durante el directo se abre un cambio propuesto, y sobre un clon del repositorio del curso no tienes permiso de escritura.

```bash
# Si ya tienes tu fork clonado, comprueba que los remotos están montados:
git remote -v
# origin    → tu fork        (fetch/push)
# upstream  → el del curso   (fetch)

# Si clonaste el del curso por error, renombra y añade el tuyo:
git remote rename origin upstream
git remote add origin git@github.com:<tu-usuario>/flowsync-ai4devs-202609-1.git

# Y si empiezas de cero: haz el fork en GitHub y clónalo
git clone git@github.com:<tu-usuario>/flowsync-ai4devs-202609-1.git
cd flowsync-ai4devs-202609-1
git remote add upstream git@github.com:LIDR-academy/flowsync-ai4devs-202609-1.git

# En todos los casos, la rama de partida:
git fetch upstream
git checkout -b s5/start upstream/s5/start

# Y comprueba que tu fork quedó bien montado:
git push -u origin s5/start
```

> 📌 Las ramas que aún no se han publicado **todavía no existen** en tu fork, y eso es normal: por eso se traen desde `upstream`.

> 📌 **Si te sale `Permission denied (publickey)`, es SSH, no el fork.** Es el fallo más común de este paso y no tiene nada que ver con los permisos del repositorio. La guía oficial está en `docs.github.com/es/authentication/connecting-to-github-with-ssh`.

### 3. Dependencias instaladas y el proyecto levanta

Instala y arranca **backend y frontend**. Este proyecto no tiene `package.json` en la raíz: los comandos de `npm` se ejecutan dentro de `backend/` o de `frontend/`, y el `Makefile` de la raíz ya lo hace por ti. Desde la raíz:

```bash
make setup   # solo la primera vez: instala backend y frontend, crea los dos .env, genera la clave y migra la base de datos
make start   # levanta el backend en http://localhost:3333 y el frontend en http://localhost:5173, a la vez
```

`make start` **se queda ocupando la terminal**: arranca los dos servidores juntos, `Ctrl-C` los para, y si uno se cae se lleva al otro. `make` a secas lista todos los atajos. **Comprueba en otra terminal que viven**: `curl -s localhost:3333/` devuelve `{"hello":"world"}`, y `http://localhost:5173` en el navegador enseña FlowSync. El frontend busca el backend en `http://localhost:3333`; si lo levantas en otro puerto, cambia `VITE_API_URL` en `frontend/.env`.

> 🔧 **Si algo falla, casi siempre es una de estas:** `make: command not found` → falta `make`; `Unknown file extension ".ts"` durante `make setup` → tu Node es anterior a la 22; `❌ Faltan dependencias. Ejecuta primero: make setup` → te saltaste el `setup`; un puerto en uso → tienes otro proyecto corriendo en el 3333 o en el 5173: ciérralo y vuelve a lanzar.
>
> **Sin `make`**, los mismos pasos a mano: `npm install` dentro de `backend/` y de `frontend/`, copia en cada una su `.env.example` a `.env`, y en `backend/` ejecuta `node ace generate:key` y `node ace migration:run`. Después, `npm run dev` en cada una, en dos terminales.

### 4. La suite de tests corre y sale en verde

```bash
(cd backend && npm test)
```

> 📌 **Los paréntesis no sobran.** Sin ellos te quedas dentro de `backend/`, y ahí no hay `CLAUDE.md`: el siguiente comando que lances parecerá que no encuentra el proyecto. Con ellos vuelves solo a la raíz.

No tiene atajo en el `Makefile`. Ejecútala una vez antes del directo. Es la mejor comprobación de que tu entorno está bien montado, y en esta sesión se usa como referencia de partida.

### 5. Abre el archivo de instrucciones del agente y localiza sus reglas de proceso

Es `CLAUDE.md`, en la raíz. Busca dentro la sección donde están las **reglas de proceso**: las que dicen qué hay que hacer antes de tocar código, cuándo se commitea y qué va al cerrar el trabajo.

**Léelas enteras.** No hace falta que las entiendas todas ni que las cuentes: hace falta que sepas dónde están y qué clase de cosa dicen, porque **son el material de la tarea** que viene justo abajo.

### 6. Comprueba que tu agente puede consultar el historial

Abre tu sesión de Claude Code en el proyecto y pídele algo tan simple como que te resuma los últimos commits. Si no puede ejecutar comandos de git, resuélvelo **antes** del directo: media sesión se apoya en que pueda leer el historial.

### 7. Crea tu rama

```bash
git checkout -b auditoria-<tus-iniciales>
```

Ahí va todo lo que produzcas.

---

## 📋 La tarea

> ⚠️ **Ve guardando cada prompt tal cual lo lanzas, desde el primero.** Se entregan junto con la tabla, y no valen reconstruidos: el prompt que arreglas mentalmente diez minutos después no es el que lanzaste, y es justo la diferencia que interesa mirar.

### El encuadre, y no es un consuelo

**El entregable no es la tabla. Son las tres líneas de la parte B**, y esas se escriben igual de bien con la tabla a medias.

Y hay algo que conviene saber antes de empezar: **el resultado no lo controlas tú**. Lo produce el historial. Puede salir que varias reglas se incumplen, puede salir que la mayoría no se pueden comprobar, y puede salir que se cumplen todas. **Los tres resultados sirven**, y ninguno es un fallo tuyo ni una señal de que lo hayas hecho mal. Si salen todas cumplidas, la pregunta interesante sigue en pie: *¿lo sabías antes de mirar, o lo dabas por hecho?*

**El reloj tampoco es una crueldad de diseño.** Auditar reglas de proceso se hace siempre en el hueco que hay antes de la reunión, nunca con la tarde entera. Lo que sale en 45 minutos es la parte que depende de tener criterio, no la que depende de tener una herramienta mejor.

**Sobre qué se hace:** sobre las **reglas de proceso** que acabas de localizar en el paso 5, contrastadas contra **los últimos 15 commits** de ese mismo repositorio. Es la misma auditoría que hace el mentor en el directo, con la misma ventana: tú la intentas antes, con tus propios prompts.

> ⚠️ **Resérvale un rato de verdad y ponte el reloj.** Son unos 45 minutos y hay que pararlos. Dejarlo para la noche de antes te deja con una tabla llena de veredictos sin evidencia, que es justo lo que la tarea quiere que veas, pero se aprovecha mejor con tiempo de pensarlo.

---

### 🅰️ Parte A: la auditoría, con reloj

#### Antes de lanzar nada: apunta tu apuesta

Abre el archivo de instrucciones del agente, busca las **reglas de proceso** (las que dicen qué hay que hacer antes de tocar código, cuándo se commitea y qué va al cerrar el trabajo) y, sin comprobar nada todavía, **marca cuáles crees que se están cumpliendo**. Una palabra por regla vale: *sí*, *no*, *ni idea*.

Son treinta segundos y es la mitad del ejercicio. Sin esa apuesta escrita antes, cuando salga el resultado te va a parecer obvio, y no lo era.

#### La tabla

Con un agente, contrasta esas reglas contra **los últimos 15 commits del repositorio y el estado actual del árbol**, y deja el resultado escrito en `docs/auditoria/<tus-iniciales>.md`, no en el chat.

**El formato lo fija esta lección, y no es negociable**: una fila por regla, con estas cinco casillas.

1. **Qué pide la regla.** Una frase, con tus palabras. Si necesitas tres, es que ahí hay dos reglas metidas en una.
2. **Qué se miró para comprobarlo.** El comando concreto, o el archivo. Sin esta casilla la fila no se escribe: es lo único que separa una auditoría de una opinión.
3. **Veredicto**, y solo hay tres: **se cumple**, **no se cumple**, o **no se puede comprobar con lo que hay**. Este tercero no es rendirse, es un dato: significa que esa regla no deja rastro en ninguna parte. Un *se cumple* sin evidencia detrás es en realidad este, mal etiquetado.
4. **La evidencia**, en una línea. Si el veredicto es *no se cumple*, el sitio donde se rompió. Si es *no se puede comprobar*, qué falta para poder comprobarla.
5. **Qué harías con ella.** Una palabra: *dejarla*, *borrarla* o *bajarla* a algo que se ejecute solo.

> ⚠️ **Esto es una auditoría, no un arreglo.** Dile al agente explícitamente que no cambie ningún archivo. Sin esa restricción se pone a corregir lo que encuentra, y entonces ya no puedes saber qué había antes: el propio arreglo borra la evidencia.

> ⚠️ **Cuando suene el reloj, para. Aunque esté a medias.** Aunque falten filas, aunque haya casillas en blanco, aunque justo estuvieras a punto de comprobar una cosa.
>
> Una fila con dos casillas rellenas y tres en blanco **es información**: dice exactamente hasta dónde llegaste. Una fila completada de memoria diez minutos después es ruido con formato, y encima es indistinguible de la buena.

> 📌 **Sobre qué proyecto se hace, cómo dejarlo listo y cómo se entrega, lo tienes en esta misma lección**, arriba y abajo de la tarea: el entorno antes, y el sitio donde dejar el archivo, el plazo y el segundo archivo de la entrega, después.

> ⚠️ **Ve guardando cada prompt tal cual lo lanzas, desde el primero.** Se entregan junto con la tabla, y no valen reconstruidos: el prompt que arreglas mentalmente diez minutos después no es el que lanzaste, y es justo la diferencia que interesa mirar.

---

### 🅱️ Parte B: las tres líneas

Debajo de la tabla, en el mismo archivo, tres líneas anotadas. **Esta parte no se puede fallar**, y es la que hay que traer sí o sí.

1. **La regla sobre la que te equivocaste.** Compara tu apuesta con el veredicto y escribe la que más se separó, en un sentido o en el otro. Si acertaste todas, escríbelo tal cual y añade en una frase **en qué te apoyabas para acertar**: si la respuesta es *"me sonaba"*, eso también es el dato.

2. **La regla que no se puede comprobar con lo que hay**, y en una frase qué tendría que cambiar para que dejara rastro. Puede ser reescribirla, puede ser que algo la ejecute, puede ser que no haya arreglo posible y toque asumir que vive de la buena voluntad.

3. **La regla que borrarías, y por qué.** Hay dos candidatas típicas: la que se cumple sola porque la herramienta ya lo impide, y la que no se cumple nunca y a nadie le ha importado. Elige una y di a cuál de los dos grupos pertenece.

> ⚠️ **Ninguna de las tres tiene respuesta correcta.** La primera es mejor cuanto más incómoda: un *"habría jurado que esa se cumplía"* vale más que una tabla ordenada con seguridad fingida.

---

### Cómo saber que la has hecho bien

- **Tu apuesta está escrita antes que la tabla**, y no la has retocado después de ver el resultado.
- **Las tres líneas están escritas y son concretas.**
- **Hay al menos una fila cuya evidencia comprobaste tú**, abriendo el historial en vez de leyendo lo que el agente resumió.
- **No hay ni un archivo modificado** aparte del tuyo. Si hay más, el agente se puso a arreglar y la auditoría dejó de medir el pasado.
- **La tabla cabe en una pantalla.** Si no cabe, probablemente hayas metido en ella cosas que no son reglas de proceso.

> Entrégalo con lo que tenga.

---

## 📤 Cómo se entrega

Todo lo que produzcas va en la rama que creaste en el último paso del entorno.

**Un pull request desde tu fork**, con dos cosas dentro y ni una más:

1. **Tu archivo de auditoría**, `docs/auditoria/<tus-iniciales>.md`, con la tabla y las tres líneas. El directorio se crea con tu archivo.
2. **`prompts.md`**, en la raíz del proyecto. Ya está ahí con la plantilla puesta.

```bash
git add docs/auditoria prompts.md
git commit -m "auditoria: reglas de proceso + prompts"
git push -u origin auditoria-<tus-iniciales>
```

Con la rama empujada, GitHub te ofrece arriba el botón para abrir el pull request. Va **contra el repositorio del curso**, no contra tu fork.

> 🧠 **`prompts.md` no es papeleo, y es la mitad de lo que se revisa.** Lo que se mira no es solo lo que te salió, es **cómo lo pediste**: un resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan respuestas distintas, y sin ese archivo no se distinguen. Pega los prompts **tal cual los lanzaste**, con su modelo y su herramienta, e incluye también **los que no funcionaron**, que suelen ser los más útiles de leer.

### El plazo

**Antes del directo.** Lo que llegue a tiempo recibe el feedback de tu TA **antes de la sesión**, que es el único momento en que te sirve: llegas sabiendo dónde fallaste y miras la sesión buscando eso. Lo que llegue después se marca como recibido, pero ya no se revisa.

---

## 📚 Si vas justo de tiempo

Si vas justo de tiempo, prioriza dentro de este módulo la lección **sobre la diferencia entre una regla escrita y un guardarraíl que se ejecuta**, y la que trata **qué se puede automatizar y qué solo lo parece**. Las otras dos se siguen bien en vivo; esas dos son el andamiaje sobre el que se apoya todo lo demás.

El resto del material de apoyo está en la **lección de recursos de este módulo**, y es opcional.

---

## ✅ Antes de conectarte, comprueba

- [ ] Estás en la rama de partida, sobre **tu fork**, y `git push` funciona.
- [ ] Backend y frontend levantan.
- [ ] La suite de tests corre y sale verde.
- [ ] Sabes dónde están las **reglas de proceso** en el archivo de instrucciones del agente, y las has leído.
- [ ] Tu agente puede ejecutar comandos de git y leer el historial.
- [ ] **Traes el archivo de la tarea**, con su tabla (aunque esté a medias) y sus tres líneas.
- [ ] **`prompts.md` está relleno**, con modelo y herramienta en cada bloque.
- [ ] **El pull request está abierto.**

> Trae el archivo tal como quedó, sin maquillarlo: lo que le falta es la mitad de lo interesante. Nos vemos en el directo.

---

## 🎯 Qué te llevas del Módulo 5

**El modelo mental**: una **regla escrita en un archivo es una petición, no una garantía**, y se cumple lo bastante como para que dejes de comprobarla, así que cada regla se coloca por su **modo de fallo** y lo que falla en silencio baja a la capa que lo ejecuta; **automatizar la generación de algo no es automatizar su utilidad**, y lo primero que compensa automatizar es lo más aburrido, comprobar que lo generado sigue coincidiendo con su fuente; un **agente puede revisar cambios sin que nadie lo invoque**, y lo que decide si sirve no es el modelo sino dónde aterriza el hallazgo, quién lo lee y quién sigue decidiendo; y un **guardarraíl no muere fallando, muere acertando** sobre cosas que a nadie le importaban, de modo que se presupuesta por ejecución y se mide cuántos hallazgos acaban en un cambio de código.

**Lo que queda en el proyecto**: una **auditoría de sus propias reglas de proceso**, que dice cuáles se cumplen, cuáles no y cuáles no se pueden comprobar; una **comprobación determinista** que verifica que el contrato versionado de la API sigue coincidiendo con el código, y que se ha visto **fallar a propósito** en vez de darla por buena en verde; los **trabajos de integración continua** que ejecutan esa comprobación y lanzan el revisor automático cuando se propone un cambio; un **archivo de calibración** que acota qué se considera grave y cuántas sugerencias menores caben antes de que el ruido se coma la señal; y el **informe de la primera revisión automática**, con lo que cazó sin que nadie se lo señalara.
