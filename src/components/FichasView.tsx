import { useState, useEffect } from "react";
import { Plus, Trash2, X, Calendar, Clock, MapPin, Search, Pencil } from "lucide-react";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";

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

const DIAS_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

const HORAS = Array.from({ length: 16 }, (_, i) => {
  const start = i + 6;
  const end = start + 1;
  return `${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:00`;
});

export default function FichasView() {
  const mayCrear = useHasPermission('fichas.crear');
  const mayEditar = useHasPermission('fichas.editar');
  const mayEliminar = useHasPermission('fichas.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);

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

  const toggleDay = (day: string) => {
    setHorario(prev => {
      const clone = { ...prev };
      if (clone[day]) {
        delete clone[day];
      } else {
        clone[day] = [];
      }
      return clone;
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroFicha || !centroFormacionId || !fechaInicio || !fechaFinLectiva || !fechaFin || !programaId || !ambienteId) {
      return showMessage("Todos los campos son obligatorios", "error");
    }
    
    if (Object.keys(horario).length === 0 || Object.values(horario).every(h => h.length === 0)) {
      return showMessage("Debe seleccionar al menos un día y una hora", "error");
    }

    try {
      let resp;
      if (editingId) {
        resp = await fetch(`/api/fichas/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numeroFicha,
            centroFormacionId: Number(centroFormacionId),
            fechaInicio,
            fechaFinLectiva,
            fechaFin,
            modalidad,
            programaId: Number(programaId),
            ambienteId: Number(ambienteId),
            horario
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Error al actualizar");
        showMessage("Ficha actualizada correctamente", "success");
        setEditingId(null);
      } else {
        resp = await fetch("/api/fichas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numeroFicha,
            centroFormacionId: Number(centroFormacionId),
            fechaInicio,
            fechaFinLectiva,
            fechaFin,
            modalidad,
            programaId: Number(programaId),
            ambienteId: Number(ambienteId),
            horario
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Error al registrar");
        showMessage("Ficha registrada correctamente", "success");
      }
      setNumeroFicha("");
      setCentroFormacionId("");
      setFechaInicio("");
      setFechaFinLectiva("");
      setFechaFin("");
      setModalidad("PRESENCIAL");
      setProgramaId("");
      setAmbientesId("");
      setHorario({});
      fetchFichas();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al registrar la ficha", "error");
    }
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

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-md shadow-lg fixed top-4 right-4 z-50 flex items-center justify-between min-w-[300px] border ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gestión de Fichas</h1>
          <p className="text-sm text-gray-500 mt-1">Crea y coordina las fichas de formación con su respectivo horario y ambiente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(mayCrear || mayEditar) && (
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">{editingId ? "Editar Ficha" : "Nueva Ficha"}</h2>
                {editingId && (
                  <button type="button" onClick={() => {
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
                  }} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Ficha</label>
                <input required value={numeroFicha} onChange={e => setNumeroFicha(e.target.value)} type="text" className="w-full px-3 py-2 border rounded-md" placeholder="Ej: 2686861" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programa de Formación</label>
                <select required value={programaId} onChange={e => setProgramaId(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white">
                  <option value="">Seleccione un programa...</option>
                  {programas.map(p => (
                    <option key={p.id} value={p.id}>{p.denominacion} ({p.codigo} - v{p.version})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                <select value={modalidad} onChange={e => setModalidad(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white">
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="MIXTA">Mixta</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input required value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} type="date" className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin (Lectiva)</label>
                  <input required value={fechaFinLectiva} onChange={e => setFechaFinLectiva(e.target.value)} type="date" className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin (Ficha)</label>
                  <input required value={fechaFin} onChange={e => setFechaFin(e.target.value)} type="date" className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Formación</label>
                <select required value={centroFormacionId} onChange={e => setCentroFormacionId(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white">
                  <option value="">Seleccione un centro...</option>
                  {centros.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente de Formación</label>
                <select required value={ambienteId} onChange={e => setAmbientesId(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white">
                  <option value="">Seleccione un ambiente...</option>
                  {ambientes.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">El sistema verificará la disponibilidad del ambiente en las fechas y horarios seleccionados.</p>
              </div>

              <div className="border-t pt-4 mt-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Horario de Formación</label>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">1. Seleccione los días</p>
                    <div className="flex flex-wrap gap-2">
                      {DIAS_SEMANA.map(dia => (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => toggleDay(dia)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${horario[dia] !== undefined ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                          {dia.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {Object.keys(horario).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">2. Seleccione las horas por día</p>
                      <div className="space-y-3">
                        {DIAS_SEMANA.filter(dia => horario[dia] !== undefined).map(dia => (
                          <div key={dia} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-xs font-medium text-gray-700 mb-2">{dia}</p>
                            <div className="grid grid-cols-3 gap-2">
                              {HORAS.map(hora => (
                                <label key={hora} className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    checked={horario[dia].includes(hora)}
                                    onChange={() => toggleHour(dia, hora)}
                                  />
                                  <span className="text-[10px] text-gray-600">{hora}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button type="submit" className="w-full mt-6 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2">
                {editingId ? "Actualizar Ficha" : <><Plus className="w-4 h-4" /> Registrar Ficha</>}
              </button>
            </form>
          </div>
        )}

        <div className={(mayCrear || mayEditar) ? "lg:col-span-2" : "lg:col-span-3"}>
          {loading ? (
            <div className="bg-white p-12 rounded-xl border flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fichas.length === 0 ? (
                <div className="md:col-span-2 bg-white p-12 rounded-xl border flex flex-col items-center justify-center text-gray-500">
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p>No hay fichas registradas</p>
                </div>
              ) : (
                fichas.map(ficha => {
                  const programa = programas.find(p => p.id === ficha.programaId);
                  const ambiente = ambientes.find(a => a.id === ficha.ambienteId);
                  const fichaHorario = typeof ficha.horario === 'string' ? JSON.parse(ficha.horario) : ficha.horario;

                  return (
                    <div key={ficha.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition p-5 relative overflow-hidden group">
                      {hayAcciones && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          {mayEditar && (
                            <button onClick={() => {
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
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} className="text-gray-400 hover:text-purple-600 p-1 bg-white rounded-full shadow-sm">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {mayEliminar && (
                            <button onClick={() => handleDelete(ficha.id)} className="text-gray-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm">
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
        </div>
      </div>
    </div>
  );
}
