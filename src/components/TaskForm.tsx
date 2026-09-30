import { useState } from "react";
import type { FormEvent } from "react";
import type { NewTaskInput } from "../types/task";

interface TaskFormProps {
  onCreate: (input: NewTaskInput) => Promise<void>;
}

// Formulario para crear tareas. Maneja sus propios campos y errores;
// quien lo usa solo decide que hacer con la tarea nueva (onCreate).
export default function TaskForm({ onCreate }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("El título no puede estar vacío.");
      return;
    }

    try {
      await onCreate({ title, description });
      setTitle("");
      setDescription("");
    } catch {
      setError("No se pudo crear la tarea. Intentá de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Nueva tarea</h2>
      <div>
        <label htmlFor="title">Título</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Agregar tarea</button>
    </form>
  );
}