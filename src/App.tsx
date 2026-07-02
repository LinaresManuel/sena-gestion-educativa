import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Users, Building, Home, LayoutDashboard, MapPin, Calendar, LogOut, Shield, Settings, UserCheck } from "lucide-react";

import RegionalesView from "./components/RegionalesView";
import CentrosView from "./components/CentrosView";
import AmbientesView from "./components/AmbientesView";
import TiposAmbienteView from "./components/TiposAmbienteView";
import ProgramasView from "./components/ProgramasView";
import InstructoresView from "./components/InstructoresView";
import FichasView from "./components/FichasView";
import ProgramacionInstructoresView from "./components/ProgramacionInstructoresView";
import AdminPanel from "./components/AdminPanel";
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import { AuthContext, useHasPermission, useHasAnyPermission, useIsAdmin } from "./lib/auth-context";

interface AuthUser {
  id: number;
  username: string;
  nombre: string;
  rol: string;
  permisos?: string[];
  debeCambiarPassword: boolean;
}

function Dashboard({ user }: { user: AuthUser }) {
  // Hooks para verificar permisos
  const canViewProgramacion = useHasPermission('programacion.ver') || useHasAnyPermission('programacion.crear', 'programacion.editar');
  const canViewInventario = useHasPermission('inventario.ver');
  const canViewNotas = useHasPermission('notas.ver');
  const canViewAsistencia = useHasPermission('asistencia.ver');
  const isAdmin = useIsAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard de Programación</h1>
        <p className="text-gray-500 mt-1">
          Bienvenido, <span className="font-medium">{user.nombre}</span>. Selecciona un módulo para comenzar.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Link to="/regionales" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <MapPin className="w-10 h-10 text-amber-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Regionales</h2>
          <p className="text-sm text-gray-600">Administra las zonas y regionales del país.</p>
        </Link>
        <Link to="/centros" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Building className="w-10 h-10 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Centros de Formación</h2>
          <p className="text-sm text-gray-600">Gestiona los centros y regionales del sistema.</p>
        </Link>
        <Link to="/ambientes" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Home className="w-10 h-10 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ambientes</h2>
          <p className="text-sm text-gray-600">Administra los salones, talleres y demás espacios físicos.</p>
        </Link>
        <Link to="/programas" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <BookOpen className="w-10 h-10 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Programas</h2>
          <p className="text-sm text-gray-600">Gestor de programas de formación y titulaciones.</p>
        </Link>
        <Link to="/instructores" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Users className="w-10 h-10 text-purple-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Instructores</h2>
          <p className="text-sm text-gray-600">Registra instructores y sus perfiles académicos.</p>
        </Link>
        <Link to="/fichas" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <BookOpen className="w-10 h-10 text-emerald-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fichas / Cursos</h2>
          <p className="text-sm text-gray-600">Registra fichas con sus ambientes y horarios asignados.</p>
        </Link>
        {canViewProgramacion && (
          <Link to="/programacion" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
            <Calendar className="w-10 h-10 text-indigo-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Programación</h2>
            <p className="text-sm text-gray-600">Asigna instructores a resultados de aprendizaje.</p>
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
            <Shield className="w-10 h-10 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Administración</h2>
            <p className="text-sm text-gray-600">Gestiona usuarios, roles y permisos del sistema.</p>
          </Link>
        )}
      </div>
    </div>
  );
}

function PrivateLayout({ user, onLogout, children }: { user: AuthUser; onLogout: () => void; children: React.ReactNode }) {
  // Hooks para verificar permisos
  const canViewProgramacion = useHasPermission('programacion.ver') || useHasAnyPermission('programacion.crear', 'programacion.editar');
  const isAdmin = useIsAdmin();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-8">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold tracking-tight">SenaSchedule</span>
          </div>
          <nav className="space-y-1">
            <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <LayoutDashboard className="w-5 h-5 text-gray-500" /> Dashboard
            </Link>
            <Link to="/regionales" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <MapPin className="w-5 h-5 text-gray-500" /> Regionales
            </Link>
            <Link to="/centros" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <Building className="w-5 h-5 text-gray-500" /> Centros
            </Link>
            <Link to="/ambientes" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <Home className="w-5 h-5 text-gray-500" /> Ambientes
            </Link>
            <Link to="/tipos-ambiente" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <Home className="w-5 h-5 text-gray-400 ml-1" /> Tipos de Ambientes
            </Link>
            <Link to="/programas" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <BookOpen className="w-5 h-5 text-gray-500" /> Programas
            </Link>
            <Link to="/instructores" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <Users className="w-5 h-5 text-gray-500" /> Instructores
            </Link>
            <Link to="/fichas" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <BookOpen className="w-5 h-5 text-emerald-600" /> Fichas
            </Link>
            {canViewProgramacion && (
              <Link to="/programacion" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <Calendar className="w-5 h-5 text-indigo-500" /> Programación
              </Link>
            )}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 my-3"></div>
                <Link to="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                  <Shield className="w-5 h-5 text-red-500" /> Administración
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="p-6 border-t">
          <div className="text-sm mb-3">
            <div className="font-medium text-gray-900">{user.nombre}</div>
            <div className="text-gray-500 text-xs">{user.username} · {user.rol}</div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 py-2 rounded-md transition"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}

function RequireAuth({ user, children }: { user: AuthUser | null; children: React.ReactNode }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

function RequireRole({ user, roles, children }: { user: AuthUser | null; roles: string[]; children: React.ReactNode }) {
  if (!user || !roles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function RequirePermission({ user, permission, children }: { user: AuthUser | null; permission: string; children: React.ReactNode }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // Admin siempre tiene permisos
  if (user.rol === 'admin') {
    return <>{children}</>;
  }
  // Verificar permiso específico
  if (!user.permisos?.includes(permission)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes({ user, setUser, onLogout }: { user: AuthUser | null; setUser: (u: AuthUser | null) => void; onLogout: () => void }) {
  const navigate = useNavigate();

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      .finally(() => {
        onLogout();
        navigate("/login", { replace: true });
      });
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AuthContext.Provider value={user}>
      <PrivateLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/regionales" element={<RegionalesView />} />
          <Route path="/centros" element={<CentrosView />} />
          <Route path="/ambientes" element={<AmbientesView />} />
          <Route path="/tipos-ambiente" element={<TiposAmbienteView />} />
          <Route path="/programas" element={<ProgramasView />} />
          <Route path="/instructores" element={<InstructoresView />} />
          <Route path="/fichas" element={<FichasView />} />
          <Route path="/programacion" element={
            <RequirePermission user={user} permission="programacion.ver">
              <ProgramacionInstructoresView />
            </RequirePermission>
          } />
          <Route path="/admin" element={
            <RequirePermission user={user} permission="admin.ver">
              <AdminPanel />
            </RequirePermission>
          } />
          <Route path="/cambiar-password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PrivateLayout>
    </AuthContext.Provider>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setUser(data);
        }
      })
      .catch(() => {})
      .finally(() => setBootstrapping(false));
  }, []);

  function handleLogout() {
    setUser(null);
  }

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} setUser={setUser} onLogout={handleLogout} />
    </BrowserRouter>
  );
}
