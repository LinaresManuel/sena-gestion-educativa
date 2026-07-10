import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, List, X } from "lucide-react";
import { TipoAmbiente } from "./TiposAmbienteView";
import ElementosAmbienteGrid from "./ElementosAmbienteGrid";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";
import ConfirmDialog from "./ConfirmDialog";

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
  const mayCrear = useHasPermission('ambientes.crear');
  const mayEditar = useHasPermission('ambientes.editar');
  const mayEliminar = useHasPermission('ambientes.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);
  const [tiposAmbiente, setTiposAmbiente] = useState<TipoAmbiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedAmbienteForElements, setSelectedAmbienteForElements] = useState<Ambiente | null>(null);

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
      const res = await fetch(`/api/dependencias/ambientes/${id}`);
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

  const handleDependenciasAceptar = () => {
    if (dependencias?.some(d => !d.elimina)) {
      const bloquean = dependencias.filter(d => !d.elimina).map(d => d.label).join(', ');
      showMessage(`No se puede eliminar el ambiente. Primero debe eliminar: ${bloquean}`, "error");
      setDeletingId(null);
      setDependencias(null);
      setPasoDialogo('ninguno');
      return;
    }
    setPasoDialogo('confirmar');
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

  function handleClose() {
    setShowForm(false);
    setEditingId(null);
    setCentroId("");
    setCodigo("");
    setNombre("");
    setCapacidad("");
    setTipoAmbienteId("");
    setUbicacion("");
    setEstado("ACTIVO");
    setError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centroId) return setError("Seleccione un centro de formación");
    if (!tipoAmbienteId) return setError("Seleccione un tipo de ambiente");
    setSaving(true);
    setError(null);

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
      } else {
        resp = await fetch("/api/ambientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al crear");
        showMessage("Ambiente creado correctamente", "success");
      }
      handleClose();
      fetchData();
    } catch (e: any) {
      setError(e.message || "Error al guardar ambiente");
    } finally {
      setSaving(false);
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
    setError(null);
    setShowForm(true);
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ambientes</h1>
        {mayCrear && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setCentroId(""); setCodigo(""); setNombre(""); setCapacidad(""); setTipoAmbienteId(""); setUbicacion(""); setEstado("ACTIVO"); setError(null); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg">
            <Plus className="w-4 h-4" /> Nuevo Ambiente
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">Amd./Cod.</th>
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
                      {mayEditar && (
                        <button onClick={() => handleEdit(a)} className="text-gray-400 hover:text-blue-600 transition p-1" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {mayEliminar && (
                        <button onClick={() => handleTrashClick(a.id)} className="text-gray-400 hover:text-red-600 transition p-1" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAmbienteForElements && (
        <ElementosAmbienteGrid
          ambienteId={selectedAmbienteForElements.id}
          ambienteNombre={selectedAmbienteForElements.nombre}
          onClose={() => setSelectedAmbienteForElements(null)}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
          onClick={handleClose}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar Ambiente' : 'Nuevo Ambiente'}</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Formación</label>
                <select value={centroId} onChange={e => setCentroId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required>
                  <option value="">Seleccione...</option>
                  {centros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required placeholder="Ej: A-101" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                  <input type="number" value={capacidad} onChange={e => setCapacidad(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required placeholder="30" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required placeholder="Sala de Sistemas 1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={tipoAmbienteId} onChange={e => setTipoAmbienteId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required>
                    <option value="">Seleccione...</option>
                    {tiposAmbiente.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación / Geolocalización</label>
                <input type="text" value={ubicacion} onChange={e => setUbicacion(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Lat, Lng o URL de Maps" />
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving || !codigo.trim() || !nombre.trim() || !centroId || !tipoAmbienteId}
                  className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pasoDialogo === 'dependencias'}
        title="Eliminar Ambiente"
        message={
          <>
            <p className="mb-2">Este ambiente tiene las siguientes dependencias:</p>
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
            handleDependenciasAceptar();
          }
        }}
        onClose={() => { setDeletingId(null); setDependencias(null); setPasoDialogo('ninguno'); }}
      />
      <ConfirmDialog
        isOpen={pasoDialogo === 'confirmar'}
        title="Eliminar Ambiente"
        message="¿Estás seguro de que deseas eliminar este ambiente? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        danger
        onConfirm={() => { if (deletingId !== null) { handleDelete(deletingId); setDeletingId(null); } setPasoDialogo('ninguno'); }}
        onClose={() => { setDeletingId(null); setPasoDialogo('ninguno'); }}
      />
    </div>
  );
}
