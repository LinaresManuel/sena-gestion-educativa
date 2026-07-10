import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, User, Search, RefreshCw, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { useHasPermission } from "../lib/auth-context";
import ConfirmDialog from "./ConfirmDialog";

const DIAS_EN_ESP = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

export default function ProgramacionInstructoresView() {
  const mayVer = useHasPermission('programacion.ver');
  const mayCrear = useHasPermission('programacion.crear');
  const mayEditar = useHasPermission('programacion.editar');
  const mayEliminar = useHasPermission('programacion.eliminar');
  const [programaciones, setProgramaciones] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [competencias, setCompetencias] = useState<any[]>([]);
  const [instructores, setInstructores] = useState<any[]>([]);
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [allResultados, setAllResultados] = useState<any[]>([]);

  const [programaId, setProgramaId] = useState("");
  const [fichaId, setFichaId] = useState("");
  const [competenciaId, setCompetenciaId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  
  const [selectedResultados, setSelectedResultados] = useState<number[]>([]);
  
  const [currentMonthStr, setCurrentMonthStr] = useState<string>(""); // YYYY-MM
  
  // { '2023-11-01': { '06:00-07:00': resultadoId } }
  const [calendario, setCalendario] = useState<{[date: string]: {[hora: string]: number}}>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [clearingCell, setClearingCell] = useState<{dateStr: string; hr: string} | null>(null);
  const [clearingCalendar, setClearingCalendar] = useState(false);

  useEffect(() => {
    fetchData();
    const today = new Date();
    setCurrentMonthStr(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progRes, instRes, prograInstRes, fichasRes, resultadosRes] = await Promise.all([
        fetch("/api/programas"),
        fetch("/api/instructores"),
        fetch("/api/programacion-instructores"),
        fetch("/api/fichas"),
        fetch("/api/resultados")
      ]);
      setProgramas(await progRes.json());
      setInstructores(await instRes.json());
      setFichas(await fichasRes.json());
      setAllResultados(await resultadosRes.json());
      
      if (prograInstRes.ok) {
        setProgramaciones(await prograInstRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (programaId) {
      fetch(`/api/programas/${programaId}/competencias`)
        .then(res => res.json())
        .then(data => {
          setCompetencias(data);
          setCompetenciaId("");
          setFichaId(""); // reset ficha
        });
    } else {
      setCompetencias([]);
      setCompetenciaId("");
      setFichaId("");
    }
  }, [programaId]);

  useEffect(() => {
    if (competenciaId) {
      Promise.all([
        fetch(`/api/competencias/${competenciaId}/perfiles`),
        fetch(`/api/competencias/${competenciaId}/resultados`)
      ]).then(async ([perfRes, resRes]) => {
        setPerfiles(await perfRes.json());
        setResultados(await resRes.json());
        setInstructorId("");
        setSelectedResultados([]);
      });
    } else {
      setPerfiles([]);
      setResultados([]);
      setInstructorId("");
      setSelectedResultados([]);
    }
  }, [competenciaId]);

  const toggleResultado = (id: number) => {
    setSelectedResultados(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleCellChange = (dateStr: string, hr: string, val: string) => {
    const resId = val ? parseInt(val) : null;
    
    // Check remaining direct hours 
    if (resId && val) {
       const res = resultados.find(r => r.id === resId);
       const comp = competencias.find(c => c.id === Number(competenciaId));
       if (res && comp) {
          const hoursTotal = Math.floor(res.duracionHoras * ((comp.porcentajeHorasDirectas || 80) / 100));
          const used = countHours(resId);
          if (used >= hoursTotal) {
             alert(`No puedes asignar más horas. El tope de horas directas (${hoursTotal}h) para este resultado se ha alcanzado.`);
             return;
          }
       }
    }

    setCalendario(prev => {
      const dayData = { ...(prev[dateStr] || {}) };
      if (!val) {
        delete dayData[hr];
      } else {
        dayData[hr] = resId!;
      }
      return {
        ...prev,
        [dateStr]: dayData
      };
    });
  };

  const currentFicha = fichas.find(f => f.id === Number(fichaId));
  const fichaHorario = currentFicha && typeof currentFicha.horario === 'string' 
    ? JSON.parse(currentFicha.horario) 
    : (currentFicha?.horario || {});

  const uniqueHoursSet = new Set<string>();
  Object.values(fichaHorario).forEach((hours: any) => {
    hours.forEach((h: string) => uniqueHoursSet.add(h));
  });
  const uniqueHours = Array.from(uniqueHoursSet).sort();

  // Generate columns for the month
  let datesInMonth: Date[] = [];
  if (currentMonthStr) {
    const [y, m] = currentMonthStr.split('-');
    const year = parseInt(y);
    const month = parseInt(m) - 1; // 0-indexed
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      const dayName = DIAS_EN_ESP[d.getDay()];
      if (fichaHorario[dayName] && fichaHorario[dayName].length > 0) {
        datesInMonth.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
  }

  // Next / Prev month
  const moveMonth = (delta: number) => {
    const [y, m] = currentMonthStr.split('-');
    let date = new Date(parseInt(y), parseInt(m) - 1 + delta, 1);
    setCurrentMonthStr(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleClearCell = async (dateStr: string, hr: string) => {
    try {
      setLoading(true);
      const resp = await fetch("/api/programacion-instructores/limpiar-celda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fichaId: Number(fichaId), dateStr, hr })
      });
      if (!resp.ok) throw new Error("Error en servidor");
      const data = await resp.json();
      console.log("Limpiar result:", data);
      await fetchData();
         setCalendario(prev => {
            const copy = { ...prev };
            if (copy[dateStr]) {
              delete copy[dateStr][hr];
            }
            return copy;
         });
         alert(`Se eliminó la programación guardada (${data.count} registro/s) de la fecha ${dateStr} ${hr}`);
    } catch(e) {
      alert("Error al limpiar la celda");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCalendar = async () => {
    if (!fichaId) return;
    try {
      setLoading(true);
      const resp = await fetch(`/api/programacion-instructores/ficha/${fichaId}`, {
        method: "DELETE"
      });
      if (!resp.ok) throw new Error("Error");
      setCalendario({});
      await fetchData();
      alert("Calendario limpiado exitosamente.");
    } catch(e) {
      alert("Error al limpiar el calendario");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedResultados.length === 0) {
      alert("Seleccione al menos un resultado de aprendizaje.");
      return;
    }
    if (!fichaId || !instructorId || !programaId || !competenciaId) {
      alert("Por favor complete todos los parámetros.");
      return;
    }
    
    setSaving(true);
    try {
      const resp = await fetch("/api/programacion-instructores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programaId: Number(programaId),
          fichaId: Number(fichaId),
          competenciaId: Number(competenciaId),
          instructorId: Number(instructorId),
          resultadosIds: selectedResultados,
          eventos: calendario
        })
      });
      if (!resp.ok) throw new Error("Error saving");
      
      // Update global list just in case we need it later
      fetchData(); 
      alert("Programación guardada exitosamente.");
    } catch (e) {
      console.error(e);
      alert("Error al guardar programación.");
    } finally {
      setSaving(false);
    }
  };


  const countHours = (resId: number) => {
    let count = 0;
    Object.values(calendario).forEach(day => {
      Object.values(day).forEach(id => {
        if (id === resId) count++;
      });
    });
    // Count from global saves too
    programaciones.forEach(prog => {
       if (prog.eventos) {
          const ev = typeof prog.eventos === 'string' ? JSON.parse(prog.eventos) : prog.eventos;
          Object.values(ev).forEach((day: any) => {
             Object.values(day).forEach(id => {
               if (id === resId) count++;
             });
          });
       }
    });

    return count;
  };

  const perfilNames = perfiles.map(p => p.nombre);
  const perfilIds = perfiles.map(p => p.perfilAcademicoId).filter(Boolean);
  const instructoresFiltrados = instructores.filter(inst => {
    if (perfilNames.length === 0) return true;
    // Intentar match por IDs (nuevo sistema)
    if (perfilIds.length > 0 && Array.isArray(inst.perfiles)) {
      return inst.perfiles.some((p: any) => perfilIds.includes(p.id));
    }
    // Fallback: match por nombre textual (sistema legacy)
    if (!inst.requisitosAcademicos || !Array.isArray(inst.requisitosAcademicos)) return false;
    return inst.requisitosAcademicos.some((req: string) => perfilNames.includes(req));
  });

  const selectedResultadosInfo = resultados.filter(r => selectedResultados.includes(r.id));
  const selectedComp = competencias.find(c => c.id === Number(competenciaId));

  return (
    <div className="max-w-screen-xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Programación de Instructores</h1>
          <p className="text-gray-500 mt-1">Coordina el calendario mensual asociando instructores, fechas, horas y resultados de aprendizaje.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Form & Selection */}
        <div className="lg:col-span-1 space-y-4 sticky top-6">
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="border-b bg-gray-50/80 px-4 py-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Parámetros
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">1. Programa</label>
                <select required value={programaId} onChange={e => setProgramaId(e.target.value)} className="w-full px-2 py-1.5 border rounded bg-white text-sm">
                  <option value="">Seleccione programa...</option>
                  {programas.map(p => (
                    <option key={p.id} value={p.id}>{p.codigo} - {p.denominacion}</option>
                  ))}
                </select>
              </div>

              {programaId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">2. Ficha</label>
                  <select required value={fichaId} onChange={e => setFichaId(e.target.value)} className="w-full px-2 py-1.5 border rounded bg-white text-sm">
                    <option value="">Seleccione ficha...</option>
                    {fichas.filter(f => f.programaId === Number(programaId)).map(f => (
                      <option key={f.id} value={f.id}>Ficha: {f.numeroFicha}</option>
                    ))}
                  </select>
                </div>
              )}

              {fichaId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">3. Competencia</label>
                  <select required value={competenciaId} onChange={e => setCompetenciaId(e.target.value)} className="w-full px-2 py-1.5 border rounded bg-white text-sm">
                    <option value="">Seleccione competencia...</option>
                    {competencias.map(c => (
                      <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {competenciaId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">4. Instructor Sugerido</label>
                  <select required value={instructorId} onChange={e => setInstructorId(e.target.value)} className="w-full px-2 py-1.5 border rounded bg-white text-sm">
                    <option value="">Seleccione instructor...</option>
                    {instructoresFiltrados.map(i => (
                      <option key={i.id} value={i.id}>{i.nombres} {i.apellidos} ({i.documento})</option>
                    ))}
                  </select>
                  {instructoresFiltrados.length === 0 && (
                     <p className="text-[10px] text-red-500 leading-tight mt-1">Requiere perfil: {perfilNames.join(", ")}</p>
                  )}
                </div>
              )}

              {instructorId && resultados.length > 0 && (
                <div className="pt-2 border-t mt-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">5. Resultados a Impartir</label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {resultados.map(r => {
                      const maxHr = Math.floor(r.duracionHoras * ((selectedComp?.porcentajeHorasDirectas || 80) / 100));
                      const used = countHours(r.id);
                      return (
                        <label key={r.id} className="flex items-start gap-2 cursor-pointer bg-gray-50 border p-2 rounded">
                          <input 
                            type="checkbox" 
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                            checked={selectedResultados.includes(r.id)}
                            onChange={() => toggleResultado(r.id)}
                          />
                          <div className="text-xs text-gray-700 leading-tight">
                            <span className="font-semibold block">{r.fase} ({used}/{maxHr}h dir.)</span>
                            {r.nombre.substring(0,60)}...
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Column: Calendar Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-[600px]">
            <div className="border-b bg-gray-50/80 px-5 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Calendario Programación
              </h2>
               <div className="flex items-center gap-2">
                 {mayEditar && (
                   <button 
                     onClick={() => setEditMode(!editMode)} 
                     className={`px-3 py-1.5 rounded-md text-sm font-medium transition border ${editMode ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                     {editMode ? 'Modo Edición: Activo' : 'Habilitar Edición'}
                   </button>
                 )}
                 {mayEliminar && fichaId && (
                   <button 
                     onClick={() => setClearingCalendar(true)}
                     className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition"
                     title="Limpiar Todo el Calendario"
                   >
                     Limpiar Todo
                   </button>
                 )}
                 <div className="h-6 w-px bg-gray-300 mx-1"></div>
                 <button onClick={() => moveMonth(-1)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
                 <input type="month" value={currentMonthStr} onChange={e => setCurrentMonthStr(e.target.value)} className="border rounded px-2 py-1.5 font-semibold text-sm bg-white text-gray-800"/>
                 <button onClick={() => moveMonth(1)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><ChevronRight className="w-5 h-5" /></button>
                 
                 {mayCrear && (
                   <button 
                    onClick={handleSave}
                    disabled={saving || Object.keys(calendario).length === 0}
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 ml-2">
                    Guardar Mes
                   </button>
                 )}
              </div>
            </div>
            
            <div className="p-0 overflow-x-auto relative">
               {!fichaId ? (
                 <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <Calendar className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg">Seleccione una ficha a la izquierda para cargar la malla horaria.</p>
                 </div>
               ) : datesInMonth.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <p>No hay clases programadas para este mes en la ficha {currentFicha?.numeroFicha}.</p>
                 </div>
               ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border-b border-r bg-gray-100 p-2 font-semibold text-gray-700 text-center min-w-[100px] sticky left-0 z-20">
                          Horas \ Días
                        </th>
                        {datesInMonth.map((d, i) => (
                          <th key={i} className="border-b bg-gray-50 border-r border-gray-100 p-2 font-medium text-gray-700 text-center min-w-[150px]">
                            <div className="text-[10px] font-bold tracking-wider uppercase text-gray-500">{DIAS_EN_ESP[d.getDay()]}</div>
                            <div className="text-xl font-black text-gray-800 my-0.5">{d.getDate()}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueHours.map((hr, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="border-b border-r bg-gray-50 p-2 text-center font-bold text-gray-600 sticky left-0 z-10 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                            {hr}
                          </td>
                          {datesInMonth.map((d, j) => {
                            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            const dayName = DIAS_EN_ESP[d.getDay()];
                            const isHourActiveForDay = fichaHorario[dayName]?.includes(hr);
                            const currentVal = calendario[dateStr]?.[hr] || "";
                            
                            // Check if globally configured by someone else
                            let externallyConfiguredId: number | null = null;
                            let externoPId: number | null = null; // para saber de quÃ© id de programacion vino (y quizas instructor)
                            programaciones.forEach(prog => {
                               if (prog.fichaId === Number(fichaId) && prog.eventos) {
                                  const ev = typeof prog.eventos === 'string' ? JSON.parse(prog.eventos) : prog.eventos;
                                  if (ev[dateStr]?.[hr]) {
                                     externallyConfiguredId = ev[dateStr][hr];
                                  }
                               }
                            });

                            let externoResInfo = null;
                            if (externallyConfiguredId) {
                               externoResInfo = allResultados.find(r => r.id === externallyConfiguredId);
                            }

                            let selectedResInfo = null;
                            if (currentVal) {
                               selectedResInfo = allResultados.find(r => r.id === Number(currentVal));
                            }

                            return (
                              <td key={j} className={isHourActiveForDay ? "border-b border-r border-gray-100 p-1.5" : "border-b border-r border-gray-100 p-1.5 bg-gray-100/50"}>
                                {externallyConfiguredId ? (
                                   <div className="w-full text-xs font-medium border border-emerald-200 bg-emerald-50 rounded p-1 text-emerald-800 text-center relative group min-h-[46px] flex flex-col justify-center">
                                      <div className="text-[10px] font-bold text-emerald-900 border-b border-emerald-200/50 mb-0.5 pb-0.5">
                                        {externoResInfo?.codigo || 'S/C'}
                                      </div>
                                      <div className="text-[9px] leading-tight line-clamp-2" title={externoResInfo?.nombre}>
                                        {externoResInfo?.nombre || `Res: ${externallyConfiguredId}`}
                                      </div>
                                       {mayEliminar && (
                                         <button 
                                           title="Eliminar celda guardada"
                                           onClick={() => setClearingCell({dateStr, hr})}
                                           className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm hover:scale-110 z-10"
                                         >
                                           ✕
                                         </button>
                                       )}
                                   </div>
                                ) : currentVal ? (
                                   <div className="w-full text-xs font-medium border border-indigo-200 bg-indigo-50 rounded p-1 text-indigo-800 text-center relative group min-h-[46px] flex flex-col justify-center">
                                       <div className="text-[10px] font-bold text-indigo-900 border-b border-indigo-200/50 mb-0.5 pb-0.5">
                                         {selectedResInfo?.codigo || 'S/C'}
                                       </div>
                                       <div className="text-[9px] leading-tight line-clamp-2" title={selectedResInfo?.nombre}>
                                         {selectedResInfo?.nombre || `Res: ${currentVal}`}
                                       </div>
                                       {mayEliminar && (
                                         <button 
                                           title="Quitar"
                                           onClick={() => handleCellChange(dateStr, hr, "")}
                                           className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm hover:scale-110 z-10"
                                         >
                                           ✕
                                         </button>
                                       )}
                                   </div>
                                 ) : isHourActiveForDay && mayCrear ? (
                                   <select 
                                     className="w-full text-xs box-border resize-none border border-gray-200 rounded p-1 focus:border-indigo-500 outline-none text-gray-700 bg-white min-h-[36px]"
                                     value=""

                                     onChange={e => handleCellChange(dateStr, hr, e.target.value)}
                                   >
                                     <option value="" className="text-gray-400">--- Vacío ---</option>
                                     {selectedResultadosInfo.map(r => (
                                       <option key={r.id} value={r.id}>{r.fase} - {r.nombre.substring(0, 30)}...</option>
                                     ))}
                                   </select>
                                ) : (
                                  <div className="text-center text-gray-300 text-xl font-light">-</div>
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

      <ConfirmDialog
        isOpen={clearingCell !== null}
        onClose={() => setClearingCell(null)}
        onConfirm={() => { if (clearingCell) { handleClearCell(clearingCell.dateStr, clearingCell.hr); setClearingCell(null); } }}
        title="Eliminar Celda"
        message={`¿Estás seguro de que deseas eliminar la programación guardada del ${clearingCell?.dateStr} ${clearingCell?.hr}?`}
        confirmText="Eliminar"
        danger
      />
      <ConfirmDialog
        isOpen={clearingCalendar}
        onClose={() => setClearingCalendar(false)}
        onConfirm={() => { handleClearCalendar(); setClearingCalendar(false); }}
        title="Limpiar Todo el Calendario"
        message="¿ATENCIÓN: Estás seguro de borrar TODA la programación guardada para esta Ficha? Esta acción no se puede deshacer."
        confirmText="Limpiar Todo"
        danger
      />
    </div>
  );
}
