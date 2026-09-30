# Gestor estratégico de tareas – MateCode

Aplicación web de una sola página (SPA) para que cada usuario gestione sus tareas de forma privada. Incluye autenticación, persistencia en tiempo real y el envío por email de un resumen de tareas.

Proyecto Integrador 4 del bootcamp Soy Henry.

**Demo en producción:** https://gestor-tareas-coral-iota.vercel.app

## Funcionalidades

- Registro, inicio y cierre de sesión con email y contraseña.
- Rutas protegidas: sin sesión, `/tasks` redirige a `/login`.
- CRUD de tareas por usuario: crear, completar, editar y eliminar.
- Actualización en tiempo real de la lista, sin recargar la página.
- Envío de un resumen de tareas (pendientes y completadas) al email del usuario.
- Reglas de seguridad en Firestore: cada usuario solo puede leer, editar y borrar sus propias tareas.

## Tecnologías

- **Frontend:** React 19, TypeScript, Vite, React Router.
- **Backend como servicio:** Firebase Authentication y Firestore.
- **Emails:** AWS SES, desde una función serverless.
- **Deploy y funciones:** Vercel.
- **Tests:** Vitest y React Testing Library.

## Estructura del proyecto

```
api/
  send-summary.ts        Función serverless (Vercel Function) que envía el email con SES
src/
  hooks/                 useAuth (sesión) y useTasks (tareas en tiempo real)
  pages/                 Login, Register y Tasks
  routes/                ProtectedRoute
  services/              firebase, taskService y summaryService
  types/                 Tipos de TypeScript (Task)
  setupTests.ts          Configuración de los tests
vercel.json              Redirección de rutas para la SPA
```

## Decisiones arquitectónicas

- **Organización por capas.** `pages` contiene las vistas, `hooks` la lógica de React (sesión y tareas), `services` el acceso a Firebase y a la API, `routes` las rutas protegidas, `types` los tipos compartidos y `api` las funciones serverless. Cada capa tiene una sola responsabilidad, lo que facilita probar y cambiar partes por separado.
- **Firebase como backend.** Authentication y Firestore evitan montar un servidor propio. Firestore permite actualizar la lista en tiempo real con `onSnapshot`, sin recargar la página.
- **Sesión con Context.** `AuthProvider` usa `onAuthStateChanged`, por lo que la sesión persiste al recargar. `ProtectedRoute` espera a que termine de cargar antes de decidir, para evitar redirecciones falsas al login.
- **Seguridad de los datos.** Las reglas de Firestore permiten que cada usuario lea, edite y borre solo sus tareas. El `userId` lo toma el código del usuario autenticado, nunca el formulario.
- **Email desde una función serverless.** Las credenciales de AWS solo existen del lado del servidor, en variables sin prefijo `VITE_`, y nunca llegan al navegador. La función vive en la carpeta `api/` porque es la que Vercel reconoce automáticamente como Vercel Functions.
- **Tests con simulaciones.** Firebase y AWS se reemplazan por versiones falsas, así los tests corren rápido y sin credenciales.
- **Limitación conocida.** La función `send-summary` todavía no verifica el token de Firebase del usuario. Una mejora futura es exigirlo para que solo usuarios autenticados puedan invocarla.

## Requisitos previos

- Node.js 20 o superior.
- Un proyecto de Firebase con Authentication (email/contraseña) y Firestore activados.
- Una cuenta de AWS con SES configurado: un remitente verificado y un usuario IAM con permiso para enviar emails.
- Vercel CLI (`npm install -g vercel`) para probar la función de email en local.

## Instalación

1. Clonar el repositorio e instalar las dependencias:

```bash
   npm install
```

2. Crear el archivo de variables de entorno a partir del ejemplo:

```bash
   cp .env.example .env
```

   En Windows (PowerShell): `Copy-Item .env.example .env`

3. Completar el `.env` con tus propios valores (ver la sección siguiente).

4. En Firestore, crear el índice compuesto que necesita la consulta de tareas: colección `tasks`, campos `userId` (ascendente) y `createdAt` (descendente). Si falta, la consola del navegador muestra un enlace para crearlo con un clic.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Configuración de la app web de Firebase |
| `VITE_FIREBASE_APP_ID` | Configuración de la app web de Firebase |
| `AWS_ACCESS_KEY_ID` | Clave de acceso del usuario IAM de AWS |
| `AWS_SECRET_ACCESS_KEY` | Clave secreta del usuario IAM de AWS |
| `AWS_REGION` | Región de SES (por ejemplo, `us-east-2`) |
| `SES_SENDER_EMAIL` | Remitente verificado en SES |

