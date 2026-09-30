interface TaskResumen {
  title: string;
  completed: boolean;
}

export async function enviarResumen(
  email: string,
  tasks: TaskResumen[]
): Promise<void> {
  const respuesta = await fetch("/api/send-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, tasks }),
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo enviar el resumen");
  }
}