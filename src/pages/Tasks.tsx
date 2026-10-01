import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompleted,
} from "../services/taskService";
import { enviarResumen } from "../services/summaryService";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import type { NewTaskInput, Task } from "../types/task";

export default function Tasks() {
  const { user, logout } = useAuth();
  const { tasks, loadingTasks, error: loadError } = useTasks();

  // Estado del envio del resumen por email.
  const [sendingSummary, setSendingSummary] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState("");

  // Mensaje de error de las acciones sobre tareas (editar, borrar, completar).
  const [actionError, setActionError] = useState("");

  // El userId lo pone el codigo a partir del usuario logueado,
  // nunca el formulario, tal como exigen las reglas de Firestore.
  async function handleCreate(input: NewTaskInput) {
    if (!user) return;
    await createTask(user.uid, input);
  }

  // Devuelve true si se guardo, para que la lista sepa si cerrar la edicion.
  async function handleSave(
    taskId: string,
    changes: { title: string; description: string }
  ): Promise<boolean> {
    setActionError("");
    try {
      await updateTask(taskId, changes);
      return true;
    } catch {
      setActionError("No se pudo guardar la tarea. Intentá de nuevo.");
      return false;
    }
  }

  async function handleDelete(taskId: string) {
    setActionError("");
    try {
      await deleteTask(taskId);
    } catch {
      setActionError("No se pudo eliminar la tarea. Intentá de nuevo.");
    }
  }

  async function handleToggle(task: Task) {
    setActionError("");
    try {
      await toggleTaskCompleted(task);
    } catch {
      setActionError("No se pudo actualizar la tarea. Intentá de nuevo.");
    }
  }

  // Manda el resumen de tareas al email del usuario logueado.
  async function handleSendSummary() {
    if (!user?.email) return;

    setSummaryMessage("");
    setSendingSummary(true);

    try {
      await enviarResumen(
        tasks.map((t) => ({ title: t.title, completed: t.completed }))
      );
      setSummaryMessage(`Resumen enviado a ${user.email}.`);
    } catch {
      setSummaryMessage("No se pudo enviar el resumen. Intentá de nuevo.");
    } finally {
      setSendingSummary(false);
    }
  }

  return (
    <div>
      <header className="app-header">
        <div>
          <h1>Mis tareas</h1>
          <p>Sesión iniciada como: {user?.email}</p>
        </div>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      <TaskForm onCreate={handleCreate} />

      <section>
        <div className="section-head">
          <h2>Lista de tareas</h2>
          <button
            className="btn-primary"
            onClick={handleSendSummary}
            disabled={sendingSummary || tasks.length === 0}
          >
            {sendingSummary ? "Enviando..." : "Enviar resumen por email"}
          </button>
        </div>

        {summaryMessage && <p role="status">{summaryMessage}</p>}
        {loadError && <p role="alert">{loadError}</p>}
        {actionError && <p role="alert">{actionError}</p>}

        <TaskList
          tasks={tasks}
          loading={loadingTasks}
          onToggle={handleToggle}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}