# Gestor estratégico de tareas (MateCode)

Este es mi Proyecto Integrador 4 del bootcamp Soy Henry. Es una aplicación web para que cada persona pueda armar su lista de tareas, marcarlas como hechas y, cuando quiera, recibir por mail un resumen de lo que tiene pendiente y de lo que ya completó.

**Probala acá:** https://gestor-tareas-coral-iota.vercel.app

## Qué se puede hacer

- Crear una cuenta, iniciar sesión y cerrarla con email y contraseña.
- Crear, editar, completar y eliminar tareas. Cada usuario ve solo las suyas.
- Ver la lista actualizada al instante, sin recargar la página.
- Mandarse por email un resumen con las tareas pendientes y las completadas.
- Si alguien intenta entrar a `/tasks` sin haber iniciado sesión, la app lo manda a `/login`.

## Con qué está hecho

- **React 19 + TypeScript + Vite** para el frontend, con React Router para las rutas.
- **Firebase Authentication y Firestore** para las cuentas y para guardar las tareas.
- **AWS SES** para enviar los mails.
- **Vercel** para publicar la app y para correr la función que habla con SES.
- **Vitest y React Testing Library** para los tests.

## Cómo está organizado el código

```
api/
  send-summary.ts        Función de Vercel que envía el mail con SES
src/
  hooks/                 useAuth (sesión) y useTasks (tareas en tiempo real)
  pages/                 Login, Register y Tasks
  routes/                ProtectedRoute
  services/              firebase, taskService y summaryService
  types/                 Tipos de TypeScript (Task)
  setupTests.ts          Configuración de los tests
vercel.json              Redirección de rutas para la app de una sola página
```

## Decisiones que tomé y por qué

**Separar el código por capas.** Las pantallas están en `pages`, la lógica de React (sesión y tareas) en `hooks`, todo lo que habla con Firebase o con la API en `services`, y los tipos en `types`. Me sirvió para que cada archivo haga una sola cosa y para poder probar cada parte por separado.

**Firebase en lugar de un servidor propio.** Con Authentication y Firestore me ahorré montar y mantener un backend. Además, Firestore permite escuchar los cambios en vivo con `onSnapshot`, y así la lista se actualiza sola.

**La sesión vive en un Context.** `AuthProvider` usa `onAuthStateChanged`, y por eso la sesión se mantiene aunque se recargue la página. `ProtectedRoute` espera a que Firebase termine de revisar la sesión antes de decidir a dónde mandar al usuario. Sin esa espera, se veía un parpadeo hacia el login aunque la persona estuviera logueada.

**La seguridad está en las reglas de Firestore.** Las reglas solo dejan leer, editar y borrar las tareas propias. El `userId` lo toma el código a partir del usuario autenticado y nunca sale del formulario, para que nadie pueda crear tareas a nombre de otro.

**El mail se envía desde una función de Vercel.** Las credenciales de AWS no pueden estar en el navegador, porque cualquiera las vería. Por eso viven como variables de entorno del lado del servidor, sin el prefijo `VITE_`. La función está en la carpeta `api/` porque es la que Vercel reconoce automáticamente.

**Los tests no dependen de servicios reales.** Simulo Firebase y AWS con versiones falsas. Así los tests corren rápido y no hace falta tener credenciales para ejecutarlos.

**Algo que falta y que sé que falta.** La función `send-summary` todavía no comprueba el token de Firebase de quien la llama. Como mejora futura, la haría exigir que el usuario esté autenticado, para que nadie de afuera pueda usarla.

## Reglas de seguridad de Firestore

Las reglas están en [`firestore.rules`](./firestore.rules) y son las mismas que tengo publicadas en la consola de Firebase. Hacen que cada usuario solo pueda trabajar con sus propias tareas:

- **Leer, editar y borrar:** solo si el usuario está autenticado y su `uid` coincide con el `userId` guardado en la tarea.
- **Crear:** solo si el usuario está autenticado y el `userId` de la tarea nueva es su propio `uid`.

El `userId` nunca lo manda el formulario: lo agrega el código a partir del usuario logueado. Y la consulta de la lista filtra por `userId`, así que Firestore solo devuelve tareas propias.

## Cómo correrlo en tu computadora

