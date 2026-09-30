import { useState } from "react";
import type { Task } from "../types/task";

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onToggle: (task: Task) => void;
  onSave: (
    taskId: string,
    changes: { title: string; description: string }
  ) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

// Lista de tareas. Se encarga de mostrar cada tarea y del modo edicion;
// las acciones reales (guardar, borrar, completar) las recibe por props.
export default function TaskList({
  tasks,
  loading,
  onToggle,
  onSave,
  onDelete,
}: TaskListProps) {
  // Guarda el id de la tarea que se esta editando actualmente (o null si
  // ninguna tarea esta en modo edicion).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

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
    await onSave(taskId, { title: editTitle, description: editDescription });
    cancelEditing();
  }

  async function handleDelete(taskId: string) {
    const confirmar = window.confirm("¿Seguro que querés eliminar esta tarea?");
    if (confirmar) {
      await onDelete(taskId);
    }
  }

  return (
    <>
      {loading && <p>Cargando tareas...</p>}

      {!loading && tasks.length === 0 && (
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
                  onChange={() => onToggle(task)}
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
                <button onClick={() => handleDelete(task.id)}>Eliminar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}