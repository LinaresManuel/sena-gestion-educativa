import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, List, X } from "lucide-react";
import { TipoAmbiente } from "./TiposAmbienteView";
import ElementosAmbienteGrid from "./ElementosAmbienteGrid";
import { useHasAnyPermission } from "../lib/auth-context";

interface Ambiente {
  id: number;
  codigo: string;
  nombre: string;
  capacidad: number;
  tipoAmbienteId: number;
  ubicacion: string;
  estado: string;
  centroId: number;
}

interface Centro {
  id: number;
  nombre: string;
}

export default function AmbientesView() {
  const canEdit = useHasAnyPermission('salones.editar', 'salones.crear');
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);
  const [tiposAmbiente, setTiposAmbiente] = useState<TipoAmbiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedAmbienteForElements, setSelectedAmbienteForElements] = useState<Ambiente | null>(null);

  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const showMessage = (text: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Form state
  const [centroId, setCentroId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [tipoAmbienteId, setTipoAmbienteId] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("ACTIVO");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ambRes, cenRes, tipRes] = await Promise.all([
        fetch("/api/ambientes"),
        fetch("/api/centros"),
        fetch("/api/tipos-ambiente")
      ]);
      const ambData = await ambRes.json();
      const cenData = await cenRes.json();
      const tipData = await tipRes.json();
      
      setAmbientes(Array.isArray(ambData) ? ambData : []);
      setCentros(Array.isArray(cenData) ? cenData : []);
      setTiposAmbiente(Array.isArray(tipData) ? tipData : []);
      
      if (!Array.isArray(ambData)) console.error("Error fetching ambientes:", ambData);
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
    if (!centroId) return showMessage("Seleccione un centro de formación", "error");
    if (!tipoAmbienteId) return showMessage("Seleccione un tipo de ambiente", "error");
    
    const payload = { 
      codigo, 
      nombre, 
      capacidad: Number(capacidad), 
      tipoAmbienteId: Number(tipoAmbienteId), 
      ubicacion, 
      estado, 
      centroId: Number(centroId) 
    };

    try {
      let resp;
      if (editingId) {
        resp = await fetch(`/api/ambientes/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al actualizar");
        showMessage("Ambiente actualizado correctamente", "success");
        setEditingId(null);
      } else {
        resp = await fetch("/api/ambientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al crear");
        showMessage("Ambiente creado correctamente", "success");
      }
      cancelEdit();
      fetchData();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al guardar ambiente");
    }
  };

  const handleEdit = (a: Ambiente) => {
    setEditingId(a.id);
    setCentroId(a.centroId.toString());
    setCodigo(a.codigo);
    setNombre(a.nombre);
    setCapacidad(a.capacidad.toString());
    setTipoAmbienteId(a.tipoAmbienteId.toString());
    setUbicacion(a.ubicacion || "");
    setEstado(a.estado);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCentroId("");
    setCodigo("");
    setNombre("");
    setCapacidad("");
    setTipoAmbienteId("");
    setUbicacion("");
    setEstado("ACTIVO");
  };

  const handleDelete = async (id: number) => {
    try {
      const resp = await fetch(`/api/ambientes/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al borrar asegúrese que no existan elementos asociados.");
      showMessage("Ambiente eliminado correctamente", "success");
      fetchData();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al borrar ambiente");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ambientes</h1>
      </div>

      {notification && (
        <div className={`p-4 rounded-md text-sm border font-medium flex items-center justify-between ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {canEdit && (
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="text-lg font-medium mb-2">{editingId ? "Editar Ambiente" : "Nuevo Ambiente"}</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Formación</label>
                <select required value={centroId} onChange={e => setCentroId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value="">Seleccione...</option>
                  {centros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input type="text" required value={codigo} onChange={e => setCodigo(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Ej: A-101" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                  <input type="number" required value={capacidad} onChange={e => setCapacidad(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="30" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Sala de Sistemas 1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select required value={tipoAmbienteId} onChange={e => setTipoAmbienteId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                    <option value="">Seleccione...</option>
                    {tiposAmbiente.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select required value={estado} onChange={e => setEstado(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación / Geolocalización</label>
                <input type="text" value={ubicacion} onChange={e => setUbicacion(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Lat, Lng o URL de Maps" />
              </div>
              
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2">
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

        <div className={canEdit ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500">Amd./Cód.</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Nombre</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Centro</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Capacidad / Tipo</th>
                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Cargando...</td></tr>
                  ) : ambientes.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay ambientes registrados.</td></tr>
                  ) : (
                    ambientes.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono font-medium">{a.codigo}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{a.nombre}</div>
                          {a.ubicacion && <div className="text-xs text-blue-500 truncate w-32">{a.ubicacion}</div>}
                        </td>
                        <td className="px-6 py-4">{centros.find(c => c.id === a.centroId)?.nombre || a.centroId}</td>
                        <td className="px-6 py-4">
                          <div>{a.capacidad} pax</div>
                          <div className="text-xs text-gray-500">{tiposAmbiente.find(t => t.id === a.tipoAmbienteId)?.nombre || a.tipoAmbienteId}</div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <span className={`px-2 py-1 text-[10px] rounded-full font-medium ${a.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {a.estado}
                          </span>
                          <button onClick={() => setSelectedAmbienteForElements(a)} className="text-gray-400 hover:text-indigo-600 transition p-1" title="Elementos">
                            <List className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => handleEdit(a)} className="text-gray-400 hover:text-blue-600 transition p-1" title="Editar">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(a.id)} className="text-gray-400 hover:text-red-600 transition p-1" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {selectedAmbienteForElements && (
        <ElementosAmbienteGrid 
          ambienteId={selectedAmbienteForElements.id} 
          ambienteNombre={selectedAmbienteForElements.nombre} 
          onClose={() => setSelectedAmbienteForElements(null)} 
        />
      )}
    </div>
  );
}
