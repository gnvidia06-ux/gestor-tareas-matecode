import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../hooks/useAuth";

// Reemplazamos useAuth por una version falsa para controlar
// si hay sesion o no, sin conectarnos a Firebase.
vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function mockAuth(value: { user: unknown; loading: boolean }) {
  mockedUseAuth.mockReturnValue(
    value as unknown as ReturnType<typeof useAuth>
  );
}

// Arma una mini app con una ruta protegida y una pantalla de login,
// para ver a cual de las dos termina llegando el usuario.
function renderRutaProtegida() {
  return render(
    <MemoryRouter initialEntries={["/tasks"]}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <p>Contenido privado</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra 'Cargando...' mientras se revisa la sesion", () => {
    mockAuth({ user: null, loading: true });

    renderRutaProtegida();

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
  });

  it("redirige a /login si no hay usuario", () => {
    mockAuth({ user: null, loading: false });

    renderRutaProtegida();

    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("muestra el contenido si hay usuario", () => {
    mockAuth({ user: { uid: "abc123", email: "test@tst.com" }, loading: false });

    renderRutaProtegida();

    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
  });
});