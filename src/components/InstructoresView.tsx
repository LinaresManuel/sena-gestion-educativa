import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Pencil, Clock } from "lucide-react";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";
import ConfirmDialog from "./ConfirmDialog";

const DIAS_VISIBLES = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const HORAS = Array.from({ length: 16 }, (_, i) => {
  const start = i + 6;
  return `${start.toString().padStart(2, '0')}:00-${(start + 1).toString().padStart(2, '0')}:00`;
});

interface PerfilInfo {
  id: number;
  codigo: string;
  nombre: string;
}

interface Instructor {
  id: number;
  documento: string;
  nombres: string;
  apellidos: string;
  tipoVinculacion: string;
  estado: string;
  requisitosAcademicos: string[];
  perfiles: PerfilInfo[];
  centroFormacionId: number;
  horario: { [key: string]: string[] } | null;
}

interface Centro {
  id: number;
  nombre: string;
}

export default function InstructoresView() {
  const mayCrear = useHasPermission('instructores.crear');
  const mayEditar = useHasPermission('instructores.editar');
  const mayEliminar = useHasPermission('instructores.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [availablePerfiles, setAvailablePerfiles] = useState<PerfilInfo[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);

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
      const res = await fetch(`/api/dependencias/instructores/${id}`);
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
  const [documento, setDocumento] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [tipoVinculacion, setTipoVinculacion] = useState("PLANTA");
  const [estado, setEstado] = useState("ACTIVO");
  const [selectedPerfiles, setSelectedPerfiles] = useState<number[]>([]);
  const [centroFormacionId, setCentroFormacionId] = useState<number | "">("");
  const [horario, setHorario] = useState<{ [key: string]: string[] }>({});
  const isDragging = useRef(false);
  const dragStart = useRef<{ dia: string; hora: string } | null>(null);
  const dragEnd = useRef<{ dia: string; hora: string } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ minDay: number; maxDay: number; minHour: number; maxHour: number } | null>(null);

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
      const res = await fetch("/api/perfiles-academicos");
      const data = await res.json();
      setAvailablePerfiles(Array.isArray(data) ? data.map((p: any) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre })) : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCentros = async () => {
    try {
      const res = await fetch("/api/centros");
      const data = await res.json();
      setCentros(Array.isArray(data) ? data.map((c: any) => ({ id: c.id, nombre: c.nombre })) : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInstructores();
    fetchPerfiles();
    fetchCentros();
  }, []);

  function handleClose() {
    setShowForm(false);
    setEditingId(null);
    setDocumento("");
    setNombres("");
    setApellidos("");
    setTipoVinculacion("PLANTA");
    setEstado("ACTIVO");
    setSelectedPerfiles([]);
    setCentroFormacionId("");
    setHorario({});
    setError(null);
  }

  const toggleHour = (day: string, hour: string) => {
    setHorario(prev => {
      const copy = { ...prev };
      if (!copy[day]) copy[day] = [];
      if (copy[day].includes(hour)) {
        copy[day] = copy[day].filter(h => h !== hour);
      } else {
        copy[day] = [...copy[day], hour];
      }
      return copy;
    });
  };

  function computeRange(start: { dia: string; hora: string }, end: { dia: string; hora: string }) {
    const sd = DIAS_VISIBLES.indexOf(start.dia);
    const ed = DIAS_VISIBLES.indexOf(end.dia);
    const sh = HORAS.indexOf(start.hora);
    const eh = HORAS.indexOf(end.hora);
    return { minDay: Math.min(sd, ed), maxDay: Math.max(sd, ed), minHour: Math.min(sh, eh), maxHour: Math.max(sh, eh) };
  }

  function handleCellMouseDown(dia: string, hora: string) {
    isDragging.current = true;
    dragStart.current = { dia, hora };
    dragEnd.current = { dia, hora };
    setDragPreview({ minDay: DIAS_VISIBLES.indexOf(dia), maxDay: DIAS_VISIBLES.indexOf(dia), minHour: HORAS.indexOf(hora), maxHour: HORAS.indexOf(hora) });
  }

  function handleCellMouseEnter(dia: string, hora: string) {
    if (!isDragging.current || !dragStart.current) return;
    dragEnd.current = { dia, hora };
    setDragPreview(computeRange(dragStart.current, { dia, hora }));
  }

  function handleCellMouseUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragPreview(null);
    const start = dragStart.current;
    const end = dragEnd.current;
    if (!start || !end) return;
    dragStart.current = null;
    dragEnd.current = null;
    const range = computeRange(start, end);
    const isSimpleClick = start.dia === end.dia && start.hora === end.hora;
    if (isSimpleClick) { toggleHour(start.dia, start.hora); return; }
    const firstCellSelected = horario[start.dia]?.includes(start.hora) ?? false;
    const action = firstCellSelected ? 'deselect' : 'select';
    setHorario(prev => {
      const copy = { ...prev };
      for (let d = range.minDay; d <= range.maxDay; d++) {
        const dia = DIAS_VISIBLES[d];
        if (!copy[dia]) copy[dia] = [];
        for (let h = range.minHour; h <= range.maxHour; h++) {
          const hora = HORAS[h];
          if (action === 'select') { if (!copy[dia].includes(hora)) copy[dia] = [...copy[dia], hora]; }
          else { copy[dia] = copy[dia].filter(hr => hr !== hora); }
        }
      }
      return copy;
    });
  }

  const togglePerfil = (id: number) => {
    setSelectedPerfiles(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleEdit = (instructor: Instructor) => {
    setEditingId(instructor.id);
    setDocumento(instructor.documento);
    setNombres(instructor.nombres);
    setApellidos(instructor.apellidos);
    setTipoVinculacion(instructor.tipoVinculacion);
    setEstado(instructor.estado);
    setCentroFormacionId(instructor.centroFormacionId || "");
    setHorario(instructor.horario || {});
    setSelectedPerfiles(instructor.perfiles?.map((p: PerfilInfo) => p.id) || []);
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPerfiles.length === 0) return setError("Seleccione al menos un perfil");
    if (!centroFormacionId) return setError("Seleccione un centro de formación");
    setSaving(true);
    setError(null);

    const body: any = {
      documento, nombres, apellidos, tipoVinculacion, estado,
      centroFormacionId: Number(centroFormacionId),
      perfilIds: selectedPerfiles,
      requisitosAcademicos: selectedPerfiles.map(id => {
        const p = availablePerfiles.find(ap => ap.id === id);
        return p ? p.nombre : '';
      }).filter(Boolean)
    };
    if (Object.keys(horario).length > 0) body.horario = horario;

    try {
      let resp;
      if (editingId) {
        resp = await fetch(`/api/instructores/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al actualizar");
        showMessage("Instructor actualizado correctamente", "success");
      } else {
        resp = await fetch("/api/instructores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al registrar");
        showMessage("Instructor registrado correctamente", "success");
      }
      handleClose();
      fetchInstructores();
    } catch (e: any) {
      setError(e.message || "Error al registrar instructor");
    } finally {
      setSaving(false);
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
    <div className="max-w-full mx-auto space-y-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Instructores</h1>
        {mayCrear && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setDocumento(""); setNombres(""); setApellidos(""); setTipoVinculacion("PLANTA"); setEstado("ACTIVO"); setSelectedPerfiles([]); setCentroFormacionId(""); setHorario({}); setError(null); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
            <Plus className="w-4 h-4" /> Nuevo Instructor
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
              <th className="px-6 py-3 font-medium text-gray-500">Documento</th>
              <th className="px-6 py-3 font-medium text-gray-500">Nombre Completo</th>
              <th className="px-6 py-3 font-medium text-gray-500">Vinculación</th>
              <th className="px-6 py-3 font-medium text-gray-500">Centro</th>
              <th className="px-6 py-3 font-medium text-gray-500">Perfiles</th>
              {hayAcciones && <th className="px-6 py-3 font-medium text-gray-500 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
                <tr><td colSpan={hayAcciones ? 6 : 5} className="px-6 py-4 text-center text-gray-500">Cargando...</td></tr>
              ) : instructores.length === 0 ? (
                <tr><td colSpan={hayAcciones ? 6 : 5} className="px-6 py-4 text-center text-gray-500">No hay instructores registrados.</td></tr>
            ) : (
              instructores.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-gray-600">{a.documento}</td>
                  <td className="px-6 py-4 font-medium">{a.nombres} {a.apellidos}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{a.tipoVinculacion}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{centros.find(c => c.id === a.centroFormacionId)?.nombre || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(a.perfiles) && a.perfiles.map(p => (
                        <span key={p.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">{p.nombre}</span>
                      ))}
                      {(!a.perfiles || a.perfiles.length === 0) && Array.isArray(a.requisitosAcademicos) && a.requisitosAcademicos.map((r, i) => (
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
                          <button onClick={() => handleTrashClick(a.id)} className="text-gray-400 hover:text-red-600 transition p-1">
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
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
          onClick={handleClose}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar Instructor' : 'Nuevo Instructor'}</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                    <input type="text" value={documento} onChange={e => setDocumento(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                      <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                      <input type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vinculación</label>
                    <select value={tipoVinculacion} onChange={e => setTipoVinculacion(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="PLANTA">PLANTA</option>
                      <option value="CONTRATISTA">CONTRATISTA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Formación</label>
                    <select value={centroFormacionId} onChange={e => setCentroFormacionId(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" required>
                      <option value="">Seleccione un centro...</option>
                      {centros.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perfiles Académicos</label>
                    {availablePerfiles.length === 0 ? (
                      <div className="text-sm text-gray-500 py-2">No hay perfiles registrados. Cree perfiles desde la sección "Perfiles Académicos" primero.</div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2 bg-gray-50">
                        {availablePerfiles.map(p => (
                          <label key={p.id} className="flex items-start gap-2 cursor-pointer">
                            <input type="checkbox" className="mt-1"
                              checked={selectedPerfiles.includes(p.id)}
                              onChange={() => togglePerfil(p.id)}
                            />
                            <span className="text-sm text-gray-700">{p.nombre} <span className="text-gray-400 text-xs text-nowrap">({p.codigo})</span></span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                  {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={handleClose}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={saving}
                      className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50">
                      {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-3.5 h-3.5 inline mr-1" /> Disponibilidad Semanal
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Configure la disponibilidad horaria del instructor para definir cuándo puede ser programado en competencias y fichas mediante el módulo de programación.</p>
                  <div className="overflow-x-auto border rounded-lg bg-gray-50/50 select-none"
                    onMouseUp={handleCellMouseUp} onMouseLeave={handleCellMouseUp}>
                    <table className="w-full text-center border-collapse text-[10px]">
                      <thead>
                        <tr>
                          <th className="border p-1 bg-gray-100 text-gray-500 font-semibold min-w-[50px]">Hr</th>
                          {DIAS_VISIBLES.map(d => (
                            <th key={d} className="border p-1 bg-gray-100 text-gray-500 font-semibold min-w-[64px] uppercase">{d.substring(0, 3)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {HORAS.map((hora, rowIdx) => (
                          <tr key={rowIdx}>
                            <td className="border p-0.5 bg-gray-100 text-gray-400 font-mono text-[9px]">{hora.split('-')[0]}</td>
                            {DIAS_VISIBLES.map((dia, colIdx) => {
                              const isActive = horario[dia]?.includes(hora) ?? false;
                              const inPreview = dragPreview && colIdx >= dragPreview.minDay && colIdx <= dragPreview.maxDay && rowIdx >= dragPreview.minHour && rowIdx <= dragPreview.maxHour;
                              return (
                                <td key={dia + hora}
                                  className={`border p-0.5 cursor-pointer transition-colors ${isActive ? 'bg-indigo-200 border-indigo-300' : inPreview ? 'bg-indigo-100/50 border-dashed border-indigo-200' : 'hover:bg-indigo-50 bg-white'}`}
                                  onMouseDown={() => handleCellMouseDown(dia, hora)}
                                  onMouseEnter={() => handleCellMouseEnter(dia, hora)}
                                >
                                  {isActive && <div className="w-2 h-2 rounded-full bg-indigo-500 mx-auto" />}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pasoDialogo === 'dependencias'}
        title="Eliminar Instructor"
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
        title="Eliminar Instructor"
        message="¿Estás seguro de que deseas eliminar este instructor? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        danger
        onConfirm={() => { if (deletingId !== null) { handleDelete(deletingId); setDeletingId(null); } setPasoDialogo('ninguno'); }}
        onClose={() => { setDeletingId(null); setPasoDialogo('ninguno'); }}
      />
    </div>
  );
}
