import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, CheckCircle2, AlertCircle } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto space-y-6 px-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/fichas')} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Proyecto Formativo — Ficha {ficha?.numeroFicha || ''}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {programa ? `${programa.denominacion} (${programa.codigo})` : 'Programa no encontrado'}
          </p>
        </div>
      </div>

      {/* Porcentaje de Ejecucion Directa */}
      <div className="bg-white border rounded-xl shadow-sm p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">% Ejecución Directa:</label>
        <select value={porcentaje} onChange={e => setPorcentaje(Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white">
          <option value="70">70%</option>
          <option value="80">80%</option>
        </select>
        <button onClick={handleSavePorcentaje} disabled={savingPct}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition">
          <Save className="w-4 h-4" /> {savingPct ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Etapas Tabs */}
      <div className="flex gap-1 border-b pb-0.5">
        {ETAPAS.map(et => (
          <button key={et} onClick={() => setEtapaActiva(et)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${etapaActiva === et ? 'bg-white text-emerald-700 border border-b-0 border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {et}
          </button>
        ))}
      </div>

      {/* RAPs Matrix */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Asignación de RAPs — {etapaActiva}</h2>
          <button onClick={handleSaveEtapa} disabled={savingRaps}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition">
            <Save className="w-4 h-4" /> {savingRaps ? 'Guardando...' : 'Guardar Asignación'}
          </button>
        </div>
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {competencias.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay competencias registradas para este programa.</p>
          ) : (
            competencias.map(comp => {
              const raps = rapsByCompetencia[comp.id] || [];
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
                      // Find which other etapas this RAP is assigned to
                      const otrasEtapas = ETAPAS.filter(et => et !== etapaActiva && (asignaciones[et] || []).includes(ra.id));
                      return (
                        <label key={ra.id} className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition ${checked ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleRap(ra.id)}
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
  );
}
