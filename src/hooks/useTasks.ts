import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { subscribeToTasks } from "../services/taskService";
import type { Task } from "../types/task";

// Lista vacia compartida, para no crear un array nuevo en cada render.
const SIN_TAREAS: Task[] = [];

export function useTasks() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Guardamos las tareas (o el error) junto con el uid del usuario al que
  // pertenecen. Asi sabemos si lo guardado corresponde al usuario actual.
  const [datos, setDatos] = useState<{
    uid: string;
    tasks: Task[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    // Si por alguna razon no hay usuario, no nos suscribimos a nada.
    if (!uid) return;

    const unsubscribe = subscribeToTasks(
      uid,
      (nuevasTareas) => {
        setDatos({ uid, tasks: nuevasTareas, error: null });
      },
      () => {
        setDatos({
          uid,
          tasks: [],
          error:
            "No se pudieron cargar tus tareas. Revisá tu conexión e intentá de nuevo.",
        });
      }
    );

    // Cancela la suscripcion cuando el componente se desmonta
    // o cuando cambia el usuario, para evitar memory leaks.
    return () => unsubscribe();
  }, [uid]);

  // Lo guardado solo vale si es del usuario actual.
  const actual = uid && datos?.uid === uid ? datos : null;

  const tasks = actual ? actual.tasks : SIN_TAREAS;

  // Carga mientras haya usuario y todavia no haya llegado nada (ni tareas ni error).
  const loadingTasks = uid ? actual === null : false;

  const error = actual?.error ?? null;

  return { tasks, loadingTasks, error };
}