import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import { db } from "./firebase";
import type { Task, NewTaskInput } from "../types/task";

const tasksCollection = collection(db, "tasks");

// Crea una tarea nueva. userId lo pasa el codigo (a partir del usuario
// logueado), nunca el formulario, tal como exigen las reglas de Firestore.
export async function createTask(userId: string, input: NewTaskInput) {
  await addDoc(tasksCollection, {
    userId,
    title: input.title,
    description: input.description,
    completed: false,
    createdAt: Date.now(),
  });
}

// Se suscribe a las tareas del usuario y llama a callback cada vez que
// algo cambia (crear, editar, borrar), sin necesidad de recargar la pagina.
// Devuelve una funcion para cancelar la suscripcion (unsubscribe).
export function subscribeToTasks(
  userId: string,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const q = query(
    tasksCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Task, "id">),
    }));
    callback(tasks);
  });
}

export async function updateTask(taskId: string, changes: Partial<Task>) {
  const taskRef = doc(db, "tasks", taskId);
  await updateDoc(taskRef, changes);
}

export async function deleteTask(taskId: string) {
  const taskRef = doc(db, "tasks", taskId);
  await deleteDoc(taskRef);
}

export async function toggleTaskCompleted(task: Task) {
  await updateTask(task.id, { completed: !task.completed });
}