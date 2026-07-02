import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { Shield, Users, Key, BarChart3, Plus, Trash2, Save, RefreshCw } from 'lucide-react';

interface Permiso {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
  accion: string;
}

interface Role {
  rol: string;
  permisos: { codigo: string; nombre: string }[];
  totalPermisos: number;
}

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  activo: boolean;
  roles: string[];
}

export default function AdminPanel() {
  const user = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'roles' | 'usuarios'>('stats');
  const [roles, setRoles] = useState<Role[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePermisos, setRolePermisos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [rolesRes, usuariosRes, permisosRes] = await Promise.all([
        fetch('/api/admin/roles', { credentials: 'include' }),
        fetch('/api/admin/usuarios', { credentials: 'include' }),
        fetch('/api/admin/permisos', { credentials: 'include' }),
      ]);

      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (usuariosRes.ok) setUsuarios(await usuariosRes.json());
      if (permisosRes.ok) setPermisos(await permisosRes.json());
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRolePermisos(rol: string) {
    setSelectedRole(rol);
    try {
      const res = await fetch(`/api/admin/roles/${rol}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRolePermisos(data.permisos.map((p: any) => p.codigo));
      }
    } catch (error) {
      console.error('Error loading role permisos:', error);
    }
  }

  async function saveRolePermisos() {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole}/permisos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permisos: rolePermisos }),
      });

      if (res.ok) {
        await loadData();
        alert('Permisos guardados correctamente');
      }
    } catch (error) {
      console.error('Error saving role permisos:', error);
    } finally {
      setSaving(false);
    }
  }

  function togglePermiso(codigo: string) {
    setRolePermisos(prev => 
      prev.includes(codigo) 
        ? prev.filter(p => p !== codigo)
        : [...prev, codigo]
    );
  }

  function selectAllPermisos() {
    setRolePermisos(permisos.map(p => p.codigo));
  }

  function clearAllPermisos() {
    setRolePermisos([]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Administración</h1>
        <p className="text-gray-500 mt-1">
          Gestiona usuarios, roles y permisos del sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Roles y Permisos
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'usuarios'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Usuarios
          </button>
        </nav>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="w-10 h-10 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-semibold text-gray-900">{usuarios.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Shield className="w-10 h-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Roles</p>
                <p className="text-2xl font-semibold text-gray-900">{roles.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Key className="w-10 h-10 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Permisos</p>
                <p className="text-2xl font-semibold text-gray-900">{permisos.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de roles */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Roles</h3>
            <div className="space-y-2">
              {roles.map(role => (
                <div
                  key={role.rol}
                  onClick={() => loadRolePermisos(role.rol)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedRole === role.rol
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{role.rol}</span>
                    <span className="text-sm text-gray-500">{role.totalPermisos} permisos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permisos del rol seleccionado */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            {selectedRole ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Permisos de: {selectedRole}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllPermisos}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Seleccionar todos
                    </button>
                    <button
                      onClick={clearAllPermisos}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={saveRolePermisos}
                      disabled={saving}
                      className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 inline mr-1" />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {['inicio', 'programacion', 'comunicacion', 'inventario', 'cursos', 'salones', 'notas', 'asistencia'].map(modulo => {
                    const permisosModulo = permisos.filter(p => p.modulo === modulo);
                    if (permisosModulo.length === 0) return null;
                    
                    return (
                      <div key={modulo} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 capitalize">{modulo}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {permisosModulo.map(permiso => (
                            <label
                              key={permiso.codigo}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={rolePermisos.includes(permiso.codigo)}
                                onChange={() => togglePermiso(permiso.codigo)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>{permiso.nombre}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Selecciona un rol para ver sus permisos
              </div>
            )}
          </div>
        </div>
      )}

      {/* Usuarios Tab */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{usuario.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{usuario.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {usuario.roles.map(rol => (
                        <span
                          key={rol}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {rol}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        usuario.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
