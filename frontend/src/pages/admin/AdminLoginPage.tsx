import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);

      // Si hay "Recordarme", guardar email
      if (rememberMe) {
        localStorage.setItem('admin_remembered_email', email);
      } else {
        localStorage.removeItem('admin_remembered_email');
      }

      // Redirigir al dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };

  // Cargar email recordado
  useEffect(() => {
    const remembered = localStorage.getItem('admin_remembered_email');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF4757] via-[#2C3E50] to-[#7DC41F] flex items-center justify-center px-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
      </div>

      {/* Contenedor de login */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Logo/Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#FF4757] mb-2">POPÉ</h1>
            <p className="text-gray-600">Panel de Administración</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex gap-2">
                <span className="text-xl">⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Email/Username */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email o Usuario
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pope.com"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF4757] focus:ring-2 focus:ring-[#FF4757]/20 transition disabled:bg-gray-100"
                required
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF4757] focus:ring-2 focus:ring-[#FF4757]/20 transition disabled:bg-gray-100"
                required
              />
            </div>

            {/* Recordarme */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-gray-300 text-[#FF4757] cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                Recordar este email
              </label>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-gradient-to-r from-[#FF4757] to-[#ff6b7a] hover:from-[#ff3a45] hover:to-[#ff5b6a] disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Panel de Administración Popé</p>
            <p>© 2026 Todos los derechos reservados</p>
          </div>
        </div>

        {/* Info de prueba (solo desarrollo) */}
        {import.meta.env.DEV && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-semibold mb-2">🧪 Credenciales de prueba:</p>
            <p>Email: admin@pope.com</p>
            <p>Contraseña: admin123</p>
          </div>
        )}
      </div>
    </div>
  );
}
