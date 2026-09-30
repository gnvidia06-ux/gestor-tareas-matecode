import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
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
      <h1>Crear cuenta</h1>
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
            minLength={6}
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>

      <p>
        ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </div>
  );
}