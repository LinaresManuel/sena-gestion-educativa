import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";
import ConfirmDialog from "./ConfirmDialog";

export interface TipoAmbiente {
  id: number;
  nombre: string;
  descripcion: string;
}

export default function TiposAmbienteView() {
  const mayCrear = useHasPermission('tipos_ambiente.crear');
  const mayEditar = useHasPermission('tipos_ambiente.editar');
  const mayEliminar = useHasPermission('tipos_ambiente.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;
  const [tipos, setTipos] = useState<TipoAmbiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dependencias, setDependencias] = useState<{ tipo: string; count: number; label: string; elimina: boolean }[] | null>(null);
  const [pasoDialogo, setPasoDialogo] = useState<'ninguno' | 'dependencias' | 'confirmar'>('ninguno');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showMessage = (text: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleTrashClick = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dependencias/tipos-ambiente/${id}`);
      const data = await res.json();
      if (data.dependencias && data.dependencias.length > 0) {
        setDependencias(data.dependencias);
        setPasoDialogo('dependencias');
      } else {
        setPasoDialogo('confirmar');
      }
    } catch {
      setPasoDialogo('confirmar');
    }
  };

  // Form state
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tipos-ambiente");
      const data = await res.json();
      setTipos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setTipos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function handleClose() {
    setShowForm(false);
    setEditingId(null);
    setNombre("");
    setDescripcion("");
    setError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let resp;
      if (editingId) {
        resp = await fetch(`/api/tipos-ambiente/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, descripcion }),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al actualizar");
        showMessage("Tipo actualizado correctamente", "success");
      } else {
        resp = await fetch("/api/tipos-ambiente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, descripcion }),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al crear");
        showMessage("Tipo creado correctamente", "success");
      }
      handleClose();
      fetchData();
    } catch (e: any) {
      setError(e.message || "Error al guardar el tipo");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t: TipoAmbiente) => {
    setEditingId(t.id);
    setNombre(t.nombre);
    setDescripcion(t.descripcion || "");
    setError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const resp = await fetch(`/api/tipos-ambiente/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al borrar, asegúrese que no existan ambientes con este tipo.");
      showMessage("Tipo eliminado correctamente", "success");
      fetchData();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al borrar el tipo");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tipos de Ambientes</h1>
        {mayCrear && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setNombre(""); setDescripcion(""); setError(null); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg">
            <Plus className="w-4 h-4" /> Nuevo Tipo
          </button>
        )}
      </div>

      {notification && (
        <div className={`p-4 rounded-md text-sm border font-medium flex items-center justify-between ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Nombre</th>
              <th className="px-6 py-3 font-medium text-gray-500">Descripcion</th>
              {hayAcciones && <th className="px-6 py-3 font-medium text-gray-500 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={hayAcciones ? 3 : 2} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
              </tr>
            ) : tipos.length === 0 ? (
              <tr>
                <td colSpan={hayAcciones ? 3 : 2} className="px-6 py-4 text-center text-gray-500">No hay tipos registrados.</td>
              </tr>
            ) : (
              tipos.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{t.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{t.descripcion}</td>
                  {hayAcciones && (
                    <td className="px-6 py-4 text-right space-x-2">
                      {mayEditar && (
                      <button onClick={() => handleEdit(t)} className="text-gray-400 hover:text-blue-600 transition p-1" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>)}
                      {mayEliminar && (
                      <button onClick={() => handleTrashClick(t.id)} className="text-gray-400 hover:text-red-600 transition p-1" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
          onClick={handleClose}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar Tipo' : 'Nuevo Tipo de Ambiente'}</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" required
                  placeholder="Ej: Aula, Laboratorio" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
                  placeholder="Detalle opcional..." />
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving || !nombre.trim()}
                  className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pasoDialogo === 'dependencias'}
        title="Eliminar Tipo de Ambiente"
        message={
          <>
            <p className="mb-2">Este elemento tiene las siguientes dependencias:</p>
            <ul className="list-disc pl-5 space-y-1 mb-3 text-sm">
              {dependencias?.map((d, i) => (
                <li key={i} className={d.elimina ? 'text-amber-700' : 'text-red-700'}>
                  <strong>{d.count}</strong> {d.label}
                  {d.elimina ? ' (se eliminarán en cascada)' : ' (debe eliminarlos primero)'}
                </li>
              ))}
            </ul>
            {dependencias?.some(d => !d.elimina) ? (
              <p className="text-red-700 font-medium">No se puede eliminar hasta que resuelva las dependencias marcadas.</p>
            ) : (
              <p className="text-amber-700 font-medium">¿Desea continuar con la eliminación? Se eliminarán también los elementos listados.</p>
            )}
          </>
        }
        confirmText={dependencias?.some(d => !d.elimina) ? 'Entendido' : 'Continuar'}
        danger
        onConfirm={() => {
          if (dependencias?.some(d => !d.elimina)) {
            setDeletingId(null);
            setDependencias(null);
            setPasoDialogo('ninguno');
          } else {
            setPasoDialogo('confirmar');
          }
        }}
        onClose={() => { setDeletingId(null); setDependencias(null); setPasoDialogo('ninguno'); }}
      />
      <ConfirmDialog
        isOpen={pasoDialogo === 'confirmar'}
        title="Eliminar Tipo de Ambiente"
        message="¿Estás seguro de que deseas eliminar este tipo de ambiente? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        danger
        onConfirm={() => { if (deletingId !== null) { handleDelete(deletingId); setDeletingId(null); } setPasoDialogo('ninguno'); }}
        onClose={() => { setDeletingId(null); setPasoDialogo('ninguno'); }}
      />
    </div>
  );
}
