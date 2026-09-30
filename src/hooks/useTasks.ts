import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { subscribeToTasks } from "../services/taskService";
import type { Task } from "../types/task";

// Lista vacia compartida, para no crear un array nuevo en cada render.
const SIN_TAREAS: Task[] = [];

export function useTasks() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Guardamos las tareas junto con el uid del usuario al que pertenecen.
  // Asi sabemos si lo que tenemos guardado corresponde al usuario actual.
  const [datos, setDatos] = useState<{ uid: string; tasks: Task[] } | null>(
    null
  );

  useEffect(() => {
    // Si por alguna razon no hay usuario, no nos suscribimos a nada.
    if (!uid) return;

    const unsubscribe = subscribeToTasks(uid, (nuevasTareas) => {
      setDatos({ uid, tasks: nuevasTareas });
    });

    // Cancela la suscripcion cuando el componente se desmonta
    // o cuando cambia el usuario, para evitar memory leaks.
    return () => unsubscribe();
  }, [uid]);

  // Las tareas son las guardadas solo si son del usuario actual.
  const tasks = uid && datos?.uid === uid ? datos.tasks : SIN_TAREAS;

  // Carga mientras haya usuario y todavia no hayan llegado sus tareas.
  const loadingTasks = uid ? datos?.uid !== uid : false;

  return { tasks, loadingTasks };
}