El archivo `.env` está en el `.gitignore` y nunca debe subirse al repositorio. El repositorio incluye `.env.example`, que solo tiene los nombres de las variables.

## Ejecución en local

Para correr la app **junto con la función de email**:

```bash
vercel dev
```

La app queda en `http://localhost:3000`. La primera vez, Vercel pide iniciar sesión y vincular el proyecto.

Si solo se necesita el frontend, sin el envío de emails:

```bash
npm run dev
```

## Flujo de envío de emails

1. El usuario aprieta **Enviar resumen por email** en la pantalla de tareas.
2. `Tasks.tsx` llama a `enviarResumen(email, tareas)`, definida en `summaryService.ts`.
3. El servicio hace un `POST` a `/api/send-summary` con el email y la lista de tareas.
4. La función serverless valida el método y los datos, y arma el texto con las tareas pendientes y completadas.
5. Con el SDK de AWS, crea un cliente de SES con las credenciales de las variables de entorno y envía el mensaje desde `SES_SENDER_EMAIL`.
6. La función responde `200` si salió bien o `500` si falló, y la pantalla muestra el resultado al usuario.

## Tests

```bash
npm test
```

Para una sola corrida, sin modo vigilancia:

```bash
npm test -- --run
```

Los tests cubren `ProtectedRoute` (cargando, sin sesión y con sesión) y la pantalla de tareas (formulario, validación, eliminar y envío del resumen). Firebase y AWS se reemplazan por versiones simuladas, así que no hacen falta credenciales para correrlos.

## Otros comandos

| Comando | Qué hace |
| --- | --- |
| `npm run lint` | Revisa el código con ESLint |
| `npm run build` | Comprueba los tipos y genera la versión de producción |
| `npm run preview` | Sirve localmente la versión compilada |

## Deploy en Vercel

1. Cargar las 10 variables del `.env` en **Settings → Environment Variables** del proyecto en Vercel.
2. Desplegar con:

```bash
   vercel --prod
```

3. Agregar el dominio de producción en Firebase, en **Authentication → Settings → Authorized domains**. Sin este paso el login falla en la URL pública.

El archivo `vercel.json` redirige todas las rutas a `index.html`, salvo las que empiezan con `/api/`. Así, recargar la página en `/tasks` no da error 404 y la función de email sigue disponible.

## Uso de IA en el proceso de trabajo

Usé un asistente de IA (Claude) como apoyo durante todo el desarrollo, y fue más efectivo en estas situaciones:

- **Depurar configuración.** Me ayudó a detectar errores concretos en el `.env` y en el flujo de `vercel dev`.
- **Interpretar mensajes de error.** Por ejemplo, un test fallaba porque lo que se dibujaba en un test quedaba en pantalla en el siguiente. Entendí que faltaba limpiar entre tests y lo resolví con `cleanup`.
- **Escribir tests.** Me ayudó a armar las simulaciones de Firebase y de AWS para probar las pantallas sin credenciales.
- **Corregir lint.** Entendí por qué ESLint marcaba el uso de `any` y el `setState` dentro de un efecto, y cómo corregirlos.
- **Preparar el deploy.** Me guió con las variables en Vercel, la redirección de rutas y la autorización del dominio en Firebase.

Buenas prácticas que descubrí:

- Pasarle archivos completos, no fragmentos, para recibir respuestas precisas.
- Verificar cada cambio con `npm run lint`, `npm test` y `npm run build` antes de hacer commit.
- Pedir que explique el motivo de cada cambio, en lugar de copiar y pegar sin entender.
- No compartir credenciales en capturas ni en el chat: una clave expuesta hay que rotarla.

### Registro de uso de IA

El registro con capturas de las consultas y una explicación de qué hice con cada respuesta está acá:

[Ver registro de IA en Google Drive](PEGAR_AQUI_EL_ENLACE_DE_DRIVE)

## Notas

- La cuenta de AWS SES puede estar en modo *sandbox*. En ese modo solo se pueden enviar emails a direcciones verificadas. Para enviar a cualquier destinatario hay que pedir a AWS la salida del sandbox.
- Las variables con prefijo `VITE_` quedan incluidas en el código que recibe el navegador. Eso es esperable para la configuración de Firebase, y los datos se protegen con las reglas de Firestore. Las variables de AWS no llevan ese prefijo y solo se usan del lado del servidor.