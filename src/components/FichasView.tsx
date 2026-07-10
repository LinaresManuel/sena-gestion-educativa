import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Calendar, Clock, MapPin, Search, Pencil } from "lucide-react";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";
import ConfirmDialog from "./ConfirmDialog";

interface Ficha {
  id: number;
  numeroFicha: string;
  centroFormacionId: number;
  fechaInicio: string;
  fechaFinLectiva: string;
  fechaFin: string;
  modalidad: string;
  horario: any;
  programaId: number;
  ambienteId: number;
}

const DIAS_VISIBLES = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

const HORAS = Array.from({ length: 15 }, (_, i) => {
  const start = i + 6;
  const end = start + 1;
  return `${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:00`;
});

export default function FichasView() {
  const mayCrear = useHasPermission('fichas.crear');
  const mayEditar = useHasPermission('fichas.editar');
  const mayEliminar = useHasPermission('fichas.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dependencias, setDependencias] = useState<{ tipo: string; count: number; label: string; elimina: boolean }[] | null>(null);
  const [pasoDialogo, setPasoDialogo] = useState<'ninguno' | 'dependencias' | 'confirmar'>('ninguno');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filtroProgramaId, setFiltroProgramaId] = useState("");

  const isDragging = useRef(false);
  const dragAction = useRef<'select' | 'deselect' | null>(null);

  // Form State
  const [numeroFicha, setNumeroFicha] = useState("");
  const [centroFormacionId, setCentroFormacionId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinLectiva, setFechaFinLectiva] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [modalidad, setModalidad] = useState("PRESENCIAL");
  const [programaId, setProgramaId] = useState("");
  const [ambienteId, setAmbientesId] = useState("");

  // { "LUNES": ["06:00-07:00"], ... }
  const [horario, setHorario] = useState<{[key: string]: string[]}>({});

  useEffect(() => {
    fetchFichas();
    fetchCentros();
    fetchProgramas();
    fetchAmbientes();
  }, []);

  const fetchFichas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/fichas");
      const data = await res.json();
      setFichas(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCentros = async () => {
    const res = await fetch("/api/centros");
    const data = await res.json();
    setCentros(Array.isArray(data) ? data : []);
  };

  const fetchProgramas = async () => {
    const res = await fetch("/api/programas");
    const data = await res.json();
    setProgramas(Array.isArray(data) ? data : []);
  };

  const fetchAmbientes = async () => {
    const res = await fetch("/api/ambientes");
    const data = await res.json();
    setAmbientes(Array.isArray(data) ? data : []);
  };

  const showMessage = (text: string, type: 'error' | 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTrashClick = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dependencias/fichas/${id}`);
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

  const toggleHour = (day: string, hour: string) => {
    setHorario(prev => {
      const clone = { ...prev };
      if (!clone[day]) clone[day] = [];
      if (clone[day].includes(hour)) {
        clone[day] = clone[day].filter(h => h !== hour);
      } else {
        clone[day] = [...clone[day], hour];
      }
      return clone;
    });
  };

  function handleCellMouseDown(dia: string, hora: string) {
    const currentlySelected = horario[dia]?.includes(hora) ?? false;
    dragAction.current = currentlySelected ? 'deselect' : 'select';
    isDragging.current = true;
    toggleHour(dia, hora);
  }

  function handleCellMouseEnter(dia: string, hora: string) {
    if (!isDragging.current) return;
    const targetState = dragAction.current === 'select';
    const isCurrently = horario[dia]?.includes(hora) ?? false;
    if (isCurrently !== targetState) toggleHour(dia, hora);
  }

  function handleClose() {
    setShowForm(false);
    setEditingId(null);
    setNumeroFicha("");
    setCentroFormacionId("");
    setFechaInicio("");
    setFechaFinLectiva("");
    setFechaFin("");
    setModalidad("PRESENCIAL");
    setProgramaId("");
    setAmbientesId("");
    setHorario({});
    setError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroFicha || !centroFormacionId || !fechaInicio || !fechaFinLectiva || !fechaFin || !programaId || !ambienteId) {
      return setError("Todos los campos son obligatorios");
    }

    if (Object.keys(horario).length === 0 || Object.values(horario).every(h => h.length === 0)) {
      return setError("Debe seleccionar al menos un día y una hora");
    }

    setSaving(true);
    setError(null);

    try {
      let resp;
      const body = {
        numeroFicha,
        centroFormacionId: Number(centroFormacionId),
        fechaInicio,
        fechaFinLectiva,
        fechaFin,
        modalidad,
        programaId: Number(programaId),
        ambienteId: Number(ambienteId),
        horario
      };

      if (editingId) {
        resp = await fetch(`/api/fichas/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Error al actualizar");
        showMessage("Ficha actualizada correctamente", "success");
      } else {
        resp = await fetch("/api/fichas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Error al registrar");
        showMessage("Ficha registrada correctamente", "success");
      }
      handleClose();
      fetchFichas();
    } catch (e: any) {
      setError(e.message || "Error al guardar la ficha");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ficha: Ficha) => {
    setEditingId(ficha.id);
    setNumeroFicha(ficha.numeroFicha);
    setCentroFormacionId(String(ficha.centroFormacionId));
    setFechaInicio(ficha.fechaInicio);
    setFechaFinLectiva(ficha.fechaFinLectiva);
    setFechaFin(ficha.fechaFin);
    setModalidad(ficha.modalidad);
    setProgramaId(String(ficha.programaId));
    setAmbientesId(String(ficha.ambienteId));
    setHorario(typeof ficha.horario === 'string' ? JSON.parse(ficha.horario) : ficha.horario || {});
    setError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const resp = await fetch(`/api/fichas/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al borrar");
      showMessage("Ficha eliminada", "success");
      fetchFichas();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message, "error");
    }
  };

  const fichasFiltradas = fichas.filter(f =>
    !filtroProgramaId || f.programaId === Number(filtroProgramaId)
  );

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-md shadow-lg fixed top-4 right-4 z-50 flex items-center justify-between min-w-[300px] border ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gestión de Fichas</h1>
          <p className="text-sm text-gray-500 mt-1">Crea y coordina las fichas de formación con su respectivo horario y ambiente.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Programa:</label>
            <select value={filtroProgramaId} onChange={e => setFiltroProgramaId(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm bg-white">
              <option value="">Todos</option>
              {programas.map(p => (
                <option key={p.id} value={p.id}>{p.denominacion}</option>
              ))}
            </select>
          </div>
          {mayCrear && (
            <button onClick={() => { setShowForm(true); setEditingId(null); setNumeroFicha(""); setCentroFormacionId(""); setFechaInicio(""); setFechaFinLectiva(""); setFechaFin(""); setModalidad("PRESENCIAL"); setProgramaId(""); setAmbientesId(""); setHorario({}); setError(null); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
              <Plus className="w-4 h-4" /> Nueva Ficha
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fichasFiltradas.length === 0 ? (
            <div className="md:col-span-2 bg-white p-12 rounded-xl border flex flex-col items-center justify-center text-gray-500">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <p>{filtroProgramaId ? "No hay fichas para el programa seleccionado" : "No hay fichas registradas"}</p>
            </div>
          ) : (
            fichasFiltradas.map(ficha => {
              const programa = programas.find(p => p.id === ficha.programaId);
              const ambiente = ambientes.find(a => a.id === ficha.ambienteId);
              const fichaHorario = typeof ficha.horario === 'string' ? JSON.parse(ficha.horario) : ficha.horario;

              return (
                <div key={ficha.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition p-5 relative overflow-hidden group">
                  {hayAcciones && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      {mayEditar && (
                        <button onClick={() => handleEdit(ficha)} className="text-gray-400 hover:text-purple-600 p-1 bg-white rounded-full shadow-sm">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {mayEliminar && (
                        <button onClick={() => handleTrashClick(ficha.id)} className="text-gray-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md mb-2">
                        Ficha {ficha.numeroFicha}
                      </span>
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        {programa ? programa.denominacion : 'Programa no encontrado'}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex flex-col text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                        <span><span className="font-medium mr-1 text-xs">Lectiva:</span> {ficha.fechaInicio} a {ficha.fechaFinLectiva}</span>
                      </div>
                      <div className="flex items-center pl-6">
                        <span className="text-xs text-gray-500"><span className="font-medium mr-1">Ficha:</span> {ficha.fechaInicio} a {ficha.fechaFin}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                      <span className="truncate">{ambiente ? `${ambiente.nombre} (${ambiente.codigo})` : 'Ambiente no encontrado'}</span>
                    </div>

                    <div className="pt-3 mt-3 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-2">Horario ({ficha.modalidad})</p>
                      <div className="space-y-1">
                        {Object.entries(fichaHorario).map(([dia, horas]: any) => (
                          horas.length > 0 && (
                            <div key={dia} className="flex items-start text-xs text-gray-600">
                              <span className="font-medium w-16">{dia.slice(0, 3)}:</span>
                              <span className="flex-1 truncate" title={horas.join(', ')}>{horas.join(', ')}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-start justify-center z-50 pt-8 overflow-y-auto"
          onClick={handleClose}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10 rounded-t-xl">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar Ficha' : 'Nueva Ficha'}</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Ficha</label>
                  <input value={numeroFicha} onChange={e => setNumeroFicha(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-2 text-sm" required placeholder="Ej: 2686861" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                  <select value={modalidad} onChange={e => setModalidad(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="VIRTUAL">Virtual</option>
                    <option value="MIXTA">Mixta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programa de Formación</label>
                <select value={programaId} onChange={e => setProgramaId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" required>
                  <option value="">Seleccione un programa...</option>
                  {programas.map(p => (
                    <option key={p.id} value={p.id}>{p.denominacion} ({p.codigo} - v{p.version})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} type="date" className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin (Lectiva)</label>
                  <input value={fechaFinLectiva} onChange={e => setFechaFinLectiva(e.target.value)} type="date" className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin (Ficha)</label>
                  <input value={fechaFin} onChange={e => setFechaFin(e.target.value)} type="date" className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Formación</label>
                  <select value={centroFormacionId} onChange={e => setCentroFormacionId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" required>
                    <option value="">Seleccione un centro...</option>
                    {centros.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente de Formación</label>
                  <select value={ambienteId} onChange={e => setAmbientesId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" required>
                    <option value="">Seleccione un ambiente...</option>
                    {ambientes.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-bold text-gray-800 mb-3">Horario de Formación</label>
                <p className="text-xs text-gray-500 mb-3">Haga clic o arrastre sobre las celdas para seleccionar los bloques horarios.</p>

                <div
                  className="grid gap-1.5 overflow-x-auto select-none"
                  style={{ gridTemplateColumns: `70px repeat(6, 1fr)` }}
                  onMouseUp={() => { isDragging.current = false; }}
                  onMouseLeave={() => { isDragging.current = false; }}
                >
                  <div />
                  {DIAS_VISIBLES.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-600 py-2">
                      {d.slice(0, 3)}
                    </div>
                  ))}

                  {HORAS.map(hora => (
                    <div key={hora} className="contents">
                      <div className="text-[11px] text-gray-500 font-mono pr-2 text-right flex items-center justify-end h-8">
                        {hora.split('-')[0]}
                      </div>
                      {DIAS_VISIBLES.map(dia => {
                        const selected = horario[dia]?.includes(hora) ?? false;
                        return (
                          <div
                            key={`${dia}-${hora}`}
                            onMouseDown={() => handleCellMouseDown(dia, hora)}
                            onMouseEnter={() => handleCellMouseEnter(dia, hora)}
                            className={`rounded-lg border-2 transition-all duration-100 cursor-pointer h-8
                              ${selected
                                ? 'bg-purple-500/20 border-purple-400 shadow-sm'
                                : 'bg-gray-50/80 border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                              }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving || !numeroFicha.trim() || !centroFormacionId || !programaId || !ambienteId}
                  className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pasoDialogo === 'dependencias'}
        title="Eliminar Ficha"
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
        title="Eliminar Ficha"
        message="¿Estás seguro de que deseas eliminar esta ficha? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        danger
        onConfirm={() => { if (deletingId !== null) { handleDelete(deletingId); setDeletingId(null); } setPasoDialogo('ninguno'); }}
        onClose={() => { setDeletingId(null); setPasoDialogo('ninguno'); }}
      />
    </div>
  );
}
