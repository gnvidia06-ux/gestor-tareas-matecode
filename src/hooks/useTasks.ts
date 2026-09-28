import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { subscribeToTasks } from "../services/taskService";
import type { Task } from "../types/task";

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    // Si por alguna razon no hay usuario, no nos suscribimos a nada.
    if (!user) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    const unsubscribe = subscribeToTasks(user.uid, (nuevasTareas) => {
      setTasks(nuevasTareas);
      setLoadingTasks(false);
    });

    // Cancela la suscripcion cuando el componente se desmonta
    // o cuando cambia el usuario, para evitar memory leaks.
    return () => unsubscribe();
  }, [user]);

  return { tasks, loadingTasks };
}