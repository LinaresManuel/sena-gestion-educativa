import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Search, AlertCircle } from "lucide-react";

const ETAPAS = ["Analisis", "Planeacion", "Ejecucion", "Evaluacion", "Complementario"];

export default function ProyectoFormativoView() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const navigate = useNavigate();

  const [ficha, setFicha] = useState<any>(null);
  const [programa, setPrograma] = useState<any>(null);
  const [competencias, setCompetencias] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [proyecto, setProyecto] = useState<any>(null);
  const [porcentaje, setPorcentaje] = useState(80);
  const [etapaActiva, setEtapaActiva] = useState(ETAPAS[0]);
  const [asignaciones, setAsignaciones] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingPct, setSavingPct] = useState(false);
  const [savingRaps, setSavingRaps] = useState(false);
  const [search, setSearch] = useState("");
  const [moveRapConfirm, setMoveRapConfirm] = useState<{ rapId: number; fromEtapa: string } | null>(null);

  function normalize(s: string) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function handleRapToggle(rapId: number) {
    // Check if RAP is in another etapa
    const otrasEtapas = ETAPAS.filter(et => et !== etapaActiva && (asignaciones[et] || []).includes(rapId));
    if (otrasEtapas.length > 0) {
      setMoveRapConfirm({ rapId, fromEtapa: otrasEtapas[0] });
      return;
    }
    // Simple toggle in the current etapa
    setAsignaciones(prev => {
      const current = prev[etapaActiva] || [];
      if (current.includes(rapId)) {
        return { ...prev, [etapaActiva]: current.filter(id => id !== rapId) };
      }
      return { ...prev, [etapaActiva]: [...current, rapId] };
    });
  }

  function confirmMoveRap() {
    if (!moveRapConfirm) return;
    const { rapId, fromEtapa } = moveRapConfirm;
    setAsignaciones(prev => {
      const next = { ...prev };
      next[fromEtapa] = (next[fromEtapa] || []).filter(id => id !== rapId);
      next[etapaActiva] = [...(next[etapaActiva] || []), rapId];
      return next;
    });
    setMoveRapConfirm(null);
  }

  useEffect(() => {
    if (!fichaId) return;
    (async () => {
      try {
        const [fRes, pRes] = await Promise.all([
          fetch(`/api/fichas`).then(r => r.json()),
          fetch(`/api/programas`).then(r => r.json()),
        ]);
        const fichasArr = Array.isArray(fRes) ? fRes : [];
        const f = fichasArr.find((fi: any) => fi.id === Number(fichaId));
        setFicha(f);
        if (f) {
          const prog = Array.isArray(pRes) ? pRes.find((p: any) => p.id === f.programaId) : null;
          setPrograma(prog);
          const [compRes, pfRes] = await Promise.all([
            fetch(`/api/programas/${f.programaId}/competencias`).then(r => r.json()),
            fetch(`/api/fichas/${fichaId}/proyecto-formativo`).then(r => r.json()),
          ]);
          setCompetencias(Array.isArray(compRes) ? compRes : []);
          setProyecto(pfRes);
          setPorcentaje(pfRes.porcentajeEjecucionDirecta ?? 80);

          // Load all resultados for all competencias
          const compIds = (Array.isArray(compRes) ? compRes : []).map((c: any) => c.id);
          const resPromises = compIds.map((id: number) =>
            fetch(`/api/competencias/${id}/resultados`).then(r => r.json())
          );
          const resArrs = await Promise.all(resPromises);
          const allRaps = resArrs.flat().filter(Boolean);
          setResultados(allRaps);

          // Build asignaciones from etapas data
          const etapasArr = Array.isArray(pfRes.etapas) ? pfRes.etapas : [];
          const asig: Record<string, number[]> = {};
          for (const e of etapasArr) {
            if (!asig[e.etapa]) asig[e.etapa] = [];
            asig[e.etapa].push(e.resultadoId);
          }
          setAsignaciones(asig);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [fichaId]);

  async function handleSavePorcentaje() {
    if (!proyecto) return;
    setSavingPct(true);
    try {
      const res = await fetch(`/api/proyectos-formativos/${proyecto.id}/porcentaje`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porcentajeEjecucionDirecta: porcentaje }),
      });
      if (res.ok) setProyecto({ ...proyecto, porcentajeEjecucionDirecta: porcentaje });
    } catch (e) { console.error(e); }
    finally { setSavingPct(false); }
  }

  async function handleSaveEtapa() {
    if (!proyecto) return;
    setSavingRaps(true);
    try {
      const res = await fetch(`/api/proyectos-formativos/${proyecto.id}/etapas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: etapaActiva, resultadoIds: asignaciones[etapaActiva] || [] }),
      });
      if (res.ok) {
        const etapas = await res.json();
        const asig: Record<string, number[]> = {};
        for (const e of etapas) {
          if (!asig[e.etapa]) asig[e.etapa] = [];
          asig[e.etapa].push(e.resultadoId);
        }
        setAsignaciones(asig);
      }
    } catch (e) { console.error(e); }
    finally { setSavingRaps(false); }
  }

  function toggleRap(rapId: number) {
    setAsignaciones(prev => {
      const current = prev[etapaActiva] || [];
      if (current.includes(rapId)) {
        return { ...prev, [etapaActiva]: current.filter(id => id !== rapId) };
      }
      return { ...prev, [etapaActiva]: [...current, rapId] };
    });
  }

  // Group resultados by competencia
  const rapsByCompetencia: Record<number, any[]> = {};
  for (const ra of resultados) {
    if (!rapsByCompetencia[ra.competenciaId]) rapsByCompetencia[ra.competenciaId] = [];
    rapsByCompetencia[ra.competenciaId].push(ra);
  }

  // Filter competencias and RAPs by search query (accent-insensitive)
  const q = normalize(search);
  const competenciasFiltradas = competencias.filter(comp => {
    if (!q) return true;
    if (normalize(comp.nombre).includes(q) || normalize(comp.codigo).includes(q)) return true;
    return (rapsByCompetencia[comp.id] || []).some((ra: any) => normalize(ra.nombre).includes(q));
  });
  // Within each filtered competencia, also filter matching RAPs
  const rapsFiltradosPorCompetencia: Record<number, any[]> = {};
  for (const comp of competenciasFiltradas) {
    const raps = rapsByCompetencia[comp.id] || [];
    if (!q) {
      rapsFiltradosPorCompetencia[comp.id] = raps;
    } else {
      rapsFiltradosPorCompetencia[comp.id] = raps.filter((ra: any) =>
        normalize(ra.nombre).includes(q) || normalize(ra.codigo || '').includes(q)
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed header row: title left, % right */}
      <div className="shrink-0 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/fichas')} className="p-1.5 hover:bg-gray-100 rounded-lg transition shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-gray-900 truncate">
                Proyecto Formativo — Ficha {ficha?.numeroFicha || ''}
              </h1>
              <p className="text-xs text-gray-500 truncate">
                {programa ? `${programa.denominacion} (${programa.codigo})` : 'Programa no encontrado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">% Ejec. Directa:</label>
            <select value={porcentaje} onChange={e => setPorcentaje(Number(e.target.value))}
              className="border rounded-lg px-2 py-1 text-xs bg-white w-16">
              <option value="70">70%</option>
              <option value="80">80%</option>
            </select>
            <button onClick={handleSavePorcentaje} disabled={savingPct}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition">
              <Save className="w-3 h-3" /> {savingPct ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + Matrix – fills remaining height */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4 min-h-0">
        {/* Etapas Tabs */}
        <div className="flex gap-1 border-b pb-0.5 shrink-0 mt-3">
          {ETAPAS.map(et => (
            <button key={et} onClick={() => setEtapaActiva(et)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${etapaActiva === et ? 'bg-white text-emerald-700 border border-b-0 border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {et}
            </button>
          ))}
        </div>

        {/* RAPs Matrix */}
        <div className="flex-1 flex flex-col bg-white border border-t-0 rounded-b-xl shadow-sm overflow-hidden min-h-0">
          <div className="shrink-0 px-4 py-2 border-b bg-gray-50/50 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar competencia o RA..."
                className="w-full border rounded-lg pl-7 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-400 transition" />
            </div>
            <button onClick={handleSaveEtapa} disabled={savingRaps}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition shrink-0">
              <Save className="w-3.5 h-3.5" /> {savingRaps ? 'Guardando...' : 'Guardar Asignación'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {competenciasFiltradas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                {search ? 'Sin resultados para tu búsqueda.' : 'No hay competencias registradas para este programa.'}
              </p>
            ) : (
              competenciasFiltradas.map(comp => {
                const raps = rapsFiltradosPorCompetencia[comp.id] || [];
                if (raps.length === 0) return null;
                const seleccionados = asignaciones[etapaActiva] || [];
                return (
                  <div key={comp.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b">
                      <span className="text-xs font-semibold text-gray-700">
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono mr-1.5">{comp.codigo}</span>
                        {comp.nombre}
                      </span>
                    </div>
                    <div className="divide-y">
                      {raps.map((ra: any) => {
                        const checked = seleccionados.includes(ra.id);
                        const otrasEtapas = ETAPAS.filter(et => et !== etapaActiva && (asignaciones[et] || []).includes(ra.id));
                        return (
                          <label key={ra.id} className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition ${checked ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={checked} onChange={() => handleRapToggle(ra.id)}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-700">{ra.codigo && <span className="font-mono text-xs bg-slate-100 px-1 rounded mr-1">{ra.codigo}</span>}{ra.nombre}</span>
                              <span className="text-xs text-gray-400 ml-2">{ra.duracionHoras}h</span>
                            </div>
                            {otrasEtapas.length > 0 && (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                En {otrasEtapas.join(', ')}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* Confirm move RAP dialog */}
      {moveRapConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
          onClick={() => setMoveRapConfirm(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-gray-900">¿Mover RA de etapa?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Este RA ya está asignado a la etapa <strong>{moveRapConfirm.fromEtapa}</strong>.
                  ¿Desea moverlo a <strong>{etapaActiva}</strong>?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setMoveRapConfirm(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                Cancelar
              </button>
              <button onClick={confirmMoveRap}
                className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition">
                Mover a {etapaActiva}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
