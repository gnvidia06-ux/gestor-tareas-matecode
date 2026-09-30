import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

interface TaskResumen {
  title: string;
  completed: boolean;
}

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo aceptamos POST; cualquier otro metodo se rechaza.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const { email, tasks } = req.body as { email: string; tasks: TaskResumen[] };

  if (!email || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "Faltan datos: email o tasks" });
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