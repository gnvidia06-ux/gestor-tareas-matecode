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
import type { NewTaskInput } from "../types/task";

export default function Tasks() {
  const { user, logout } = useAuth();
  const { tasks, loadingTasks } = useTasks();

  // Estado del envio del resumen por email.
  const [sendingSummary, setSendingSummary] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState("");

  // El userId lo pone el codigo a partir del usuario logueado,
  // nunca el formulario, tal como exigen las reglas de Firestore.
  async function handleCreate(input: NewTaskInput) {
    if (!user) return;
    await createTask(user.uid, input);
  }

  // Manda el resumen de tareas al email del usuario logueado.
  async function handleSendSummary() {
    if (!user?.email) return;

    setSummaryMessage("");
    setSendingSummary(true);

    try {
      await enviarResumen(
        user.email,
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

        <TaskList
          tasks={tasks}
          loading={loadingTasks}
          onToggle={toggleTaskCompleted}
          onSave={updateTask}
          onDelete={deleteTask}
        />
      </section>
    </div>
  );
}