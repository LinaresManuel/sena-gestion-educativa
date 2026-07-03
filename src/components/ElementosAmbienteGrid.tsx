import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { useHasAnyPermission } from "../lib/auth-context";

export interface ElementoAmbiente {
  id: number;
  placa: string;
  nombre: string;
  detalle: string;
  estado: string;
  imagen?: string;
  ambienteId: number;
}

interface Props {
  ambienteId: number;
  ambienteNombre: string;
  onClose: () => void;
}

export default function ElementosAmbienteGrid({ ambienteId, ambienteNombre, onClose }: Props) {
  const canEdit = useHasAnyPermission('ambientes.editar', 'ambientes.crear');
  const [elementos, setElementos] = useState<ElementoAmbiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const showMessage = (text: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Form
  const [placa, setPlaca] = useState("");
  const [nombre, setNombre] = useState("");
  const [detalle, setDetalle] = useState("");
  const [estado, setEstado] = useState("BUENO");
  const [imagen, setImagen] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ambientes/${ambienteId}/elementos`);
      const data = await res.json();
      setElementos(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
      setElementos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ambienteId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagen(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { placa, nombre, detalle, estado, imagen };
    try {
      let resp;
      if (editingId) {
        resp = await fetch(`/api/elementos-ambiente/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al actualizar");
        showMessage("Elemento actualizado correctamente", "success");
        setEditingId(null);
      } else {
        resp = await fetch(`/api/ambientes/${ambienteId}/elementos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al crear");
        showMessage("Elemento creado correctamente", "success");
      }
      setPlaca("");
      setNombre("");
      setDetalle("");
      setEstado("BUENO");
      setImagen("");
      fetchData();
    } catch(e: any) {
      console.error(e);
      showMessage(e.message || "Error al guardar el elemento");
    }
  };

  const handleEdit = (el: ElementoAmbiente) => {
    setEditingId(el.id);
    setPlaca(el.placa);
    setNombre(el.nombre);
    setDetalle(el.detalle || "");
    setEstado(el.estado);
    setImagen(el.imagen || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setPlaca("");
    setNombre("");
    setDetalle("");
    setEstado("BUENO");
    setImagen("");
  };

  const handleDelete = async (id: number) => {
    try {
      const resp = await fetch(`/api/elementos-ambiente/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al borrar asegúrese de no tener dependencias.");
      showMessage("Elemento eliminado correctamente", "success");
      fetchData();
    } catch(e: any) {
      console.error(e);
      showMessage(e.message || "Error al borrar el elemento");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Elementos del Ambiente: <span className="text-gray-600 font-normal">{ambienteNombre}</span></h2>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {notification && (
          <div className={`mx-6 mt-4 p-3 rounded-md text-sm border font-medium flex items-center justify-between ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="p-6 overflow-auto flex-1 gap-6 grid grid-cols-1 md:grid-cols-3">
          {canEdit && (
            <div className="md:col-span-1">
              <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <h3 className="font-medium">{editingId ? "Editar Elemento" : "Nuevo Elemento"}</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nº Placa</label>
                  <input required type="text" value={placa} onChange={e=>setPlaca(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Bien</label>
                  <input required type="text" value={nombre} onChange={e=>setNombre(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Detalle</label>
                  <textarea value={detalle} onChange={e=>setDetalle(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-md text-sm"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select value={estado} onChange={e=>setEstado(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                    <option value="BUENO">BUENO</option>
                    <option value="REGULAR">REGULAR</option>
                    <option value="MALO">MALO</option>
                    <option value="DE BAJA">DE BAJA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Foto del Bien</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs" />
                  {imagen && (
                    <div className="mt-2 relative">
                      <img src={imagen} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                      <button type="button" onClick={() => setImagen("")} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm">
                    {editingId ? "Actualizar" : <><Plus className="w-4 h-4"/> Agregar</>}
                  </button>
                  {editingId && (
                    <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-md hover:bg-gray-400 text-sm">Cancel</button>
                  )}
                </div>
              </form>
            </div>
          )}
          
          <div className={canEdit ? "md:col-span-2" : "md:col-span-3"}>
            <div className="border rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500 w-16">Foto</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Placa</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Bien / Detalle</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Estado</th>
                    {canEdit && <th className="px-4 py-3 font-medium text-gray-500 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={canEdit ? 5 : 4} className="px-4 py-4 text-center text-gray-500">Cargando...</td></tr>
                  ) : elementos.length === 0 ? (
                    <tr><td colSpan={canEdit ? 5 : 4} className="px-4 py-4 text-center text-gray-500">No hay elementos registrados en este ambiente.</td></tr>
                  ) : (
                    elementos.map(el => (
                      <tr key={el.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {el.imagen ? (
                            <img src={el.imagen} alt={el.nombre} className="w-10 h-10 rounded object-cover border" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 border flex items-center justify-center text-gray-400 text-xs">Sin foto</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">{el.placa}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{el.nombre}</div>
                          <div className="text-xs text-gray-500">{el.detalle}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-[10px] rounded-full font-medium ${
                            el.estado === 'BUENO' ? 'bg-green-100 text-green-700' :
                            el.estado === 'REGULAR' ? 'bg-amber-100 text-amber-700' :
                            el.estado === 'MALO' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {el.estado}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right space-x-1">
                            <button onClick={() => handleEdit(el)} className="text-gray-400 hover:text-blue-600 transition p-1">
                              <Pencil className="w-4 h-4"/>
                            </button>
                            <button onClick={() => handleDelete(el.id)} className="text-gray-400 hover:text-red-600 transition p-1">
                              <Trash2 className="w-4 h-4"/>
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
    </div>
  )
}
