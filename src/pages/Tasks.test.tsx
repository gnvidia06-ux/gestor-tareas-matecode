import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Tasks from "./Tasks";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import { createTask, deleteTask } from "../services/taskService";
import { enviarResumen } from "../services/summaryService";

// Reemplazamos todo lo que toca Firebase o AWS por versiones falsas,
// para probar solo la pantalla.
vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../hooks/useTasks", () => ({ useTasks: vi.fn() }));
vi.mock("../services/taskService", () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  toggleTaskCompleted: vi.fn(),
}));
vi.mock("../services/summaryService", () => ({ enviarResumen: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseTasks = vi.mocked(useTasks);
const mockedCreateTask = vi.mocked(createTask);
const mockedDeleteTask = vi.mocked(deleteTask);
const mockedEnviarResumen = vi.mocked(enviarResumen);

const tareasDePrueba = [
  {
    id: "t1",
    userId: "abc123",
    title: "Comprar pan",
    description: "En la panadería",
    completed: false,
    createdAt: 1,
  },
  {
    id: "t2",
    userId: "abc123",
    title: "Pagar la luz",
    description: "Vence el viernes",
    completed: true,
    createdAt: 2,
  },
];

function mockTasks(tasks: typeof tareasDePrueba, loadingTasks = false) {
  mockedUseTasks.mockReturnValue({
    tasks,
    loadingTasks,
  } as unknown as ReturnType<typeof useTasks>);
}

describe("Tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { uid: "abc123", email: "test@tst.com" },
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    mockTasks(tareasDePrueba);
    mockedCreateTask.mockResolvedValue(undefined);
    mockedEnviarResumen.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra el email del usuario y sus tareas", () => {
    render(<Tasks />);

    expect(screen.getByText(/test@tst.com/)).toBeInTheDocument();
    expect(screen.getByText("Comprar pan")).toBeInTheDocument();
    expect(screen.getByText("Pagar la luz")).toBeInTheDocument();
  });

  it("avisa cuando todavía no hay tareas", () => {
    mockTasks([]);

    render(<Tasks />);

    expect(screen.getByText(/Todavía no tenés tareas/)).toBeInTheDocument();
  });

  it("muestra un error si el título está vacío y no crea la tarea", async () => {
    const user = userEvent.setup();
    render(<Tasks />);

    await user.click(screen.getByRole("button", { name: "Agregar tarea" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El título no puede estar vacío."
    );
    expect(mockedCreateTask).not.toHaveBeenCalled();
  });

  it("crea la tarea con los datos del formulario y limpia los campos", async () => {
    const user = userEvent.setup();
    render(<Tasks />);

    await user.type(screen.getByLabelText("Título"), "Estudiar Vitest");
    await user.type(screen.getByLabelText("Descripción"), "Tests del PI4");
    await user.click(screen.getByRole("button", { name: "Agregar tarea" }));

    expect(mockedCreateTask).toHaveBeenCalledWith("abc123", {
      title: "Estudiar Vitest",
      description: "Tests del PI4",
    });
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
  });

  it("elimina una tarea cuando el usuario confirma", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Tasks />);

    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);

    expect(mockedDeleteTask).toHaveBeenCalledWith("t1");
  });

  it("no elimina la tarea si el usuario cancela", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Tasks />);

    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);

    expect(mockedDeleteTask).not.toHaveBeenCalled();
  });

  it("deshabilita el botón de resumen si no hay tareas", () => {
    mockTasks([]);

    render(<Tasks />);

    expect(
      screen.getByRole("button", { name: "Enviar resumen por email" })
    ).toBeDisabled();
  });

  it("envía el resumen y muestra confirmación con el email del usuario", async () => {
    const user = userEvent.setup();
    render(<Tasks />);

    await user.click(
      screen.getByRole("button", { name: "Enviar resumen por email" })
    );

    // El email ya no viaja desde el frontend: la funcion lo saca del token.
    expect(mockedEnviarResumen).toHaveBeenCalledWith([
      { title: "Comprar pan", completed: false },
      { title: "Pagar la luz", completed: true },
    ]);
    expect(
      await screen.findByText("Resumen enviado a test@tst.com.")
    ).toBeInTheDocument();
  });

  it("muestra un error si falla el envío del resumen", async () => {
    const user = userEvent.setup();
    mockedEnviarResumen.mockRejectedValue(new Error("falló"));
    render(<Tasks />);

    await user.click(
      screen.getByRole("button", { name: "Enviar resumen por email" })
    );

    expect(
      await screen.findByText("No se pudo enviar el resumen. Intentá de nuevo.")
    ).toBeInTheDocument();
  });
});