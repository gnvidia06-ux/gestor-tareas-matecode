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

## Cómo usé la IA en el proceso

Usé Claude como apoyo durante todo el proyecto. Donde más me sirvió fue en estas situaciones:

- **Encontrar errores de configuración.** Me ayudó a ver que mi `.env` estaba mal armado (variables pegadas en la misma línea y las dos claves de AWS juntas) y a ordenar los pasos para levantar el proyecto con `vercel dev`.
- **Entender mensajes de error.** Un test fallaba porque lo que dibujaba un test seguía en pantalla en el siguiente. Entendí que faltaba limpiar entre tests y lo resolví agregando `cleanup`.
- **Armar los tests.** Me mostró cómo reemplazar Firebase y AWS por versiones falsas para probar las pantallas sin credenciales.
- **Arreglar el lint.** Entendí por qué ESLint se quejaba del uso de `any` y de llamar a `setState` dentro de un efecto, y cómo corregirlo sin cambiar el comportamiento de la app.
- **Preparar el deploy.** Me guió con las variables en Vercel, con la redirección de rutas y con la autorización del dominio en Firebase.

Algunas cosas que aprendí sobre cómo trabajar con IA:

- Da mejores resultados pasarle archivos completos que fragmentos sueltos.
- Conviene verificar cada cambio con `npm run lint`, `npm test` y `npm run build` antes de hacer commit, en lugar de confiar a ciegas.
- Sirve más pedir que explique el motivo de cada cambio que copiar y pegar sin entender.
- Nunca hay que dejar credenciales a la vista en capturas ni en el chat. Si una clave se expone, hay que rotarla.

## Cosas para tener en cuenta

- Mi cuenta de AWS SES está en modo *sandbox*, y en ese modo solo se pueden enviar mails a direcciones verificadas. Para mandar a cualquier destinatario habría que pedirle a AWS que saque la cuenta del sandbox.
- Las variables que empiezan con `VITE_` terminan dentro del código que recibe el navegador. Es lo esperable para la configuración de Firebase, y los datos quedan protegidos por las reglas de Firestore. Las variables de AWS no tienen ese prefijo, así que solo se usan del lado del servidor.