Necesitás Node.js 20 o superior, un proyecto de Firebase con Authentication (email y contraseña) y Firestore activados, y una cuenta de AWS con un remitente verificado en SES y un usuario de IAM con permiso para enviar mails. Para probar el envío de mails en local también hace falta Vercel CLI (`npm install -g vercel`).

1. Instalá las dependencias:

```bash
   npm install
```

2. Copiá el archivo de ejemplo de variables de entorno:

```bash
   cp .env.example .env
```

   En Windows con PowerShell: `Copy-Item .env.example .env`

3. Completá el `.env` con tus datos (la lista está más abajo).

4. Creá en Firestore el índice que necesita la consulta de tareas: colección `tasks`, con `userId` ascendente y `createdAt` descendente. Si no lo creás, la consola del navegador te muestra un enlace para hacerlo con un clic.

5. Levantá todo junto, app y función de mail:

```bash
   vercel dev
```

   Queda disponible en `http://localhost:3000`. La primera vez, Vercel te pide iniciar sesión y vincular el proyecto.

Si solo querés ver el frontend, sin el envío de mails, alcanza con `npm run dev`.

## Variables de entorno

| Variable | Para qué sirve |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_APP_ID` | Configuración de la app web de Firebase |
| `AWS_ACCESS_KEY_ID` | Clave de acceso del usuario de IAM |
| `AWS_SECRET_ACCESS_KEY` | Clave secreta del usuario de IAM |
| `AWS_REGION` | Región de SES (por ejemplo, `us-east-2`) |
| `SES_SENDER_EMAIL` | Mail remitente, verificado en SES |

El `.env` está en el `.gitignore` y no se sube al repositorio. Lo que sí está es `.env.example`, que tiene solo los nombres de las variables, sin valores.

## Cómo se envía el mail de resumen

1. La persona aprieta **Enviar resumen por email** en la pantalla de tareas.
2. `Tasks.tsx` llama a `enviarResumen` (en `summaryService.ts`) con el email del usuario y su lista de tareas.
3. Ese servicio hace un `POST` a `/api/send-summary`.
4. La función de Vercel revisa que el método y los datos sean válidos y arma el texto, separando pendientes y completadas.
5. Con el SDK de AWS crea un cliente de SES usando las variables de entorno y manda el mensaje desde el remitente configurado en `SES_SENDER_EMAIL`.
6. Responde `200` si salió bien o `500` si hubo un error, y la pantalla le muestra el resultado al usuario.

## Tests

```bash
npm test
```

Para correrlos una sola vez, sin quedarse escuchando cambios:

```bash
npm test -- --run
```

Hay tests para `ProtectedRoute` (mientras carga, sin sesión y con sesión) y para la pantalla de tareas (el formulario, la validación del título, eliminar con confirmación y el envío del resumen). En total son 12.

Otros comandos que uso seguido:

| Comando | Qué hace |
| --- | --- |
| `npm run lint` | Revisa el código con ESLint |
| `npm run build` | Chequea los tipos y genera la versión de producción |
| `npm run preview` | Sirve localmente la versión compilada |

## Cómo lo publiqué en Vercel

1. Cargué las 10 variables del `.env` en **Settings → Environment Variables** del proyecto en Vercel.
2. Desplegué con `vercel --prod`.
3. Agregué el dominio de producción en Firebase, en **Authentication → Settings → Authorized domains**. Sin este paso el login falla en la página publicada.

El archivo `vercel.json` manda todas las rutas a `index.html`, excepto las que empiezan con `/api/`. Gracias a eso, recargar la página estando en `/tasks` no da error 404 y la función de mail sigue funcionando.
### Registro del uso de IA
guarde un registro de como use IA en el protecyo con capturas de las consultas que hice 
[Ver registro de IA en Google Drive] (https://drive.google.com/drive/folders/11Cz9038RKfD2Iu4bCqubMMC7SXTrXhb-?usp=sharing)

## Cómo usé la IA en el proceso

Usé Claude durante todo el proyecto, y funcionó como un compañero al que le pasaba lo que tenía en pantalla y me decía qué estaba mal. No fue "pedir y pegar": tuve que revisar lo que me devolvía, y varias veces tenía errores.

### Cómo trabajé

- **Le pasaba archivos completos y capturas de la terminal.** Cuando le mandaba solo un pedazo, las respuestas eran más vagas. Con el archivo entero y el error exacto, el diagnóstico era mucho más preciso.
- **Avanzaba en pasos chicos.** Una cosa por vez: primero el `.env`, después `vercel dev`, después el botón del mail, después los tests. Así, cuando algo se rompía, sabía en qué paso había sido.
- **Verificaba cada cambio antes de guardarlo.** Después de cada tanda de cambios corría `npm run lint`, `npm test` y `npm run build`, y recién ahí hacía el commit. Esos tres comandos fueron mi forma de validar lo que me sugería la IA.
- **Preguntaba el porqué.** Cuando algo no lo entendía, preguntaba en lugar de seguir. Y cuando una sugerencia no me cerraba, la discutía y decidía yo.

### Dónde fue más útil

- **Encontrar errores de configuración.** Mi `.env` tenía dos variables pegadas en la misma línea y las dos columnas del CSV de AWS juntas. A mí me parecía bien, y no lo habría encontrado rápido.
- **Entender mensajes de error.** Cuando un test fallaba porque se acumulaban las pantallas de un test al siguiente, entendí que faltaba limpiar entre tests y lo resolví con `cleanup()`.
- **Armar los tests con mocks.** Aprendí a reemplazar Firebase y AWS por versiones falsas para probar las pantallas sin credenciales.
- **Entender el lint.** Aprendí por qué ESLint se quejaba del `any` y del `setState` dentro de un efecto.
- **Pensar la seguridad.** Me ayudó a ver que mi función de email aceptaba cualquier destinatario y que había que validar el token de Firebase.

### Cuándo la IA se equivocó (y cómo lo detecté)

- Primero me dijo que quizás la función de email no existía, y después se corrigió cuando vio en mi explorador que `api/send-summary.ts` ya estaba.
- Me dijo que los errores de lint eran "solo de estilo", pero ESLint los marcaba como errores. Lo vi al correr `npm run lint`, y por eso los arreglé.
- La regla de `vercel.json` que me dio al principio mandaba todo a `index.html`, incluso los archivos que Vite pide en desarrollo, y rompía el servidor local. Lo vi en el log, y se corrigió.
- El setup de tests que me dio no limpiaba la pantalla entre tests, y un test fallaba por eso.

También me equivoqué yo: puse el CSS en `index.html` en lugar de `index.css`, y escribí mal dos nombres de archivo (`vercer.json` y `TaskFrom.tsx`). Los encontré revisando el explorador de VS Code y el error del navegador.

### Decisiones técnicas que tomé

- **Validar el token con la API de Firebase Auth en lugar de `firebase-admin`.** La función hace una consulta con la clave web que ya tenía cargada, y así evité cargar una clave de servicio nueva como otro secreto en Vercel. El destinatario sale del token, no del cuerpo del pedido.
- **No agregar librerías de estilos.** Hice el diseño con CSS simple, porque la consigna evalúa funcionalidad y arquitectura, y no quería sumar riesgo.
- **Extraer `TaskForm` y `TaskList` a `components`.** Para que `Tasks.tsx` solo conecte piezas y cada componente haga una sola cosa.
- **Guardar una copia de las reglas de Firestore en el repositorio.** Como evidencia de cómo protejo los datos.

### Qué aprendí sobre trabajar con IA

- Sirve más para entender que para copiar: si no entiendo el cambio, no lo guardo.
- Hay que validar siempre con lint, tests y build, porque puede sonar muy segura y estar equivocada.
- Conviene cuidar las credenciales: mantener el `.env` fuera del repositorio y no pasarlas en mensajes ni en capturas.

## Cosas para tener en cuenta

- **Convención de commits.** Los primeros commits siguen el formato `hito N: ...`, porque los fui haciendo etapa por etapa. A partir de ahí uso commits semánticos (`feat`, `fix`, `docs`, `test`, `style`, `refactor`) para que el historial sea más fácil de leer.

- Mi cuenta de AWS SES está en modo *sandbox*, y en ese modo solo se pueden enviar mails a direcciones verificadas. Para mandar a cualquier destinatario habría que pedirle a AWS que saque la cuenta del sandbox.
- Las variables que empiezan con `VITE_` terminan dentro del código que recibe el navegador. Es lo esperable para la configuración de Firebase, y los datos quedan protegidos por las reglas de Firestore. Las variables de AWS no tienen ese prefijo, así que solo se usan del lado del servidor.