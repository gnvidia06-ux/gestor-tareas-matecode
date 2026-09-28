// Representa una tarea tal como se guarda en Firestore.
export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
}

// Datos que el formulario envía al crear una tarea nueva.
// No incluye id (lo genera Firestore) ni userId (lo agrega el codigo,
// no el usuario, por seguridad) ni createdAt (se genera automaticamente).
export interface NewTaskInput {
  title: string;
  description: string;
}