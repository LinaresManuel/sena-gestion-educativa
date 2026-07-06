import { useState, useEffect } from "react";
import { Plus, Trash2, X, Pencil } from "lucide-react";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";

interface Instructor {
  id: number;
  documento: string;
  nombres: string;
  apellidos: string;
  tipoVinculacion: string;
  estado: string;
  requisitosAcademicos: string[];
}

export default function InstructoresView() {
  const mayCrear = useHasPermission('instructores.crear');
  const mayEditar = useHasPermission('instructores.editar');
  const mayEliminar = useHasPermission('instructores.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [availablePerfiles, setAvailablePerfiles] = useState<{codigo: string, nombre: string}[]>([]);

  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const showMessage = (text: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Form state
  const [documento, setDocumento] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [tipoVinculacion, setTipoVinculacion] = useState("PLANTA");
  const [estado, setEstado] = useState("ACTIVO");
  const [selectedPerfiles, setSelectedPerfiles] = useState<string[]>([]);

  const fetchInstructores = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/instructores");
      const data = await res.json();
      setInstructores(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setInstructores([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerfiles = async () => {
    try {
      const res = await fetch("/api/perfiles-unicos");
      const data = await res.json();
      setAvailablePerfiles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInstructores();
    fetchPerfiles();
  }, []);

  const togglePerfil = (nombre: string) => {
    setSelectedPerfiles(prev => 
      prev.includes(nombre) 
        ? prev.filter(p => p !== nombre)
        : [...prev, nombre]
    );
  };

  const handleEdit = (instructor: Instructor) => {
    setEditingId(instructor.id);
    setDocumento(instructor.documento);
    setNombres(instructor.nombres);
    setApellidos(instructor.apellidos);
    setTipoVinculacion(instructor.tipoVinculacion);
    setEstado(instructor.estado);
    setSelectedPerfiles(instructor.requisitosAcademicos || []);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDocumento("");
    setNombres("");
    setApellidos("");
    setTipoVinculacion("PLANTA");
    setEstado("ACTIVO");
    setSelectedPerfiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPerfiles.length === 0) {
      return showMessage("Seleccione al menos un perfil", "error");
    }
    
    try {
      let resp;
      if (editingId) {
        resp = await fetch(`/api/instructores/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documento, nombres, apellidos, tipoVinculacion, estado,
            requisitosAcademicos: selectedPerfiles
          }),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al actualizar");
        showMessage("Instructor actualizado correctamente", "success");
        setEditingId(null);
      } else {
        resp = await fetch("/api/instructores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documento, nombres, apellidos, tipoVinculacion, estado,
            requisitosAcademicos: selectedPerfiles
          }),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al registrar");
        showMessage("Instructor registrado correctamente", "success");
      }
      setDocumento("");
      setNombres("");
      setApellidos("");
      setTipoVinculacion("PLANTA");
      setEstado("ACTIVO");
      setSelectedPerfiles([]);
      fetchInstructores();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al registrar instructor");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const resp = await fetch(`/api/instructores/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al borrar");
      showMessage("Instructor eliminado correctamente", "success");
      fetchInstructores();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al borrar instructor");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Instructores</h1>
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
        {(mayCrear || mayEditar) && (
          <div className="md:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium">{editingId ? "Editar Instructor" : "Nuevo Instructor"}</h2>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                <input type="text" required value={documento} onChange={e => setDocumento(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                  <input type="text" required value={nombres} onChange={e => setNombres(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input type="text" required value={apellidos} onChange={e => setApellidos(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vinculación</label>
                <select required value={tipoVinculacion} onChange={e => setTipoVinculacion(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                  <option value="PLANTA">PLANTA</option>
                  <option value="CONTRATISTA">CONTRATISTA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfiles Académicos</label>
                {availablePerfiles.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">No hay perfiles registrados. Cree un perfil en la sección de Currículos primero.</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2 bg-gray-50">
                    {availablePerfiles.map((p, i) => (
                      <label key={i} className="flex items-start gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1"
                          checked={selectedPerfiles.includes(p.nombre)}
                          onChange={() => togglePerfil(p.nombre)}
                        />
                        <span className="text-sm text-gray-700">{p.nombre} <span className="text-gray-400 text-xs text-nowrap">({p.codigo})</span></span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select required value={estado} onChange={e => setEstado(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
              
              <button type="submit" className="w-full mt-4 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2">
                {editingId ? "Actualizar Instructor" : <><Plus className="w-4 h-4" /> Registrar Instructor</>}
              </button>
            </form>
          </div>
        )}

        <div className={(mayCrear || mayEditar) ? "md:col-span-2" : "md:col-span-3"}>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">Documento</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Nombre Completo</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Vinculación</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Perfiles</th>
                  {hayAcciones && <th className="px-6 py-3 font-medium text-gray-500 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                    <tr><td colSpan={hayAcciones ? 5 : 4} className="px-6 py-4 text-center text-gray-500">Cargando...</td></tr>
                  ) : instructores.length === 0 ? (
                    <tr><td colSpan={hayAcciones ? 5 : 4} className="px-6 py-4 text-center text-gray-500">No hay instructores registrados.</td></tr>
                ) : (
                  instructores.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-gray-600">{a.documento}</td>
                      <td className="px-6 py-4 font-medium">{a.nombres} {a.apellidos}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{a.tipoVinculacion}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(a.requisitosAcademicos) && a.requisitosAcademicos.map((r, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">{r}</span>
                          ))}
                        </div>
                      </td>
                      {hayAcciones && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {mayEditar && (
                              <button onClick={() => handleEdit(a)} className="text-gray-400 hover:text-purple-600 transition p-1">
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {mayEliminar && (
                              <button onClick={() => handleDelete(a.id)} className="text-gray-400 hover:text-red-600 transition p-1">
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
        </div>
      </div>
    </div>
  );
}
