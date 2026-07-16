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
import PerfilesAcademicosView from "./components/PerfilesAcademicosView";
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
  const canViewRegionales = useHasPermission('regionales.ver');
  const canViewCentros = useHasPermission('centros.ver');
  const canViewAmbientes = useHasPermission('ambientes.ver');
  const canViewTiposAmbiente = useHasPermission('tipos_ambiente.ver');
  const canViewInstructores = useHasPermission('instructores.ver');
  const canViewPerfilesAcademicos = useHasPermission('perfiles_academicos.ver');
  const canViewProgramas = useHasPermission('programas.ver');
  const canViewFichas = useHasPermission('fichas.ver');
  const canViewProgramacion = useHasPermission('programacion.ver');
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
        {canViewRegionales && (
        <Link to="/regionales" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <MapPin className="w-10 h-10 text-amber-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Regionales</h2>
          <p className="text-sm text-gray-600">Administra las zonas y regionales del país.</p>
        </Link>)}
        {canViewCentros && (
        <Link to="/centros" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Building className="w-10 h-10 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Centros de Formación</h2>
          <p className="text-sm text-gray-600">Gestiona los centros y regionales del sistema.</p>
        </Link>)}
        {canViewAmbientes && (
        <Link to="/ambientes" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Home className="w-10 h-10 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ambientes</h2>
          <p className="text-sm text-gray-600">Administra los salones, talleres y demás espacios físicos.</p>
        </Link>)}
        {canViewTiposAmbiente && (
        <Link to="/tipos-ambiente" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Home className="w-10 h-10 text-teal-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tipos de Ambientes</h2>
          <p className="text-sm text-gray-600">Gestiona las clasificaciones de ambientes.</p>
        </Link>)}
        {canViewInstructores && (
        <Link to="/instructores" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Users className="w-10 h-10 text-purple-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Instructores</h2>
          <p className="text-sm text-gray-600">Registra instructores y sus perfiles académicos.</p>
        </Link>)}
        {canViewPerfilesAcademicos && (
        <Link to="/perfiles-academicos" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Users className="w-10 h-10 text-purple-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Perfiles Académicos</h2>
          <p className="text-sm text-gray-600">Gestiona los perfiles académicos del sistema.</p>
        </Link>)}
        {canViewProgramas && (
        <Link to="/programas" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <BookOpen className="w-10 h-10 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Programas</h2>
          <p className="text-sm text-gray-600">Gestor de programas de formación y titulaciones.</p>
        </Link>)}
        {canViewFichas && (
        <Link to="/fichas" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <BookOpen className="w-10 h-10 text-emerald-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fichas / Cursos</h2>
          <p className="text-sm text-gray-600">Registra fichas con sus ambientes y horarios asignados.</p>
        </Link>)}
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
  const canViewProgramacion = useHasPermission('programacion.ver');
  const canViewRegionales = useHasPermission('regionales.ver');
  const canViewCentros = useHasPermission('centros.ver');
  const canViewAmbientes = useHasPermission('ambientes.ver');
  const canViewTiposAmbiente = useHasPermission('tipos_ambiente.ver');
  const canViewProgramas = useHasPermission('programas.ver');
  const canViewInstructores = useHasPermission('instructores.ver');
  const canViewFichas = useHasPermission('fichas.ver');
  const canViewPerfilesAcademicos = useHasPermission('perfiles_academicos.ver');
  const isAdmin = useIsAdmin();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <BookOpen className="w-7 h-7 text-blue-600" />
          <span className="text-lg font-bold tracking-tight">SenaSchedule</span>
        </div>
        <nav className="flex-1 flex flex-col justify-evenly px-3 overflow-y-auto">
          <Link to="/" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
            <LayoutDashboard className="w-5 h-5 text-gray-500" /> Dashboard
          </Link>
          {canViewRegionales && (
          <Link to="/regionales" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
            <MapPin className="w-5 h-5 text-gray-500" /> Regionales
          </Link>)}
          {canViewCentros && (
          <Link to="/centros" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
            <Building className="w-5 h-5 text-gray-500" /> Centros
          </Link>)}
          {canViewAmbientes && (
          <Link to="/ambientes" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
            <Home className="w-5 h-5 text-gray-500" /> Ambientes
          </Link>)}
          {canViewTiposAmbiente && (
          <Link to="/tipos-ambiente" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
            <Home className="w-5 h-5 text-gray-400 ml-1" /> Tipos de Ambientes
          </Link>)}
          {canViewInstructores && (
          <Link to="/instructores" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
            <Users className="w-5 h-5 text-gray-500" /> Instructores
          </Link>)}
          {canViewPerfilesAcademicos && (
            <Link to="/perfiles-academicos" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <Users className="w-5 h-5 text-purple-500" /> Perfiles Académicos
            </Link>
          )}
          {canViewProgramas && (
          <Link to="/programas" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
            <BookOpen className="w-5 h-5 text-gray-500" /> Programas
          </Link>)}
          {canViewFichas && (
          <Link to="/fichas" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
            <BookOpen className="w-5 h-5 text-emerald-600" /> Fichas
          </Link>)}
          {canViewProgramacion && (
            <Link to="/programacion" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
              <Calendar className="w-5 h-5 text-indigo-500" /> Programación
            </Link>
          )}
          {isAdmin && (
            <>
              <div className="border-t border-gray-200"></div>
              <Link to="/admin" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <Shield className="w-5 h-5 text-red-500" /> Administración
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t">
          <div className="text-sm mb-2">
            <div className="font-medium text-gray-900">{user.nombre}</div>
            <div className="text-gray-500 text-xs">{user.username} · {user.rol}</div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 py-1.5 rounded-md transition"
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

function AppRoutes({ user, setUser, onLogout, permisoNotification, setPermisoNotification }: {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  onLogout: () => void;
  permisoNotification: boolean;
  setPermisoNotification: (v: boolean) => void;
}) {
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

  if (user.debeCambiarPassword) {
    return (
      <Routes>
        <Route path="/cambiar-password" element={<ChangePassword setUser={setUser} />} />
        <Route path="*" element={<Navigate to="/cambiar-password" replace />} />
      </Routes>
    );
  }

  return (
    <AuthContext.Provider value={user}>
      {permisoNotification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-xl max-w-sm">
          <p className="font-medium">Permisos actualizados</p>
          <p className="text-sm mt-1">Tus permisos han cambiado. Recarga la pagina para aplicar los cambios.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => window.location.reload()}
              className="bg-white text-blue-600 px-4 py-1 rounded-lg text-sm font-medium">
              Recargar ahora
            </button>
            <button onClick={() => setPermisoNotification(false)}
              className="bg-blue-500 text-white px-4 py-1 rounded-lg text-sm">
              Despues
            </button>
          </div>
        </div>
      )}
      <PrivateLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/regionales" element={<RegionalesView />} />
          <Route path="/centros" element={<CentrosView />} />
          <Route path="/ambientes" element={<AmbientesView />} />
          <Route path="/tipos-ambiente" element={<TiposAmbienteView />} />
          <Route path="/programas" element={
            <RequirePermission user={user} permission="programas.ver">
              <ProgramasView />
            </RequirePermission>
          } />
          <Route path="/instructores" element={<InstructoresView />} />
          <Route path="/fichas" element={<FichasView />} />
          <Route path="/perfiles-academicos" element={
            <RequirePermission user={user} permission="perfiles_academicos.ver">
              <PerfilesAcademicosView />
            </RequirePermission>
          } />
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
          <Route path="/cambiar-password" element={<ChangePassword setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PrivateLayout>
    </AuthContext.Provider>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [permisoNotification, setPermisoNotification] = useState(false);

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

  // SSE para notificaciones en tiempo real de cambios de permisos
  useEffect(() => {
    if (!user) return;
    const evtSource = new EventSource('/api/auth/sse');
    evtSource.addEventListener('permisos-cambiaron', async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        setUser(data);
        setPermisoNotification(true);
      } catch {}
    });
    return () => evtSource.close();
  }, [user?.id]);

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
      <AppRoutes user={user} setUser={setUser} onLogout={handleLogout}
        permisoNotification={permisoNotification} setPermisoNotification={setPermisoNotification} />
    </BrowserRouter>
  );
}
