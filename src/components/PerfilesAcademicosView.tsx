import { useState, useEffect } from 'react';
import { useHasPermission } from '../lib/auth-context';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface PerfilAcademico {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  competenciasCount: number;
  instructoresCount: number;
}

export default function PerfilesAcademicosView() {
  const mayCrear = useHasPermission('perfiles_academicos.crear');
  const mayEditar = useHasPermission('perfiles_academicos.editar');
  const mayEliminar = useHasPermission('perfiles_academicos.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;

  const [perfiles, setPerfiles] = useState<PerfilAcademico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<PerfilAcademico | null>(null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => { loadPerfiles(); }, []);

  async function loadPerfiles() {
    try {
      const res = await fetch('/api/perfiles-academicos');
      if (res.ok) setPerfiles(await res.json());
    } catch (e) {
      console.error('Error loading perfiles:', e);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingPerfil(null);
    setCodigo('');
    setNombre('');
    setDescripcion('');
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: PerfilAcademico) {
    setEditingPerfil(p);
    setCodigo(p.codigo);
    setNombre(p.nombre);
    setDescripcion(p.descripcion ?? '');
    setError(null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { codigo, nombre, descripcion };
      const url = editingPerfil
        ? `/api/perfiles-academicos/${editingPerfil.id}`
        : '/api/perfiles-academicos';
      const method = editingPerfil ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      setShowForm(false);
      setEditingPerfil(null);
      setSuccessMsg(editingPerfil ? 'Perfil actualizado' : 'Perfil creado');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadPerfiles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/perfiles-academicos/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error al eliminar');
        return;
      }
      setDeleteId(null);
      setSuccessMsg('Perfil eliminado');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadPerfiles();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Cargando...</div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Perfiles Académicos</h2>
        {mayCrear && (
          <button onClick={openCreate}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
            <Plus className="w-4 h-4" /> Nuevo Perfil
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Competencias</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Instructores</th>
              {hayAcciones && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {perfiles.length === 0 ? (
              <tr><td colSpan={hayAcciones ? 6 : 5} className="px-4 py-8 text-center text-gray-500">No hay perfiles académicos registrados</td></tr>
            ) : (
              perfiles.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.codigo}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{p.descripcion ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-center"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{p.competenciasCount}</span></td>
                  <td className="px-4 py-3 text-sm text-center"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">{p.instructoresCount}</span></td>
                  {hayAcciones && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {mayEditar && (
                          <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {mayEliminar && (
                          <button onClick={() => setDeleteId(p.id)} className="text-red-500 hover:text-red-700" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">{editingPerfil ? 'Editar Perfil' : 'Nuevo Perfil Académico'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" required minLength={1} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" required minLength={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400">(opcional)</span></label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving || !codigo.trim() || !nombre.trim()}
                  className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} title="Eliminar perfil"
        message="¿Estás seguro de eliminar este perfil académico? No se puede eliminar si está asignado a competencias o instructores."
        confirmText="Eliminar" danger />
    </div>
  );
}
