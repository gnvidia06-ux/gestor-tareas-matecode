import { auth } from "./firebase";

interface TaskResumen {
  title: string;
  completed: boolean;
}

// Manda el resumen de tareas a la funcion serverless. Adjunta el token de
// Firebase del usuario logueado para que la funcion sepa quien lo pide y
// le envie el mail solo a esa direccion.
export async function enviarResumen(tasks: TaskResumen[]): Promise<void> {
  const usuario = auth.currentUser;
  if (!usuario) {
    throw new Error("No hay una sesion iniciada");
  }

  const token = await usuario.getIdToken();

  const respuesta = await fetch("/api/send-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tasks }),
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo enviar el resumen");
  }
}