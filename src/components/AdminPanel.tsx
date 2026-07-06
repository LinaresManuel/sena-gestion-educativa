import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { Shield, Users, Key, BarChart3, Plus, Trash2, Pencil, Copy, RefreshCw, X } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

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
  debeCambiarPassword: boolean;
  ultimoLoginAt: string | null;
}

function UserFormModal({
  isOpen,
  onClose,
  onSave,
  usuario,
  rolesDisponibles,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<any>;
  usuario?: Usuario | null;
  rolesDisponibles: Role[];
}) {
  const [username, setUsername] = useState('');
  const [nombre, setNombre] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const isEdit = !!usuario;

  useEffect(() => {
    if (usuario) {
      setUsername(usuario.username);
      setNombre(usuario.nombre);
      setRoles(usuario.roles);
      setActivo(usuario.activo);
    } else {
      setUsername('');
      setNombre('');
      setRoles([]);
      setActivo(true);
    }
  }, [usuario, isOpen]);

  if (!isOpen) return null;

  function toggleRole(rol: string) {
    setRoles(prev => prev.includes(rol) ? prev.filter(r => r !== rol) : [...prev, rol]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await onSave({ nombre, activo, roles });
      } else {
        await onSave({ username, nombre, roles });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" required minLength={3} />
            </div>
          )}
          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Contraseña auto-generada:</strong> Se creará una contraseña temporal que el usuario deberá cambiar en su primer inicio de sesión.
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
            <div className="flex flex-wrap gap-2">
              {rolesDisponibles.map(role => (
                <button key={role.rol} type="button" onClick={() => toggleRole(role.rol)}
                  className={`px-3 py-1 text-sm rounded-full border transition ${
                    roles.includes(role.rol) ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}>
                  {role.rol}
                </button>
              ))}
            </div>
            {roles.length === 0 && <p className="text-xs text-red-500 mt-1">Selecciona al menos un rol</p>}
          </div>
          {isEdit && (
            <div className="flex items-center">
              <input type="checkbox" id="activo" checked={activo} onChange={e => setActivo(e.target.checked)}
                className="rounded border-gray-300 text-blue-600" />
              <label htmlFor="activo" className="ml-2 text-sm text-gray-700">Activo</label>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving || roles.length === 0}
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleFormModal({
  isOpen,
  onClose,
  onSave,
  permisos,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  permisos: Permiso[];
}) {
  const [nombre, setNombre] = useState('');
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setNombre('');
      setSelectedPermisos([]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function togglePermiso(codigo: string) {
    setSelectedPermisos(prev => prev.includes(codigo) ? prev.filter(p => p !== codigo) : [...prev, codigo]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ nombre, permisos: selectedPermisos });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear el rol');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Nuevo Rol</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del rol</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" required minLength={2}
              placeholder="ej: coordinador" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permisos</label>
            <div className="space-y-3">
              {[...new Set(permisos.map(p => p.modulo))].map(modulo => {
                const permisosModulo = permisos.filter(p => p.modulo === modulo);
                return (
                  <div key={modulo} className="border rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2 capitalize text-sm">{modulo}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {permisosModulo.map(permiso => (
                        <label key={permiso.codigo} className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" checked={selectedPermisos.includes(permiso.codigo)}
                            onChange={() => togglePermiso(permiso.codigo)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span>{permiso.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving || !nombre.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50">
              {saving ? 'Creando...' : 'Crear Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordDisplayModal({
  isOpen,
  onClose,
  username,
  password,
}: {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  password: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  function copyToClipboard() {
    const textarea = document.createElement('textarea');
    textarea.value = password;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('No se pudo copiar la contraseña. Cópiala manualmente.');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Contraseña generada</h3>
        <p className="text-sm text-gray-500 mb-4">
          Contraseña temporal para <strong>{username}</strong>. Esta contraseña solo se muestra una vez.
        </p>
        <div className="bg-gray-50 border rounded-lg p-3 flex items-center justify-between mb-4">
          <code className="text-sm font-mono select-all">{password}</code>
          <button onClick={copyToClipboard} className="ml-2 p-1 text-gray-500 hover:text-blue-600" title="Copiar">
            <Copy className="w-4 h-4" />
          </button>
        </div>
        {copied && <p className="text-xs text-green-600 mb-2">Copiado al portapapeles</p>}
        <p className="text-xs text-amber-600 mb-4">
          El usuario deberá cambiar esta contraseña en el próximo inicio de sesión.
        </p>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg">Cerrar</button>
        </div>
      </div>
    </div>
  );
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

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [resetUsername, setResetUsername] = useState('');

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showDeleteRoleConfirm, setShowDeleteRoleConfirm] = useState(false);
  const [deletingRole, setDeletingRole] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resettingUser, setResettingUser] = useState<Usuario | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  useEffect(() => { loadData(); }, []);

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
      if (res.ok) { await loadData(); setToast('Permisos del rol guardados. Los usuarios afectados verán los cambios al recargar la pagina.'); }
    } catch (error) {
      console.error('Error saving role permisos:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveUser(data: any) {
    if (editingUser) {
      const res = await fetch(`/api/admin/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
    } else {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const result = await res.json();
      setGeneratedPassword(result.temporaryPassword);
      setResetUsername(result.username);
      setShowPasswordModal(true);
    }
    await loadData();
    if (editingUser) setToast('Roles del usuario actualizados. El usuario verá los cambios al recargar la pagina.');
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${deletingUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await loadData();
        setShowDeleteConfirm(false);
        setDeletingUser(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!resettingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${resettingUser.id}/reset-password`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPassword(data.temporaryPassword);
        setResetUsername(resettingUser.username);
        setShowPasswordModal(true);
        setShowResetConfirm(false);
        setResettingUser(null);
        await loadData();
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRole(data: any) {
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await loadData();
    setToast('Rol creado. Los usuarios con este rol veran los cambios al recargar la pagina.');
  }

  async function handleDeleteRole() {
    if (!deletingRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${deletingRole}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await loadData();
        setShowDeleteRoleConfirm(false);
        setDeletingRole(null);
        if (selectedRole === deletingRole) {
          setSelectedRole(null);
          setRolePermisos([]);
        }
        alert(`Rol "${deletingRole}" eliminado correctamente`);
      } else {
        const err = await res.json();
        alert(err.error || 'Error al eliminar el rol');
      }
    } catch (error: any) {
      alert('Error al eliminar el rol: ' + (error.message || 'Error de red'));
    } finally {
      setSaving(false);
    }
  }

  function togglePermiso(codigo: string) {
    setRolePermisos(prev => prev.includes(codigo) ? prev.filter(p => p !== codigo) : [...prev, codigo]);
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
      {toast && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-blue-500 hover:text-blue-700"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Administración</h1>
        <p className="text-gray-500 mt-1">Gestiona usuarios, roles y permisos del sistema.</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'stats' as const, icon: BarChart3, label: 'Estadísticas' },
            { key: 'roles' as const, icon: Shield, label: 'Roles y Permisos' },
            { key: 'usuarios' as const, icon: Users, label: 'Usuarios' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <Icon className="w-4 h-4 inline mr-2" />{label}
            </button>
          ))}
        </nav>
      </div>

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

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Roles</h3>
              <button onClick={() => setShowRoleForm(true)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                <Plus className="w-4 h-4" /> Nuevo
              </button>
            </div>
            <div className="space-y-2">
              {roles.map(role => (
                <div key={role.rol} onClick={() => loadRolePermisos(role.rol)}
                  className={`p-3 rounded-lg cursor-pointer transition ${selectedRole === role.rol ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{role.rol}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{role.totalPermisos} permisos</span>
                        <button onClick={(e) => { e.stopPropagation(); setDeletingRole(role.rol); setShowDeleteRoleConfirm(true); }}
                          className="text-red-400 hover:text-red-600" title="Eliminar rol">
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            {selectedRole ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Permisos de: {selectedRole}</h3>
                  <div className="flex space-x-2">
                    <button onClick={() => setRolePermisos(permisos.map(p => p.codigo))}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">Seleccionar todos</button>
                    <button onClick={() => setRolePermisos([])}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">Limpiar</button>
                    <button onClick={saveRolePermisos} disabled={saving}
                      className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50">
                      <RefreshCw className={`w-4 h-4 inline mr-1 ${saving ? 'animate-spin' : ''}`} />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {[...new Set(permisos.map(p => p.modulo))].map(modulo => {
                    const permisosModulo = permisos.filter(p => p.modulo === modulo);
                    return (
                      <div key={modulo} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 capitalize">{modulo}</h4>
                          {permisosModulo.every(p => rolePermisos.includes(p.codigo)) ? (
                            <button onClick={() => setRolePermisos(prev => prev.filter(c => !permisosModulo.some(p => p.codigo === c)))}
                              className="text-xs text-blue-600 hover:text-blue-800">Deseleccionar todo</button>
                          ) : (
                            <button onClick={() => setRolePermisos(prev => [...new Set([...prev, ...permisosModulo.map(p => p.codigo)])])}
                              className="text-xs text-blue-600 hover:text-blue-800">Seleccionar todo</button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {permisosModulo.map(permiso => (
                            <label key={permiso.codigo} className="flex items-center space-x-2 text-sm">
                              <input type="checkbox" checked={rolePermisos.includes(permiso.codigo)}
                                onChange={() => togglePermiso(permiso.codigo)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
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
              <div className="text-center text-gray-500 py-12">Selecciona un rol para ver sus permisos</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { setEditingUser(null); setShowUserForm(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg">
              <Plus className="w-4 h-4" /> Nuevo Usuario
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map(usuario => (
                  <tr key={usuario.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{usuario.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{usuario.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles.map(rol => (
                          <span key={rol} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{rol}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button onClick={() => { setEditingUser(usuario); setShowUserForm(true); }}
                          className="text-blue-500 hover:text-blue-700" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setResettingUser(usuario); setShowResetConfirm(true); }}
                          className="text-amber-500 hover:text-amber-700" title="Resetear contraseña">
                          <Key className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDeletingUser(usuario); setShowDeleteConfirm(true); }}
                          className="text-red-500 hover:text-red-700" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <UserFormModal isOpen={showUserForm} onClose={() => { setShowUserForm(false); setEditingUser(null); }}
        onSave={handleSaveUser} usuario={editingUser} rolesDisponibles={roles} />
      <RoleFormModal isOpen={showRoleForm} onClose={() => setShowRoleForm(false)}
        onSave={handleCreateRole} permisos={permisos} />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeletingUser(null); }}
        onConfirm={handleDeleteUser} title="Eliminar usuario"
        message={`¿Estás seguro de eliminar al usuario "${deletingUser?.username}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar" danger saving={saving} />
      <ConfirmDialog isOpen={showDeleteRoleConfirm} onClose={() => { setShowDeleteRoleConfirm(false); setDeletingRole(null); }}
        onConfirm={handleDeleteRole} title="Eliminar rol"
        message={`¿Estás seguro de eliminar el rol "${deletingRole}"? Esta acción eliminará todos los permisos asociados.`}
        confirmText="Eliminar" danger saving={saving} />
      <ConfirmDialog isOpen={showResetConfirm} onClose={() => { setShowResetConfirm(false); setResettingUser(null); }}
        onConfirm={handleResetPassword} title="Resetear contraseña"
        message={`¿Generar una nueva contraseña temporal para "${resettingUser?.username}"? El usuario deberá cambiarla en su próximo inicio de sesión.`}
        confirmText="Generar contraseña" saving={saving} />
      <PasswordDisplayModal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setGeneratedPassword(''); setResetUsername(''); }}
        username={resetUsername} password={generatedPassword} />
    </div>
  );
}
