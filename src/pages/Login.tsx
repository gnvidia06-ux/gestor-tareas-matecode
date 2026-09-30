import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/tasks");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado. Intentá de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p>
        ¿No tenés cuenta? <Link to="/register">Registrate</Link>
      </p>
    </div>
  );
}