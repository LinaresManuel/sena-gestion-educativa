import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Calendar, Clock, MapPin, Search, Pencil, Eye } from "lucide-react";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";
import ConfirmDialog from "./ConfirmDialog";
import SearchableSelect from "./SearchableSelect";

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [regionales, setRegionales] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dependencias, setDependencias] = useState<{ tipo: string; count: number; label: string; elimina: boolean }[] | null>(null);
  const [pasoDialogo, setPasoDialogo] = useState<'ninguno' | 'dependencias' | 'confirmar'>('ninguno');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filtroProgramaId, setFiltroProgramaId] = useState("");
  const [filtroRegionalId, setFiltroRegionalId] = useState("");
  const [filtroCentroId, setFiltroCentroId] = useState("");
  const [filtroAmbienteId, setFiltroAmbienteId] = useState("");
  const [vista, setVista] = useState<'cards' | 'tabla'>('cards');
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [detallesFicha, setDetallesFicha] = useState<Ficha | null>(null);

  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [horarioFichaSeleccionada, setHorarioFichaSeleccionada] = useState<Ficha | null>(null);

  const isDragging = useRef(false);
  const dragStart = useRef<{ dia: string; hora: string } | null>(null);
  const dragEnd = useRef<{ dia: string; hora: string } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ minDay: number; maxDay: number; minHour: number; maxHour: number } | null>(null);

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
    fetchRegionales();
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

  const fetchRegionales = async () => {
    const res = await fetch("/api/regionales");
    const data = await res.json();
    setRegionales(Array.isArray(data) ? data : []);
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

  function computeRange(start: { dia: string; hora: string }, end: { dia: string; hora: string }) {
    const sd = DIAS_VISIBLES.indexOf(start.dia);
    const ed = DIAS_VISIBLES.indexOf(end.dia);
    const sh = HORAS.indexOf(start.hora);
    const eh = HORAS.indexOf(end.hora);
    return {
      minDay: Math.min(sd, ed),
      maxDay: Math.max(sd, ed),
      minHour: Math.min(sh, eh),
      maxHour: Math.max(sh, eh),
    };
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

    if (isSimpleClick) {
      toggleHour(start.dia, start.hora);
      return;
    }

    const firstCellSelected = horario[start.dia]?.includes(start.hora) ?? false;
    const action = firstCellSelected ? 'deselect' : 'select';

    setHorario(prev => {
      const clone = { ...prev };
      for (let d = range.minDay; d <= range.maxDay; d++) {
        const dia = DIAS_VISIBLES[d];
        if (!clone[dia]) clone[dia] = [];
        for (let h = range.minHour; h <= range.maxHour; h++) {
          const hora = HORAS[h];
          if (action === 'select') {
            if (!clone[dia].includes(hora)) clone[dia] = [...clone[dia], hora];
          } else {
            clone[dia] = clone[dia].filter(hr => hr !== hora);
          }
        }
      }
      return clone;
    });
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

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function handleVerHorario(ficha: Ficha) {
    setHorarioFichaSeleccionada({
      ...ficha,
      horario: typeof ficha.horario === 'string' ? JSON.parse(ficha.horario) : ficha.horario,
    });
    setShowHorarioModal(true);
  }

  function handleRegionalChange(val: string) {
    setFiltroRegionalId(val);
    setFiltroCentroId("");
    setFiltroAmbienteId("");
  }

  function handleCentroChange(val: string) {
    setFiltroCentroId(val);
    setFiltroAmbienteId("");
  }

  const centrosFiltrados = centros.filter(c => !filtroRegionalId || c.regionalId === Number(filtroRegionalId));
  const ambientesFiltrados = ambientes.filter(a => !filtroCentroId || a.centroId === Number(filtroCentroId));

  function handleCloseHorarioModal() {
    setShowHorarioModal(false);
    setHorarioFichaSeleccionada(null);
  }

  function handleVerDetalles(ficha: Ficha) {
    setDetallesFicha({
      ...ficha,
      horario: typeof ficha.horario === 'string' ? JSON.parse(ficha.horario) : ficha.horario,
    });
    setShowDetallesModal(true);
  }

  function handleCloseDetallesModal() {
    setShowDetallesModal(false);
    setDetallesFicha(null);
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

  const fichasFiltradas = fichas.filter(f => {
    if (filtroProgramaId && f.programaId !== Number(filtroProgramaId)) return false;
    if (filtroRegionalId) {
      const c = centros.find(c => c.id === f.centroFormacionId);
      if (!c || c.regionalId !== Number(filtroRegionalId)) return false;
    }
    if (filtroCentroId && f.centroFormacionId !== Number(filtroCentroId)) return false;
    if (filtroAmbienteId && f.ambienteId !== Number(filtroAmbienteId)) return false;
    return true;
  });

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
        {mayCrear && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setNumeroFicha(""); setCentroFormacionId(""); setFechaInicio(""); setFechaFinLectiva(""); setFechaFin(""); setModalidad("PRESENCIAL"); setProgramaId(""); setAmbientesId(""); setHorario({}); setError(null); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
            <Plus className="w-4 h-4" /> Nueva Ficha
          </button>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-3">
        <div className="flex items-center flex-wrap gap-2 bg-gray-50/60 rounded-lg p-2 border border-gray-100 flex-1 min-w-0">
          <SearchableSelect
            value={filtroProgramaId}
            onChange={v => setFiltroProgramaId(v)}
            label="Programa"
            placeholder="Todos"
            options={[
              { value: "", label: "Todos" },
              ...programas.map(p => ({ value: String(p.id), label: p.denominacion })),
            ]}
          />
          <SearchableSelect
            value={filtroRegionalId}
            onChange={v => handleRegionalChange(v)}
            label="Regional"
            placeholder="Todas"
            options={[
              { value: "", label: "Todas" },
              ...regionales.map(r => ({ value: String(r.id), label: r.nombre })),
            ]}
          />
          <SearchableSelect
            value={filtroCentroId}
            onChange={v => handleCentroChange(v)}
            label="Centro"
            placeholder="Todos"
            options={[
              { value: "", label: "Todos" },
              ...centrosFiltrados.map(c => ({ value: String(c.id), label: c.nombre })),
            ]}
          />
          <SearchableSelect
            value={filtroAmbienteId}
            onChange={v => setFiltroAmbienteId(v)}
            label="Ambiente"
            placeholder="Todos"
            options={[
              { value: "", label: "Todos" },
              ...ambientesFiltrados.map(a => ({ value: String(a.id), label: a.nombre })),
            ]}
          />
          {(filtroProgramaId || filtroRegionalId || filtroCentroId || filtroAmbienteId) && (
            <button
              onClick={() => { setFiltroProgramaId(""); setFiltroRegionalId(""); setFiltroCentroId(""); setFiltroAmbienteId(""); }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-100 rounded-md transition shrink-0"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
          <button onClick={() => setVista('cards')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${vista === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            ⊞ Cards
          </button>
          <button onClick={() => setVista('tabla')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${vista === 'tabla' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            ⊟ Tabla
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        vista === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fichasFiltradas.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 bg-white p-12 rounded-xl border flex flex-col items-center justify-center text-gray-500">
                <Calendar className="w-12 h-12 mb-4 opacity-20" />
                <p>{filtroProgramaId ? "No hay fichas para el programa seleccionado" : "No hay fichas registradas"}</p>
              </div>
            ) : (
              fichasFiltradas.map(ficha => {
                const programa = programas.find(p => p.id === ficha.programaId);
                const centro = centros.find(c => c.id === ficha.centroFormacionId);
                const ambiente = ambientes.find(a => a.id === ficha.ambienteId);
                const fichaHorario = typeof ficha.horario === 'string' ? JSON.parse(ficha.horario) : ficha.horario;
                const tieneHorario = fichaHorario && Object.keys(fichaHorario).length > 0 && Object.values(fichaHorario).some((h: any) => Array.isArray(h) && h.length > 0);

                return (
                  <div key={ficha.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition p-4 flex flex-col h-full group">
                    {/* Ficha number + modalidad badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md">
                        Ficha {ficha.numeroFicha}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-lg ${
                        ficha.modalidad === 'VIRTUAL'
                          ? 'bg-blue-100 text-blue-700'
                          : ficha.modalidad === 'MIXTA'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-purple-100 text-purple-700'
                      }`}>
                        {ficha.modalidad === 'VIRTUAL' ? 'Virtual' : ficha.modalidad === 'MIXTA' ? 'Mixta' : 'Presencial'}
                      </span>
                    </div>

                    {/* Content area — flex-1 + flex-col + mt-auto pushes dates/location to bottom */}
                    <div className="flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Programa de Formación</p>
                          {programa?.tipoPrograma && (
                            <span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{programa.tipoPrograma}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 leading-snug text-sm line-clamp-2 break-words">
                          {programa ? programa.denominacion : 'Programa no encontrado'}
                        </h3>
                      </div>

                      <div className="mt-auto">
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-500 mr-1">Lectivo:</span>
                            <span>{formatDate(ficha.fechaInicio)} → {formatDate(ficha.fechaFinLectiva)}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-500 mr-1">Ficha:</span>
                            <span>{formatDate(ficha.fechaInicio)} → {formatDate(ficha.fechaFin)}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-500 mr-1">Centro:</span>
                            <span className="truncate">{centro ? centro.nombre : 'No asignado'}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-500 mr-1">Ambiente:</span>
                            <span className="truncate">{ambiente ? `${ambiente.nombre} (${ambiente.codigo})` : 'No asignado'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer — always visible */}
                    {(tieneHorario || hayAcciones) && (
                      <div className="border-t pt-3 flex items-center gap-2">
                        {tieneHorario && (
                          <button onClick={() => handleVerHorario(ficha)}
                            className="flex items-center gap-1 text-xs font-medium text-purple-700 hover:text-purple-800 transition">
                            <Eye className="w-3.5 h-3.5" /> Ver Horario
                          </button>
                        )}
                        {hayAcciones && (
                          <div className="flex items-center gap-1 ml-auto">
                            {mayEditar && (
                              <button onClick={() => handleEdit(ficha)}
                                className="text-gray-400 hover:text-purple-600 p-1.5 bg-white rounded-full shadow-sm border transition">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {mayEliminar && (
                              <button onClick={() => handleTrashClick(ficha.id)}
                                className="text-gray-400 hover:text-red-600 p-1.5 bg-white rounded-full shadow-sm border transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border">
            {fichasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mb-4 opacity-20" />
                <p>{filtroProgramaId ? "No hay fichas para el programa seleccionado" : "No hay fichas registradas"}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">N° Ficha</th>
                    <th className="px-4 py-3">Programa</th>
                    <th className="px-4 py-3">Modalidad</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fichasFiltradas.map(ficha => {
                    const programa = programas.find(p => p.id === ficha.programaId);
                    return (
                      <tr key={ficha.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{ficha.numeroFicha}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[300px] truncate" title={programa?.denominacion}>{programa?.denominacion ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-lg ${
                            ficha.modalidad === 'VIRTUAL'
                              ? 'bg-blue-100 text-blue-700'
                              : ficha.modalidad === 'MIXTA'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-purple-100 text-purple-700'
                          }`}>
                            {ficha.modalidad === 'VIRTUAL' ? 'Virtual' : ficha.modalidad === 'MIXTA' ? 'Mixta' : 'Presencial'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {mayEditar && (
                              <button onClick={() => handleEdit(ficha)}
                                className="text-gray-400 hover:text-purple-600 p-1.5 bg-white rounded-full shadow-sm border transition">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {mayEliminar && (
                              <button onClick={() => handleTrashClick(ficha.id)}
                                className="text-gray-400 hover:text-red-600 p-1.5 bg-white rounded-full shadow-sm border transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => handleVerDetalles(ficha)}
                              className="text-gray-400 hover:text-purple-600 p-1.5 bg-white rounded-full shadow-sm border transition">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )
      )}

      {showForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-start justify-center z-50 pt-8 overflow-y-auto"
          onClick={handleClose}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Editar Ficha' : 'Nueva Ficha'}</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- Columna izquierda: Datos --- */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Datos de la Ficha</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Número de Ficha</label>
                      <input value={numeroFicha} onChange={e => setNumeroFicha(e.target.value)} type="text"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition"
                        required placeholder="Ej: 2686861" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Modalidad</label>
                      <select value={modalidad} onChange={e => setModalidad(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition">
                        <option value="PRESENCIAL">Presencial</option>
                        <option value="VIRTUAL">Virtual</option>
                        <option value="MIXTA">Mixta</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Programa de Formación</label>
                    <select value={programaId} onChange={e => setProgramaId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition" required>
                      <option value="">Seleccione un programa...</option>
                      {programas.map(p => (
                        <option key={p.id} value={p.id}>{p.denominacion}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
                      <input value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} type="date"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fin Lectiva</label>
                      <input value={fechaFinLectiva} onChange={e => setFechaFinLectiva(e.target.value)} type="date"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fin Ficha</label>
                      <input value={fechaFin} onChange={e => setFechaFin(e.target.value)} type="date"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Centro de Formación</label>
                    <select value={centroFormacionId} onChange={e => setCentroFormacionId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition" required>
                      <option value="">Seleccione un centro...</option>
                      {centros.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ambiente de Formación</label>
                    <select value={ambienteId} onChange={e => setAmbientesId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition" required>
                      <option value="">Seleccione un ambiente...</option>
                      {ambientes.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* --- Columna derecha: Horario --- */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Horario de Formación</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Haga clic para seleccionar una celda o arrastre para seleccionar un rango rectangular.
                  </p>

                  <div
                    className="grid gap-0.5 select-none border rounded-lg p-1.5 bg-gray-50/50"
                    style={{ gridTemplateColumns: `32px repeat(6, 1fr)` }}
                    onMouseUp={handleCellMouseUp}
                    onMouseLeave={handleCellMouseUp}
                  >
                    <div />
                    {DIAS_VISIBLES.map(d => (
                      <div key={d} className="text-center text-[9px] font-semibold text-gray-600 leading-none pb-0.5">
                        {d.slice(0, 3)}
                      </div>
                    ))}

                    {HORAS.map(hora => {
                      const hourIdx = HORAS.indexOf(hora);
                      const inPreview = dragPreview !== null && hourIdx >= dragPreview.minHour && hourIdx <= dragPreview.maxHour;
                      return (
                        <div key={hora} className="contents">
                          <div className="text-[8px] text-gray-500 font-mono text-right flex items-center justify-end pr-1 leading-none">
                            {hora.split('-')[0]}
                          </div>
                          {DIAS_VISIBLES.map((dia, dayIdx) => {
                            const selected = horario[dia]?.includes(hora) ?? false;
                            const inRange = inPreview && dayIdx >= dragPreview!.minDay && dayIdx <= dragPreview!.maxDay;
                            return (
                              <div
                                key={`${dia}-${hora}`}
                                onMouseDown={() => handleCellMouseDown(dia, hora)}
                                onMouseEnter={() => handleCellMouseEnter(dia, hora)}
                                className={`rounded-sm border transition-all duration-75 cursor-pointer h-4
                                  ${inRange
                                    ? 'bg-purple-500/35 border-purple-500'
                                    : selected
                                      ? 'bg-purple-500/20 border-purple-400'
                                      : 'bg-white border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                                  }`}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">{error}</div>}
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                <button type="button" onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={saving || !numeroFicha.trim() || !centroFormacionId || !programaId || !ambienteId}
                  className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 transition">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHorarioModal && horarioFichaSeleccionada && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-start justify-center z-50 pt-12 overflow-y-auto"
          onClick={handleCloseHorarioModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10 rounded-t-xl">
              <h3 className="text-base font-semibold text-gray-900">Horario — Ficha {horarioFichaSeleccionada.numeroFicha}</h3>
              <button onClick={handleCloseHorarioModal} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <span><span className="font-medium text-gray-700">Programa:</span> {(() => {
                  const p = programas.find(pg => pg.id === horarioFichaSeleccionada.programaId);
                  return p ? p.denominacion : '—';
                })()}</span>
                <span><span className="font-medium text-gray-700">Ambiente:</span> {(() => {
                  const a = ambientes.find(am => am.id === horarioFichaSeleccionada.ambienteId);
                  return a ? `${a.nombre} (${a.codigo})` : '—';
                })()}</span>
              </div>

              <div
                className="grid gap-0.5 select-none border rounded-lg p-1.5 bg-gray-50/50"
                style={{ gridTemplateColumns: `32px repeat(6, 1fr)` }}
              >
                <div />
                {DIAS_VISIBLES.map(d => (
                  <div key={d} className="text-center text-[9px] font-semibold text-gray-600 leading-none pb-0.5">
                    {d.slice(0, 3)}
                  </div>
                ))}

                {HORAS.map(hora => (
                  <div key={hora} className="contents">
                    <div className="text-[8px] text-gray-500 font-mono text-right flex items-center justify-end pr-1 leading-none">
                      {hora.split('-')[0]}
                    </div>
                    {DIAS_VISIBLES.map(dia => {
                      const selected = horarioFichaSeleccionada.horario[dia]?.includes(hora) ?? false;
                      return (
                        <div
                          key={`${dia}-${hora}`}
                          className={`rounded-sm border h-4 ${selected
                            ? 'bg-purple-500/20 border-purple-400'
                            : 'bg-white border-gray-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end p-4 border-t">
              <button onClick={handleCloseHorarioModal}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetallesModal && detallesFicha && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-start justify-center z-50 pt-8 overflow-y-auto"
          onClick={handleCloseDetallesModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Detalles — Ficha {detallesFicha.numeroFicha}</h3>
              <button onClick={handleCloseDetallesModal} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Datos de la Ficha</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Número de Ficha</label>
                      <span className="block text-sm text-gray-900 px-3 py-2 bg-gray-50/50 rounded-lg border">{detallesFicha.numeroFicha}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Modalidad</label>
                      <span className="block text-sm text-gray-900 px-3 py-2 bg-gray-50/50 rounded-lg border">{detallesFicha.modalidad === 'VIRTUAL' ? 'Virtual' : detallesFicha.modalidad === 'MIXTA' ? 'Mixta' : 'Presencial'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Programa de Formación</label>
                    <span className="block text-sm text-gray-900 px-3 py-2 bg-gray-50/50 rounded-lg border">{(() => {
                      const p = programas.find(pg => pg.id === detallesFicha.programaId);
                      return p ? p.denominacion : '—';
                    })()}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
                      <span className="block text-sm text-gray-900 px-3 py-2 bg-gray-50/50 rounded-lg border">{formatDate(detallesFicha.fechaInicio)}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fin Lectiva</label>
                      <span className="block text-sm text-gray-900 px-3 py-2 bg-gray-50/50 rounded-lg border">{formatDate(detallesFicha.fechaFinLectiva)}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fin Ficha</label>
                      <span className="block text-sm text-gray-900 px-3 py-2 bg-gray-50/50 rounded-lg border">{formatDate(detallesFicha.fechaFin)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Centro de Formación</label>
                    <span className="block text-sm text-gray-900 px-3 py-2 bg-gray-50/50 rounded-lg border">{(() => {
                      const c = centros.find(ct => ct.id === detallesFicha.centroFormacionId);
                      return c ? c.nombre : '—';
                    })()}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ambiente de Formación</label>
                    <span className="block text-sm text-gray-900 px-3 py-2 bg-gray-50/50 rounded-lg border">{(() => {
                      const a = ambientes.find(am => am.id === detallesFicha.ambienteId);
                      return a ? `${a.nombre} (${a.codigo})` : '—';
                    })()}</span>
                  </div>
                </div>

                {/* Right: horario grid */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Horario de Formación</h4>

                  <div
                    className="grid gap-0.5 select-none border rounded-lg p-1.5 bg-gray-50/50"
                    style={{ gridTemplateColumns: `32px repeat(6, 1fr)` }}
                  >
                    <div />
                    {DIAS_VISIBLES.map(d => (
                      <div key={d} className="text-center text-[9px] font-semibold text-gray-600 leading-none pb-0.5">
                        {d.slice(0, 3)}
                      </div>
                    ))}

                    {HORAS.map(hora => (
                      <div key={hora} className="contents">
                        <div className="text-[8px] text-gray-500 font-mono text-right flex items-center justify-end pr-1 leading-none">
                          {hora.split('-')[0]}
                        </div>
                        {DIAS_VISIBLES.map(dia => {
                          const selected = detallesFicha.horario[dia]?.includes(hora) ?? false;
                          return (
                            <div
                              key={`${dia}-${hora}`}
                              className={`rounded-sm border h-4 ${selected
                                ? 'bg-purple-500/20 border-purple-400'
                                : 'bg-white border-gray-200'
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-5 border-t">
              <button onClick={handleCloseDetallesModal}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                Cerrar
              </button>
            </div>
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
