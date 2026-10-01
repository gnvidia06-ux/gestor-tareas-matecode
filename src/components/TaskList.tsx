import { useState } from "react";
import type { Task } from "../types/task";

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onToggle: (task: Task) => void;
  onSave: (
    taskId: string,
    changes: { title: string; description: string }
  ) => Promise<boolean>;
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
    const guardado = await onSave(taskId, {
      title: editTitle,
      description: editDescription,
    });
    // Si fallo, dejamos la edicion abierta para no perder lo escrito.
    if (guardado) {
      cancelEditing();
    }
  }

  async function handleDelete(taskId: string) {
    const confirmar = window.confirm("¿Seguro que querés eliminar esta tarea?");
    if (confirmar) {
      await onDelete(taskId);
    }
  }

  return (
    <>
      {loading && <p className="empty">Cargando tareas...</p>}

      {!loading && tasks.length === 0 && (
        <p className="empty">
          Todavía no tenés tareas. ¡Creá la primera arriba!
        </p>
      )}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-item">
            {editingId === task.id ? (
              // Modo edicion: muestra inputs en vez de texto
              <div className="task-edit">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <div className="task-actions">
                  <button
                    className="btn-primary"
                    onClick={() => saveEditing(task.id)}
                  >
                    Guardar
                  </button>
                  <button onClick={cancelEditing}>Cancelar</button>
                </div>
              </div>
            ) : (
              // Modo normal: muestra la tarea como texto
              <div>
                <div className="task-main">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggle(task)}
                  />
                  <div className="task-body">
                    <strong
                      className={
                        task.completed ? "task-title done" : "task-title"
                      }
                    >
                      {task.title}
                    </strong>
                    <p className="task-description">{task.description}</p>
                  </div>
                </div>
                <div className="task-actions">
                  <button onClick={() => startEditing(task)}>Editar</button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(task.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}