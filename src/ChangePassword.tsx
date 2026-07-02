import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFirstChange, setIsFirstChange] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.debeCambiarPassword) {
          setIsFirstChange(true);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (next.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (next !== confirm) {
      setError("La confirmación no coincide");
      return;
    }

    setLoading(true);
    try {
      const body: any = { newPassword: next };
      if (!isFirstChange) {
        body.currentPassword = current;
      }

      const resp = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error ?? "Error al cambiar la contraseña");
        return;
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError("No se pudo conectar con el servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-8 space-y-5">
        <div className="flex items-center gap-3">
          <KeyRound className="w-7 h-7 text-amber-600" />
          <h1 className="text-xl font-semibold text-gray-900">Cambiar contraseña</h1>
        </div>

        <p className="text-sm text-gray-600">
          {isFirstChange
            ? "Tu contraseña temporal ha expirado. Crea una nueva contraseña para continuar."
            : "Por seguridad, cambia la contraseña antes de continuar."
          }
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!isFirstChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}
