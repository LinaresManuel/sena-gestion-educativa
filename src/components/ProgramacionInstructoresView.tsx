import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, Trash2, X, Save, Layers, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useHasPermission } from "../lib/auth-context";
import ConfirmDialog from "./ConfirmDialog";
import SearchableSelect from "./SearchableSelect";

const DIAS_EN_ESP = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const DIAS_VISIBLES = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const HORAS = Array.from({ length: 16 }, (_, i) => {
  const start = i + 6;
  const end = start + 1;
  return `${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:00`;
});

interface Evento {
  id: number;
  programacionId: number;
  fecha: string;
  horaInicio: number;
  resultadoId: number;
  instructorId: number;
  ambienteId: number;
  estado: string;
  resultadoCodigo?: string;
  resultadoNombre?: string;
  instructorNombre?: string;
  instructorApellido?: string;
  competenciaId?: number;
}

interface DraftCell {
  resultadoId: number;
  instructorId: number;
  ambienteId: number;
}

export default function ProgramacionInstructoresView() {
  const mayCrear = useHasPermission('programacion.crear');
  const mayEditar = useHasPermission('programacion.editar');
  const mayEliminar = useHasPermission('programacion.eliminar');

  const [regionales, setRegionales] = useState<any[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [instructores, setInstructores] = useState<any[]>([]);
  const [allResultados, setAllResultados] = useState<any[]>([]);
  const [competencias, setCompetencias] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);

  const [regionalId, setRegionalId] = useState("");
  const [centroId, setCentroId] = useState("");
  const [fichaId, setFichaId] = useState("");
  const [competenciaId, setCompetenciaId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [selectedRAs, setSelectedRAs] = useState<number[]>([]);
  const [activeRAId, setActiveRAId] = useState<number | null>(null);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const t = new Date();
    const day = t.getDay();
    const diff = t.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(t.setDate(diff));
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  });

  const [savedEvents, setSavedEvents] = useState<Evento[]>([]);
  const [draftCells, setDraftCells] = useState<Map<string, DraftCell>>(new Map());
  const [conflictCells, setConflictCells] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);

  const isDragging = useRef(false);
  const dragStart = useRef<{ colIdx: number; rowIdx: number } | null>(null);
  const dragEnd = useRef<{ colIdx: number; rowIdx: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ minCol: number; maxCol: number; minRow: number; maxRow: number } | null>(null);

  const showMessage = useCallback((text: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [regRes, cenRes, ficRes, progRes, insRes, resRes] = await Promise.all([
          fetch("/api/regionales"), fetch("/api/centros"), fetch("/api/fichas"),
          fetch("/api/programas"), fetch("/api/instructores"), fetch("/api/resultados"),
        ]);
        setRegionales(await regRes.json());
        setCentros(await cenRes.json());
        setFichas(await ficRes.json());
        setProgramas(await progRes.json());
        setInstructores(await insRes.json());
        setAllResultados(await resRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const fichasFiltradas = fichas.filter(f => {
    if (centroId && f.centroFormacionId !== Number(centroId)) return false;
    return true;
  });

  const currentFicha = fichas.find(f => f.id === Number(fichaId));
  const fichaHorario: Record<string, string[]> = currentFicha?.horario ?? {};
  const fichaProgramaId = currentFicha?.programaId;
  const fichaCentroId = currentFicha?.centroFormacionId;
  const fichaAmbienteId = currentFicha?.ambienteId;

  useEffect(() => {
    if (!fichaProgramaId) { setCompetencias([]); setCompetenciaId(""); return; }
    fetch(`/api/programas/${fichaProgramaId}/competencias`)
      .then(r => r.json()).then(data => { setCompetencias(data); setCompetenciaId(""); });
  }, [fichaProgramaId]);

  useEffect(() => {
    if (!competenciaId) { setResultados([]); setInstructorId(""); setSelectedRAs([]); setActiveRAId(null); return; }
    Promise.all([
      fetch(`/api/competencias/${competenciaId}/resultados`).then(r => r.json()),
    ]).then(([ras]) => { setResultados(ras); setInstructorId(""); setSelectedRAs([]); setActiveRAId(null); });
  }, [competenciaId]);

  const perfilesCompatibles = (() => {
    if (!competenciaId) return [];
    const perfIds = new Set<number>();
    instructores.forEach(inst => {
      if (Array.isArray(inst.perfiles)) inst.perfiles.forEach((p: any) => perfIds.add(p.id));
    });
    return Array.from(perfIds);
  })();

  const instructoresFiltrados = instructores.filter(inst => {
    if (fichaCentroId && inst.centroFormacionId !== fichaCentroId) return false;
    return true;
  });

  useEffect(() => {
    if (!fichaId) { setSavedEvents([]); return; }
    fetch(`/api/programacion-eventos/ficha/${fichaId}`)
      .then(r => r.json())
      .then(grouped => {
        const flat: Evento[] = [];
        Object.values(grouped).forEach((hours: any) => {
          Object.values(hours).forEach((ev: any) => flat.push(ev));
        });
        setSavedEvents(flat);
      })
      .catch(() => setSavedEvents([]));
  }, [fichaId]);

  const weekDates: Date[] = [];
  if (currentWeekStart) {
    const [y, m, d] = currentWeekStart.split('-').map(Number);
    const monday = new Date(y, m - 1, d);
    for (let i = 0; i < 6; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
  }

  const uniqueHours = Array.from({ length: 16 }, (_, i) => i + 6);

  const dateToKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cellKey = (fecha: string, hora: number) => `${fecha}-${hora}`;

  const getEventAtCell = (fecha: string, hora: number): Evento | undefined =>
    savedEvents.find(e => e.fecha === fecha && e.horaInicio === hora);

  const getDraftAtCell = (fecha: string, hora: number): DraftCell | undefined =>
    draftCells.get(cellKey(fecha, hora));

  const isConflict = (fecha: string, hora: number) => conflictCells.has(cellKey(fecha, hora));

  const countHoursForRA = (raId: number) => {
    let count = 0;
    savedEvents.forEach(e => { if (e.resultadoId === raId) count++; });
    draftCells.forEach((v) => { if (v.resultadoId === raId) count++; });
    return count;
  };

  const selectedComp = competencias.find(c => c.id === Number(competenciaId));

  function handleMouseDown(colIdx: number, rowIdx: number) {
    if (!mayCrear || !fichaId || !instructorId || !activeRAId) return;
    isDragging.current = true;
    dragStart.current = { colIdx, rowIdx };
    dragEnd.current = { colIdx, rowIdx };
    setDragPreview({ minCol: colIdx, maxCol: colIdx, minRow: rowIdx, maxRow: rowIdx });
  }

  function handleMouseEnter(colIdx: number, rowIdx: number) {
    if (!isDragging.current || !dragStart.current) return;
    dragEnd.current = { colIdx, rowIdx };
    setDragPreview({
      minCol: Math.min(dragStart.current.colIdx, colIdx),
      maxCol: Math.max(dragStart.current.colIdx, colIdx),
      minRow: Math.min(dragStart.current.rowIdx, rowIdx),
      maxRow: Math.max(dragStart.current.rowIdx, rowIdx),
    });
  }

  function handleMouseUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    const preview = dragPreview;
    setDragPreview(null);
    dragStart.current = null;
    dragEnd.current = null;
    if (!preview || !activeRAId || !instructorId || !fichaAmbienteId) return;

    const newDraft = new Map(draftCells);
    const newConflicts = new Set(conflictCells);

    for (let c = preview.minCol; c <= preview.maxCol; c++) {
      for (let r = preview.minRow; r <= preview.maxRow; r++) {
        const date = weekDates[c];
        if (!date) continue;
        const hora = uniqueHours[r];
        if (hora === undefined) continue;
        const fecha = dateToKey(date);
        const key = cellKey(fecha, hora);
        if (getEventAtCell(fecha, hora)) continue;
        const dayName = DIAS_EN_ESP[date.getDay()];
        const slotStr = fichaHorario[dayName]?.find((s: string) => parseInt(s.split('-')[0], 10) === hora);
        if (!slotStr) continue;

        const instructorConflict = savedEvents.some(e => e.instructorId === Number(instructorId) && e.fecha === fecha && e.horaInicio === hora);
        const ambienteConflict = savedEvents.some(e => e.ambienteId === fichaAmbienteId && e.fecha === fecha && e.horaInicio === hora);
        if (instructorConflict || ambienteConflict) {
          newConflicts.add(key);
        } else {
          newDraft.set(key, { resultadoId: activeRAId, instructorId: Number(instructorId), ambienteId: fichaAmbienteId });
        }
      }
    }
    setDraftCells(newDraft);
    setConflictCells(newConflicts);
  }

  const handleSave = async () => {
    if (draftCells.size === 0) return;
    if (!fichaId || !competenciaId || !instructorId) return;
    setSaving(true);
    try {
      const progResp = await fetch("/api/programacion-instructores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programaId: fichaProgramaId, fichaId: Number(fichaId),
          competenciaId: Number(competenciaId), instructorId: Number(instructorId),
          resultadosIds: selectedRAs,
        }),
      });
      if (!progResp.ok) throw new Error("Error creando programación");
      const prog = await progResp.json();

      const eventos = Array.from(draftCells.entries()).map(([key, val]) => {
        const [fecha, horaStr] = key.split('-');
        const horaParts = fecha.split('-');
        return {
          fecha: `${horaParts[0]}-${horaParts[1]}-${horaParts[2]}`,
          horaInicio: val.resultadoId ? parseInt(horaStr) : 0,
          resultadoId: val.resultadoId,
          instructorId: val.instructorId,
          ambienteId: val.ambienteId,
        };
      });

      const eventosFormatted = Array.from(draftCells.entries()).map(([key, val]) => {
        const parts = key.split('-');
        return {
          fecha: `${parts[0]}-${parts[1]}-${parts[2]}`,
          horaInicio: Number(parts[3]),
          resultadoId: val.resultadoId,
          instructorId: val.instructorId,
          ambienteId: val.ambienteId,
        };
      });

      const evResp = await fetch("/api/programacion-eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programacionId: prog.id, eventos: eventosFormatted }),
      });
      if (!evResp.ok) {
        const err = await evResp.json();
        throw new Error(err.conflictos?.join("; ") || err.error || "Error guardando eventos");
      }
      setDraftCells(new Map());
      setConflictCells(new Set());
      showMessage("Programación guardada correctamente", "success");
      const grouped = await fetch(`/api/programacion-eventos/ficha/${fichaId}`).then(r => r.json());
      const flat: Evento[] = [];
      Object.values(grouped).forEach((hours: any) => { Object.values(hours).forEach((ev: any) => flat.push(ev)); });
      setSavedEvents(flat);
    } catch (e: any) {
      showMessage(e.message || "Error al guardar", "error");
    } finally { setSaving(false); }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const resp = await fetch(`/api/programacion-eventos/${eventId}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Error eliminando");
      setSavedEvents(prev => prev.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      showMessage("Evento eliminado", "success");
    } catch (e: any) { showMessage(e.message || "Error", "error"); }
  };

  const handleUpdateEventEstado = async (eventId: number, estado: string) => {
    try {
      const resp = await fetch(`/api/programacion-eventos/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!resp.ok) throw new Error("Error actualizando");
      setSavedEvents(prev => prev.map(e => e.id === eventId ? { ...e, estado } : e));
      if (selectedEvent?.id === eventId) setSelectedEvent({ ...selectedEvent, estado });
      showMessage("Estado actualizado", "success");
    } catch (e: any) { showMessage(e.message || "Error", "error"); }
  };

  const handleClearAll = async () => {
    if (!fichaId) return;
    try {
      const resp = await fetch(`/api/programacion-instructores/ficha/${fichaId}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Error");
      setSavedEvents([]);
      setDraftCells(new Map());
      setConflictCells(new Set());
      showMessage("Calendario limpiado", "success");
    } catch { showMessage("Error al limpiar", "error"); }
  };

  const moveWeek = (delta: number) => {
    const [y, m, d] = currentWeekStart.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    base.setDate(base.getDate() + delta * 7);
    setCurrentWeekStart(`${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`);
  };

  const weekLabel = (() => {
    if (weekDates.length < 6) return currentWeekStart;
    const start = weekDates[0];
    const end = weekDates[5];
    return `${start.getDate()} ${start.toLocaleDateString('es', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('es', { month: 'short' })}`;
  })();

  const estadoColor = (estado: string) => {
    switch (estado) {
      case 'EJECUTADO': return 'border-green-300 bg-green-50 text-green-800';
      case 'CANCELADO': return 'border-red-200 bg-red-50/50 text-red-400 line-through';
      default: return 'border-blue-300 bg-blue-50 text-blue-800';
    }
  };

  const centrosFiltrados = centros.filter(c => !regionalId || c.regionalId === Number(regionalId));

  const toggleRA = (id: number) => {
    setSelectedRAs(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Programación de Instructores</h1>
          <p className="text-gray-500 text-sm mt-0.5">Asigna instructores y resultados de aprendizaje al calendario de fichas.</p>
        </div>
      </div>

      {notification && (
        <div className={`p-3 rounded-lg text-sm border font-medium flex items-center justify-between ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-end bg-white border rounded-xl p-4 shadow-sm">
        <SearchableSelect label="Regional" value={regionalId} onChange={v => { setRegionalId(v); setCentroId(""); setFichaId(""); }}
          options={[{ value: "", label: "Todas" }, ...regionales.map((r: any) => ({ value: String(r.id), label: r.nombre }))]} placeholder="Todas" />
        <SearchableSelect label="Centro" value={centroId} onChange={v => { setCentroId(v); setFichaId(""); }}
          options={[{ value: "", label: "Todos" }, ...centrosFiltrados.map((c: any) => ({ value: String(c.id), label: c.nombre }))]} placeholder="Todos" />
        <SearchableSelect label="Ficha" value={fichaId} onChange={v => { setFichaId(v); setCompetenciaId(""); setInstructorId(""); setSelectedRAs([]); setActiveRAId(null); }}
          options={fichasFiltradas.map((f: any) => {
            const prog = programas.find(p => p.id === f.programaId);
            return { value: String(f.id), label: `${f.numeroFicha} ${prog ? '- ' + prog.denominacion.substring(0, 25) : ''}` };
          })} placeholder="Seleccione ficha" />
        {fichaId && (
          <SearchableSelect label="Competencia" value={competenciaId} onChange={v => { setCompetenciaId(v); setInstructorId(""); setSelectedRAs([]); setActiveRAId(null); }}
            options={competencias.map((c: any) => ({ value: String(c.id), label: `${c.codigo} - ${c.nombre.substring(0, 30)}` }))} placeholder="Seleccione" />
        )}
        {competenciaId && (
          <SearchableSelect label="Instructor" value={instructorId} onChange={v => setInstructorId(v)}
            options={instructoresFiltrados.map((i: any) => ({ value: String(i.id), label: `${i.nombres} ${i.apellidos}` }))} placeholder="Seleccione" />
        )}
      </div>

      {fichaId && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1 space-y-4">
            {resultados.length > 0 && (
              <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="border-b bg-gray-50/80 px-3 py-2">
                  <h3 className="font-semibold text-gray-700 text-xs flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-500" /> Resultados de Aprendizaje</h3>
                </div>
                <div className="p-2 space-y-1.5 max-h-[400px] overflow-y-auto">
                  {resultados.map((r: any) => {
                    const maxH = Math.floor(r.duracionHoras * ((selectedComp?.porcentajeHorasDirectas || 80) / 100));
                    const used = countHoursForRA(r.id);
                    const pct = maxH > 0 ? Math.min((used / maxH) * 100, 100) : 0;
                    const isActive = activeRAId === r.id;
                    return (
                      <div key={r.id} className={`rounded-lg border p-2 cursor-pointer transition ${isActive ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}
                        onClick={() => setActiveRAId(r.id)}>
                        <div className="flex items-start gap-1.5">
                          <input type="checkbox" className="mt-0.5 rounded text-indigo-600" checked={selectedRAs.includes(r.id)} onChange={() => toggleRA(r.id)} onClick={e => e.stopPropagation()} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-semibold text-gray-500">{r.fase} — {r.codigo}</div>
                            <div className="text-xs text-gray-700 leading-tight line-clamp-2" title={r.nombre}>{r.nombre}</div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-400' : 'bg-indigo-400'}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[9px] text-gray-400 font-mono shrink-0">{used}/{maxH}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="border-b bg-gray-50/80 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Calendario
                  {currentFicha && <span className="text-gray-400 font-normal">— Ficha {currentFicha.numeroFicha}</span>}
                </h2>
                <div className="flex items-center gap-2">
                  {mayEliminar && fichaId && (
                    <button onClick={() => setClearingAll(true)} className="px-2.5 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-medium">Limpiar Todo</button>
                  )}
                  <div className="h-5 w-px bg-gray-200" />
                  <button onClick={() => moveWeek(-1)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-xs font-semibold text-gray-700 min-w-[140px] text-center">{weekLabel}</span>
                  <button onClick={() => moveWeek(1)} className="p-1 hover:bg-gray-200 rounded"><ChevronRight className="w-4 h-4" /></button>
                  {mayCrear && draftCells.size > 0 && (
                    <>
                      <div className="h-5 w-px bg-gray-200" />
                      <button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1">
                        <Save className="w-3 h-3" /> {saving ? 'Guardando...' : `Guardar (${draftCells.size})`}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                {!fichaId ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Calendar className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm">Seleccione una ficha para ver el calendario.</p>
                  </div>
                ) : weekDates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p className="text-sm">No hay días de clase para esta semana según el horario de la ficha.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs select-none">
                    <thead>
                      <tr>
                        <th className="border-b border-r bg-gray-100 p-1.5 font-semibold text-gray-600 text-center min-w-[70px] sticky left-0 z-20">Hora</th>
                        {DIAS_VISIBLES.map((dia, i) => {
                          const date = weekDates[i];
                          return (
                            <th key={i} className="border-b bg-gray-50 border-r border-gray-100 p-1 font-medium text-gray-600 text-center min-w-[90px]">
                              <div className="text-[9px] font-bold tracking-wider uppercase text-gray-400">{dia.substring(0, 3)}</div>
                              {date && <div className="text-base font-black text-gray-800">{date.getDate()}</div>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueHours.map((hora, rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="border-b border-r bg-gray-50 p-1.5 text-center font-bold text-gray-500 sticky left-0 z-10 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                            {String(hora).padStart(2, '0')}:00
                          </td>
                          {weekDates.map((d, colIdx) => {
                            const fecha = dateToKey(d);
                            const dayName = DIAS_EN_ESP[d.getDay()];
                            const slotExists = fichaHorario[dayName]?.some((s: string) => parseInt(s.split('-')[0], 10) === hora);
                            const saved = getEventAtCell(fecha, hora);
                            const draft = getDraftAtCell(fecha, hora);
                            const conflict = isConflict(fecha, hora);
                            const inPreview = dragPreview && colIdx >= dragPreview.minCol && colIdx <= dragPreview.maxCol && rowIdx >= dragPreview.minRow && rowIdx <= dragPreview.maxRow;
                            const resInfo = saved ? allResultados.find(r => r.id === saved.resultadoId) : draft ? allResultados.find(r => r.id === draft.resultadoId) : null;

                            return (
                              <td key={colIdx}
                                className={`border-b border-r border-gray-100 p-0.5 ${!slotExists ? 'bg-gray-100/60' : 'cursor-pointer'}`}
                                onMouseDown={() => slotExists && handleMouseDown(colIdx, rowIdx)}
                                onMouseEnter={() => slotExists && handleMouseEnter(colIdx, rowIdx)}>
                                {saved ? (
                                  <div className={`rounded p-1 text-center relative group min-h-[40px] flex flex-col justify-center border ${estadoColor(saved.estado)}`}
                                    onClick={() => setSelectedEvent(saved)}>
                                    <div className="text-[9px] font-bold">{resInfo?.codigo || 'RA'}</div>
                                    <div className="text-[8px] leading-tight line-clamp-1" title={resInfo?.nombre}>{resInfo?.nombre?.substring(0, 20)}</div>
                                    <div className="text-[8px] opacity-60">{saved.instructorNombre?.[0]}.{saved.instructorApellido?.[0]}</div>
                                    {mayEliminar && (
                                      <button onClick={e => { e.stopPropagation(); setDeletingEventId(saved.id); }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[8px]">✕</button>
                                    )}
                                  </div>
                                ) : draft ? (
                                  <div className="rounded p-1 text-center border border-indigo-300 bg-indigo-100 text-indigo-700 min-h-[40px] flex flex-col justify-center relative group">
                                    <div className="text-[9px] font-bold">{resInfo?.codigo || 'RA'}</div>
                                    <div className="text-[8px] leading-tight line-clamp-1">{resInfo?.nombre?.substring(0, 20)}</div>
                                    <button onClick={() => setDraftCells(prev => { const n = new Map(prev); n.delete(cellKey(fecha, hora)); return n; })}
                                      className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[8px]">✕</button>
                                  </div>
                                ) : conflict ? (
                                  <div className="rounded p-1 text-center border border-amber-300 bg-amber-50 text-amber-600 min-h-[40px] flex items-center justify-center">
                                    <AlertTriangle className="w-3 h-3" />
                                  </div>
                                ) : inPreview && slotExists && activeRAId ? (
                                  <div className="rounded p-1 text-center border border-indigo-200 bg-indigo-50/60 text-indigo-400 min-h-[40px] flex items-center justify-center">
                                    <div className="text-[9px]">{allResultados.find(r => r.id === activeRAId)?.codigo}</div>
                                  </div>
                                ) : slotExists ? (
                                  <div className="min-h-[40px] flex items-center justify-center text-gray-200 hover:bg-indigo-50/30 rounded transition">
                                    <span className="text-[10px]">+</span>
                                  </div>
                                ) : (
                                  <div className="min-h-[40px]" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">Detalle del Evento</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Fecha:</span> <span className="font-medium">{selectedEvent.fecha}</span></div>
                <div><span className="text-gray-400">Hora:</span> <span className="font-medium">{String(selectedEvent.horaInicio).padStart(2, '0')}:00</span></div>
                <div><span className="text-gray-400">RA:</span> <span className="font-medium">{selectedEvent.resultadoCodigo} — {selectedEvent.resultadoNombre?.substring(0, 30)}</span></div>
                <div><span className="text-gray-400">Instructor:</span> <span className="font-medium">{selectedEvent.instructorNombre} {selectedEvent.instructorApellido}</span></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                <div className="flex gap-2">
                  {['PLANIFICADO', 'EJECUTADO', 'CANCELADO'].map(est => (
                    <button key={est} onClick={() => mayEditar && handleUpdateEventEstado(selectedEvent.id, est)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${selectedEvent.estado === est ? estadoColor(est) + ' ring-2 ring-offset-1 ring-current' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {est === 'PLANIFICADO' && <Clock className="w-3 h-3 inline mr-1" />}
                      {est === 'EJECUTADO' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {est === 'CANCELADO' && <X className="w-3 h-3 inline mr-1" />}
                      {est}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setSelectedEvent(null)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deletingEventId !== null}
        onClose={() => setDeletingEventId(null)}
        onConfirm={() => { if (deletingEventId !== null) handleDeleteEvent(deletingEventId); setDeletingEventId(null); }}
        title="Eliminar Evento"
        message="¿Eliminar este evento de programación?"
        confirmText="Eliminar"
        danger
      />
      <ConfirmDialog
        isOpen={clearingAll}
        onClose={() => setClearingAll(false)}
        onConfirm={() => { handleClearAll(); setClearingAll(false); }}
        title="Limpiar Todo"
        message="¿Eliminar TODA la programación de esta ficha? Esta acción no se puede deshacer."
        confirmText="Limpiar Todo"
        danger
      />
    </div>
  );
}