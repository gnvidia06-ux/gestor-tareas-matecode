import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

interface TaskResumen {
  title: string;
  completed: boolean;
}

const MAX_TASKS = 200;
const MAX_TITLE_LENGTH = 200;

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// Comprueba el token de Firebase que manda el frontend y devuelve el email
// del usuario dueño del token (o null si el token no es valido).
async function obtenerEmailDelToken(
  authorization: string | undefined
): Promise<string | null> {
  if (!authorization?.startsWith("Bearer ")) return null;

  const idToken = authorization.slice("Bearer ".length);
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const respuesta = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!respuesta.ok) return null;

    const data = (await respuesta.json()) as {
      users?: { email?: string }[];
    };
    return data.users?.[0]?.email ?? null;
  } catch {
    return null;
  }
}

// Valida la forma y el tamaño de la lista de tareas que llega en el body.
function tareasValidas(tasks: unknown): tasks is TaskResumen[] {
  return (
    Array.isArray(tasks) &&
    tasks.length <= MAX_TASKS &&
    tasks.every(
      (t) =>
        typeof t === "object" &&
        t !== null &&
        typeof (t as TaskResumen).title === "string" &&
        (t as TaskResumen).title.length <= MAX_TITLE_LENGTH &&
        typeof (t as TaskResumen).completed === "boolean"
    )
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo aceptamos POST; cualquier otro metodo se rechaza.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  // El destinatario sale del token, nunca del body: asi nadie puede
  // usar esta funcion para mandar mails a otras personas.
  const email = await obtenerEmailDelToken(req.headers.authorization);
  if (!email) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const { tasks } = (req.body ?? {}) as { tasks?: unknown };

  if (!tareasValidas(tasks)) {
    return res.status(400).json({ error: "Lista de tareas invalida" });
  }

  // Arma el cuerpo del email en texto plano a partir de las tareas.
  const completadas = tasks.filter((t) => t.completed);
  const pendientes = tasks.filter((t) => !t.completed);

  const cuerpo = `
Resumen de tus tareas

Pendientes (${pendientes.length}):
${pendientes.map((t) => `- ${t.title}`).join("\n") || "  (ninguna)"}

Completadas (${completadas.length}):
${completadas.map((t) => `- ${t.title}`).join("\n") || "  (ninguna)"}
  `.trim();

  try {
    await sesClient.send(
      new SendEmailCommand({
        Source: process.env.SES_SENDER_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: "Resumen de tus tareas" },
          Body: { Text: { Data: cuerpo } },
        },
      })
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error al enviar email con SES:", error);
    return res.status(500).json({ error: "No se pudo enviar el email" });
  }
}