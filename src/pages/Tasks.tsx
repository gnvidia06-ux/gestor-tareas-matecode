import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompleted,
} from "../services/taskService";
import type { Task } from "../types/task";

export default function Tasks() {
  const { user, logout } = useAuth();
  const { tasks, loadingTasks } = useTasks();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  // Guarda el id de la tarea que se esta editando actualmente (o null si
  // ninguna tarea esta en modo edicion).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("El título no puede estar vacío.");
      return;
    }
    if (!user) return;

    try {
      await createTask(user.uid, { title, description });
      setTitle("");
      setDescription("");
    } catch {
      setError("No se pudo crear la tarea. Intentá de nuevo.");
    }
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  }

  async function saveEditing(taskId: string) {
    if (!editTitle.trim()) return;
    await updateTask(taskId, {
      title: editTitle,
      description: editDescription,
    });
    cancelEditing();
  }

  async function handleDelete(taskId: string) {
    const confirmar = window.confirm("¿Seguro que querés eliminar esta tarea?");
    if (confirmar) {
      await deleteTask(taskId);
    }
  }

  return (
    <div>
      <header>
        <h1>Mis tareas</h1>
        <p>Sesión iniciada como: {user?.email}</p>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      <form onSubmit={handleCreate}>
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

      <section>
        <h2>Lista de tareas</h2>

        {loadingTasks && <p>Cargando tareas...</p>}

        {!loadingTasks && tasks.length === 0 && (
          <p>Todavía no tenés tareas. ¡Creá la primera arriba!</p>
        )}

        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              {editingId === task.id ? (
                // Modo edicion: muestra inputs en vez de texto
                <div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                  <button onClick={() => saveEditing(task.id)}>Guardar</button>
                  <button onClick={cancelEditing}>Cancelar</button>
                </div>
              ) : (
                // Modo normal: muestra la tarea como texto
                <div>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompleted(task)}
                  />
                  <strong
                    style={{
                      textDecoration: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </strong>
                  <p>{task.description}</p>
                  <button onClick={() => startEditing(task)}>Editar</button>
                  <button onClick={() => handleDelete(task.id)}>
                    Eliminar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}