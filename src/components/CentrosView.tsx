import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";

interface Centro {
  id: number;
  codigo: string;
  nombre: string;
  regionalId: number;
}

interface Regional {
  id: number;
  nombre: string;
}

export default function CentrosView() {
  const mayCrear = useHasPermission('centros.crear');
  const mayEditar = useHasPermission('centros.editar');
  const mayEliminar = useHasPermission('centros.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;
  const [centros, setCentros] = useState<Centro[]>([]);
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const showMessage = (text: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Form state
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [regionalId, setRegionalId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cenRes, regRes] = await Promise.all([
        fetch("/api/centros"),
        fetch("/api/regionales")
      ]);
      const centrosData = await cenRes.json();
      const regionalesData = await regRes.json();
      setCentros(Array.isArray(centrosData) ? centrosData : []);
      setRegionales(Array.isArray(regionalesData) ? regionalesData : []);
      if (!Array.isArray(centrosData)) console.error("Error fetching centros:", centrosData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionalId) return showMessage("Seleccione una regional", "error");
    try {
      let resp;
      if (editingId) {
        resp = await fetch(`/api/centros/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo, nombre, regionalId: Number(regionalId) }),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al actualizar");
        showMessage("Centro actualizado correctamente", "success");
        setEditingId(null);
      } else {
        resp = await fetch("/api/centros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo, nombre, regionalId: Number(regionalId) }),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al crear");
        showMessage("Centro creado correctamente", "success");
      }
      setCodigo("");
      setNombre("");
      setRegionalId("");
      fetchData();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al guardar el centro");
    }
  };

  const handleEdit = (c: Centro) => {
    setEditingId(c.id);
    setCodigo(c.codigo);
    setNombre(c.nombre);
    setRegionalId(c.regionalId.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCodigo("");
    setNombre("");
    setRegionalId("");
  };

  const handleDelete = async (id: number) => {
    try {
      const resp = await fetch(`/api/centros/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al borrar, asegúrese que no existan ambientes asociados.");
      showMessage("Centro eliminado correctamente", "success");
      fetchData();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al borrar el centro");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Centros de Formación</h1>
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
        {hayAcciones && (
          <div className="md:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm">
              <h2 className="text-lg font-medium mb-4">{editingId ? "Editar Centro" : "Nuevo Centro"}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={e => setCodigo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Ej: 9202"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Centro de Formación..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regional</label>
                  <select
                    required
                    value={regionalId}
                    onChange={e => setRegionalId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Seleccione...</option>
                    {regionales.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2">
                  {editingId ? "Actualizar" : <><Plus className="w-4 h-4" /> Agregar</>}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className={hayAcciones ? "md:col-span-2" : "md:col-span-3"}>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">Codigo</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Nombre</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Regional</th>
                  {hayAcciones && <th className="px-6 py-3 font-medium text-gray-500 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={hayAcciones ? 4 : 3} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
                  </tr>
                ) : centros.length === 0 ? (
                  <tr>
                    <td colSpan={hayAcciones ? 4 : 3} className="px-6 py-4 text-center text-gray-500">No hay centros registrados.</td>
                  </tr>
                ) : (
                  centros.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-gray-600">{c.codigo}</td>
                      <td className="px-6 py-4 font-medium">{c.nombre}</td>
                      <td className="px-6 py-4">{regionales.find(r => r.id === c.regionalId)?.nombre || c.regionalId}</td>
                      {hayAcciones && (
                        <td className="px-6 py-4 text-right space-x-2">
                          {mayEditar && (
                          <button onClick={() => handleEdit(c)} className="text-gray-400 hover:text-blue-600 transition p-1" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>)}
                          {mayEliminar && (
                          <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-600 transition p-1" title="Eliminar">
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
        </div>
      </div>
    </div>
  );

}
