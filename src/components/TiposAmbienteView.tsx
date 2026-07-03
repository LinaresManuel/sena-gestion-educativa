import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { useHasAnyPermission } from "../lib/auth-context";

export interface TipoAmbiente {
  id: number;
  nombre: string;
  descripcion: string;
}

export default function TiposAmbienteView() {
  const canEdit = useHasAnyPermission('config.editar', 'config.crear');
  const [tipos, setTipos] = useState<TipoAmbiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const showMessage = (text: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setEditingId(null);
      } else {
        resp = await fetch("/api/tipos-ambiente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, descripcion }),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al crear");
        showMessage("Tipo creado correctamente", "success");
      }
      setNombre("");
      setDescripcion("");
      fetchData();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al guardar el tipo");
    }
  };

  const handleEdit = (t: TipoAmbiente) => {
    setEditingId(t.id);
    setNombre(t.nombre);
    setDescripcion(t.descripcion || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNombre("");
    setDescripcion("");
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tipos de Ambientes</h1>
      </div>

      {notification && (
        <div className={`p-4 rounded-md text-sm border font-medium flex items-center justify-between ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {canEdit && (
          <div className="md:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm">
              <h2 className="text-lg font-medium mb-4">{editingId ? "Editar Tipo" : "Nuevo Tipo"}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="Ej: Aula, Laboratorio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="Detalle opcional..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 flex items-center justify-center gap-2 text-sm">
                  {editingId ? "Actualizar" : <><Plus className="w-4 h-4" /> Agregar</>}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 text-sm">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className={canEdit ? "md:col-span-2" : "md:col-span-3"}>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">Nombre</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Descripción</th>
                  {canEdit && <th className="px-6 py-3 font-medium text-gray-500 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={canEdit ? 3 : 2} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
                  </tr>
                ) : tipos.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 3 : 2} className="px-6 py-4 text-center text-gray-500">No hay tipos registrados.</td>
                  </tr>
                ) : (
                  tipos.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{t.nombre}</td>
                      <td className="px-6 py-4 text-gray-600">{t.descripcion}</td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleEdit(t)} className="text-gray-400 hover:text-blue-600 transition p-1" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600 transition p-1" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
