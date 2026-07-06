import { useState, useEffect } from "react";
import { Programa } from "./ProgramasView";
import { X, Plus, Trash2, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Pencil } from "lucide-react";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";

interface Competencia {
  id: number;
  programaId: number;
  codigo: string;
  nombre: string;
  duracionHoras: number;
  porcentajeHorasDirectas: number;
}

interface ResultadoAprendizaje {
  id: number;
  competenciaId: number;
  codigo: string;
  nombre: string;
  duracionHoras: number;
  fase: string;
}

interface PerfilInstructor {
  id: number;
  competenciaId: number;
  codigo: string;
  nombre: string;
}

interface CurriculoModalProps {
  programa: Programa;
  onClose: () => void;
}

export default function CurriculoModal({ programa, onClose }: CurriculoModalProps) {
  const mayCrear = useHasPermission('programas.crear');
  const mayEditar = useHasPermission('programas.editar');
  const mayEliminar = useHasPermission('programas.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [resultados, setResultados] = useState<Record<number, ResultadoAprendizaje[]>>({});
  const [perfiles, setPerfiles] = useState<Record<number, PerfilInstructor[]>>({});
  const [loading, setLoading] = useState(true);

  // Global unique data for autocomplete
  const [uniqueCompetencias, setUniqueCompetencias] = useState<{codigo: string, nombre: string, duracionHoras: number}[]>([]);
  const [uniquePerfiles, setUniquePerfiles] = useState<{codigo: string, nombre: string}[]>([]);

  // Form states for Competencia
  const [editingComp, setEditingComp] = useState<Competencia | null>(null);
  const [compCodigo, setCompCodigo] = useState("");
  const [compNombre, setCompNombre] = useState("");
  const [compDuracion, setCompDuracion] = useState("");
  const [compPorcentajeDirectas, setCompPorcentajeDirectas] = useState("80");

  // Form states for additions within expanded section
  const [expandedComp, setExpandedComp] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"RA" | "Perfil" | null>(null);

  // Form states for Resultado
  const [editingRes, setEditingRes] = useState<ResultadoAprendizaje | null>(null);
  const [resCodigo, setResCodigo] = useState("");
  const [resNombre, setResNombre] = useState("");
  const [resDuracion, setResDuracion] = useState("");
  const [resFase, setResFase] = useState("Analisis");

  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const showMessage = (text: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Form states for Perfil
  const [editingPerfil, setEditingPerfil] = useState<PerfilInstructor | null>(null);
  const [perfilCodigo, setPerfilCodigo] = useState("");
  const [perfilNombre, setPerfilNombre] = useState("");

  const fetchCompetencias = async () => {
    setLoading(true);
    try {
      const [res, compUniq, perfUniq] = await Promise.all([
        fetch(`/api/programas/${programa.id}/competencias`),
        fetch(`/api/competencias-unicas`),
        fetch(`/api/perfiles-unicos`)
      ]);
      const data = await res.json();
      const compArray = Array.isArray(data) ? data : [];
      setCompetencias(compArray);

      if (compUniq.ok) setUniqueCompetencias(await compUniq.json());
      if (perfUniq.ok) setUniquePerfiles(await perfUniq.json());

      const resPromises = compArray.map((c: Competencia) => fetch(`/api/competencias/${c.id}/resultados`).then(r => r.json()));
      const perfPromises = compArray.map((c: Competencia) => fetch(`/api/competencias/${c.id}/perfiles`).then(r => r.json()));
      
      const resData = await Promise.all(resPromises);
      const perfData = await Promise.all(perfPromises);
      
      const newResultados: Record<number, ResultadoAprendizaje[]> = {};
      const newPerfiles: Record<number, PerfilInstructor[]> = {};
      
      compArray.forEach((c: Competencia, index: number) => {
        newResultados[c.id] = Array.isArray(resData[index]) ? resData[index] : [];
        newPerfiles[c.id] = Array.isArray(perfData[index]) ? perfData[index] : [];
      });
      setResultados(newResultados);
      setPerfiles(newPerfiles);
    } catch (e) {
      console.error(e);
      setCompetencias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetencias();
  }, [programa.id]);

  const handleSaveCompetencia = async (e: React.FormEvent) => {
    e.preventDefault();

    const existing = competencias.find(c => c.id !== editingComp?.id && (c.codigo === compCodigo || c.nombre === compNombre));
    if (existing) {
      showMessage("Ya existe una competencia con este código o nombre en este programa.", "error");
      return;
    }

    try {
      let resp;
      if (editingComp) {
        resp = await fetch(`/api/competencias/${editingComp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: compCodigo,
            nombre: compNombre,
            duracionHoras: Number(compDuracion),
            porcentajeHorasDirectas: Number(compPorcentajeDirectas)
          })
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al actualizar");
        setEditingComp(null);
      } else {
        resp = await fetch(`/api/programas/${programa.id}/competencias`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: compCodigo,
            nombre: compNombre,
            duracionHoras: Number(compDuracion),
            porcentajeHorasDirectas: Number(compPorcentajeDirectas)
          })
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al crear");
      }
      setCompCodigo("");
      setCompNombre("");
      setCompDuracion("");
      setCompPorcentajeDirectas("80");
      fetchCompetencias();
      showMessage("Competencia guardada correctamente", "success");
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al guardar competencia");
    }
  };

  const handleDeleteCompetencia = async (id: number) => {
    const compResultados = resultados[id] || [];
    const compPerfiles = perfiles[id] || [];
    if (compResultados.length > 0 || compPerfiles.length > 0) {
      showMessage("No puede borrar la competencia si tiene resultados o perfiles asociados. Bórrelos primero.", "error");
      return;
    }

    try {
      const resp = await fetch(`/api/competencias/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al borrar");
      showMessage("Competencia eliminada", "success");
      fetchCompetencias();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al borrar competencia");
    }
  };

  const handleSaveResultado = async (e: React.FormEvent, compId: number) => {
    e.preventDefault();
    
    const comp = competencias.find(c => c.id === compId);
    if (!comp) return;

    const currentHorasRs = resultados[compId] || [];
    const sumOthers = currentHorasRs.filter(r => r.id !== editingRes?.id).reduce((sum, r) => sum + r.duracionHoras, 0);
    const newVal = Number(resDuracion);
    if (sumOthers + newVal > comp.duracionHoras) {
      showMessage(`La suma de las horas de los resultados no puede superar las ${comp.duracionHoras} horas de la competencia. Quedan disponibles ${comp.duracionHoras - sumOthers} horas.`);
      return;
    }

    try {
      let resp;
      if (editingRes) {
        resp = await fetch(`/api/resultados/${editingRes.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: resCodigo,
            nombre: resNombre,
            duracionHoras: newVal,
            fase: resFase
          })
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al actualizar");
        setEditingRes(null);
      } else {
        resp = await fetch(`/api/competencias/${compId}/resultados`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: resCodigo,
            nombre: resNombre,
            duracionHoras: newVal,
            fase: resFase
          })
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al crear");
      }
      setResCodigo("");
      setResNombre("");
      setResDuracion("");
      setResFase("Analisis");
      setActiveTab(null);
      fetchCompetencias();
      showMessage("Resultado guardado correctamente", "success");
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al guardar resultado");
    }
  };

  const handleDeleteResultado = async (id: number) => {
    try {
      const resp = await fetch(`/api/resultados/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error interno");
      showMessage("Resultado eliminado", "success");
      fetchCompetencias();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al borrar resultado");
    }
  };

  const handleAddPerfil = async (e: React.FormEvent, compId: number) => {
    e.preventDefault();
    const existing = perfiles[compId]?.find(p => p.id !== editingPerfil?.id && (p.codigo === perfilCodigo || p.nombre === perfilNombre));
    if (existing) {
      showMessage("Ya existe un perfil con ese código o nombre en esta competencia.");
      return;
    }

    try {
      let resp;
      if (editingPerfil) {
        resp = await fetch(`/api/perfiles/${editingPerfil.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: perfilCodigo,
            nombre: perfilNombre
          })
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al actualizar");
        showMessage("Perfil actualizado", "success");
      } else {
        resp = await fetch(`/api/competencias/${compId}/perfiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: perfilCodigo,
            nombre: perfilNombre
          })
        });
        if (!resp.ok) throw new Error((await resp.json()).error || "Error al crear");
        showMessage("Perfil creado", "success");
      }
      setEditingPerfil(null);
      setPerfilCodigo("");
      setPerfilNombre("");
      setActiveTab(null);
      fetchCompetencias();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al guardar perfil");
    }
  };

  const handleDeletePerfil = async (id: number) => {
    try {
      const resp = await fetch(`/api/perfiles/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al borrar");
      showMessage("Perfil eliminado", "success");
      fetchCompetencias();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al borrar el perfil");
    }
  };

  const toggleExpand = (compId: number) => {
    if (expandedComp === compId) {
      setExpandedComp(null);
      setActiveTab(null);
      setEditingRes(null);
      setResCodigo("");
      setResNombre("");
      setResDuracion("");
      setResFase("Analisis");
      setEditingPerfil(null);
    } else {
      setExpandedComp(compId);
    }
  };

  const editCompetencia = (comp: Competencia) => {
    setEditingComp(comp);
    setCompCodigo(comp.codigo);
    setCompNombre(comp.nombre);
    setCompDuracion(comp.duracionHoras.toString());
    setCompPorcentajeDirectas(comp.porcentajeHorasDirectas?.toString() || "80");
  };

  const cancelEditComp = () => {
    setEditingComp(null);
    setCompCodigo("");
    setCompNombre("");
    setCompDuracion("");
    setCompPorcentajeDirectas("80");
  };

  const editResultado = (res: ResultadoAprendizaje, compId: number) => {
    setExpandedComp(compId);
    setActiveTab("RA");
    setEditingRes(res);
    setResCodigo(res.codigo || "");
    setResNombre(res.nombre);
    setResDuracion(res.duracionHoras.toString());
    setResFase(res.fase || "Analisis");
  };

  const editPerfil = (perfil: PerfilInstructor, compId: number) => {
    setExpandedComp(compId);
    setActiveTab("Perfil");
    setEditingPerfil(perfil);
    setPerfilCodigo(perfil.codigo);
    setPerfilNombre(perfil.nombre);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Contenidos Curriculares</h2>
            <p className="text-sm text-gray-500">Programa: {programa.denominacion} (v{programa.version})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className={`mx-4 mt-4 p-3 rounded-md text-sm border font-medium flex items-center justify-between ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Add/Edit Competencia Form */}
          <div className="bg-white border text-sm rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              {editingComp ? (
                <><Pencil className="w-4 h-4 text-blue-600" /> Editando Competencia</>
              ) : (
                <><Plus className="w-4 h-4 text-green-600" /> Nueva Competencia</>
              )}
            </h3>
            <form onSubmit={handleSaveCompetencia} className="flex gap-3 items-end flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-gray-500 mb-1">Código</label>
                <input required type="text" list="comp-codigos" value={compCodigo} onChange={e => {
                  const val = e.target.value;
                  setCompCodigo(val);
                  if (!editingComp) {
                    const found = uniqueCompetencias.find(c => c.codigo === val);
                    if (found) {
                      setCompNombre(found.nombre);
                      setCompDuracion(found.duracionHoras.toString());
                    }
                  }
                }} className="w-full border rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" />
                <datalist id="comp-codigos">
                  {uniqueCompetencias.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                </datalist>
              </div>
              <div className="flex-[3] min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">Nombre de la Competencia</label>
                <input required type="text" value={compNombre} onChange={e => setCompNombre(e.target.value)} className="w-full border rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="block text-xs text-gray-500 mb-1">Duración (H)</label>
                <input required type="number" min="1" value={compDuracion} onChange={e => setCompDuracion(e.target.value)} className="w-full border rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-gray-500 mb-1">% Ejecución Horas Directas</label>
                <select value={compPorcentajeDirectas} onChange={e => setCompPorcentajeDirectas(e.target.value)} className="w-full border rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition bg-white">
                  <option value="70">70%</option>
                  <option value="80">80%</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                {editingComp && <button type="button" onClick={cancelEditComp} className="text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded text-xs">Cancelar</button>}
                <button type="submit" className={`${editingComp ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-1.5 rounded transition`}>
                  {editingComp ? 'Guardar' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>

          {/* List of Competencias */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando currículo...</div>
            ) : competencias.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                Aún no hay competencias registradas.
              </div>
            ) : (
              competencias.map(comp => {
                const resultsForComp = resultados[comp.id] || [];
                const perfilesForComp = perfiles[comp.id] || [];
                const sumHorasResultados = resultsForComp.reduce((sum, r) => sum + r.duracionHoras, 0);
                const isHoursValid = sumHorasResultados === comp.duracionHoras;
                const hoursRemaining = comp.duracionHoras - sumHorasResultados;
                const isExpanded = expandedComp === comp.id;

                return (
                  <div key={comp.id} className="border rounded-lg bg-white shadow-sm overflow-hidden text-sm">
                    {/* Competencia Header */}
                    <div 
                      className={`p-3 flex items-center justify-between cursor-pointer transition ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleExpand(comp.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-mono">{comp.codigo}</span>
                            {comp.nombre}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500">Duración: <strong className="text-gray-700">{comp.duracionHoras}h</strong></span>
                            {isHoursValid ? (
                              <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Horas de resultados cuadran</span>
                            ) : (
                              <span className={`text-xs flex items-center gap-1 ${hoursRemaining > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                                <AlertCircle className="w-3 h-3"/> {hoursRemaining > 0 ? `Faltan ${hoursRemaining}h por asignar` : `Sobra asignación por ${Math.abs(hoursRemaining)}h`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          {hayAcciones && (
                            <>
                              <button onClick={() => { setExpandedComp(comp.id); setActiveTab("RA"); setEditingRes(null); setResCodigo(""); setResNombre(""); setResDuracion(""); }} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition whitespace-nowrap">
                                + Añadir RA
                              </button>
                              <button onClick={() => { setExpandedComp(comp.id); setActiveTab("Perfil"); setEditingPerfil(null); setPerfilCodigo(""); setPerfilNombre(""); }} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition whitespace-nowrap">
                                + Añadir Perfil
                              </button>
                            </>
                          )}
                          {mayEditar && (
                            <button onClick={() => editCompetencia(comp)} className="text-blue-500 p-1 hover:text-blue-700 hover:bg-blue-50 rounded transition" title="Editar competencia">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {mayEliminar && (
                            <button onClick={() => handleDeleteCompetencia(comp.id)} className="text-red-400 p-1 hover:text-red-600 hover:bg-red-50 rounded transition" title="Borrar competencia">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Expandable Sections */}
                    {isExpanded && (
                      <div className="bg-gray-50 border-t p-4 flex flex-col lg:flex-row gap-6">
                        
                        {/* Section: Resultados */}
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Resultados de Aprendizaje</h4>
                          <div className="space-y-2 mb-4">
                            {resultsForComp.length === 0 ? (
                              <div className="text-xs text-gray-400 italic">No hay resultados de aprendizaje.</div>
                            ) : (
                              resultsForComp.map(res => (
                                <div key={res.id} className="flex items-center justify-between bg-white p-2 border rounded-md shadow-sm text-xs">
                                  <div className="flex items-center gap-2">
                                    {res.codigo && <span className="font-mono text-[10px] bg-slate-100 px-1 rounded text-slate-600 border">{res.codigo}</span>}
                                    <span className="text-gray-800 font-medium">{res.nombre}</span>
                                  </div>
                                     <div className="flex items-center gap-2 flex-shrink-0">
                                     <span className="font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded whitespace-nowrap">{res.fase || 'Analisis'}</span>
                                     <span className="font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">{res.duracionHoras} hrs</span>
                                     <span className={`font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap`} title={`Horas Directas (${comp.porcentajeHorasDirectas}%)`}>{Math.floor(res.duracionHoras * ((comp.porcentajeHorasDirectas || 80) / 100))} hrs Dir.</span>
                                     {mayEditar && (
                                       <button onClick={() => editResultado(res, comp.id)} className="text-blue-400 hover:text-blue-600 ml-2">
                                         <Pencil className="w-3.5 h-3.5" />
                                       </button>
                                     )}
                                     {mayEliminar && (
                                       <button onClick={() => handleDeleteResultado(res.id)} className="text-gray-400 hover:text-red-600">
                                         <Trash2 className="w-3.5 h-3.5" />
                                       </button>
                                     )}
                                   </div>
                                </div>
                              ))
                            )}
                          </div>

                          {activeTab === "RA" && (
                            <div className="bg-white p-3 border rounded border-blue-200 shadow-sm mt-3 animate-in fade-in zoom-in-95 duration-200">
                              <h5 className="text-xs font-semibold text-blue-800 mb-2">{editingRes ? 'Editar' : 'Nuevo'} Resultado de Aprendizaje</h5>
                              <form onSubmit={(e) => handleSaveResultado(e, comp.id)} className="flex gap-2">
                                <input type="text" placeholder="Código (Opcional)" value={resCodigo} onChange={e => setResCodigo(e.target.value)} className="w-24 border rounded text-xs px-2 py-1.5 focus:border-blue-500 outline-none" />
                                <input required type="text" placeholder="Nombre del resultado..." value={resNombre} onChange={e => setResNombre(e.target.value)} className="flex-[3] border rounded text-xs px-2 py-1.5 focus:border-blue-500 outline-none" />
                                <input required type="number" min="1" placeholder="Horas" value={resDuracion} onChange={e => setResDuracion(e.target.value)} className="w-20 border rounded text-xs px-2 py-1.5 focus:border-blue-500 outline-none" />
                                <input type="number" placeholder={`Dir. (${comp.porcentajeHorasDirectas}%)`} value={resDuracion ? Math.floor(Number(resDuracion) * ((comp.porcentajeHorasDirectas || 80) / 100)) : ""} disabled className="w-20 border rounded text-xs px-2 py-1.5 bg-gray-100 text-gray-500 outline-none cursor-not-allowed" title={`Horas directas ${comp.porcentajeHorasDirectas}%`} />
                                <select value={resFase} onChange={e => setResFase(e.target.value)} className="w-[120px] border rounded text-xs px-2 py-1.5 focus:border-blue-500 outline-none bg-white font-medium text-gray-700">
                                  <option value="Analisis">Analisis</option>
                                  <option value="Planeación">Planeación</option>
                                  <option value="Ejecución">Ejecución</option>
                                  <option value="Evaluación">Evaluación</option>
                                  <option value="Complementario">Complementario</option>
                                </select>
                                <button type="submit" disabled={!resNombre || !resDuracion} className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-xs font-medium disabled:opacity-50">Guardar</button>
                                <button type="button" onClick={() => { setActiveTab(null); setEditingRes(null); setResCodigo(""); setResNombre(""); setResDuracion(""); setResFase("Analisis"); }} className="text-gray-500 px-2 hover:bg-gray-100 rounded text-xs">Cancelar</button>
                              </form>
                            </div>
                          )}
                        </div>

                        {/* Section: Perfiles del Instructor */}
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Perfiles del Instructor</h4>
                          <div className="space-y-2 mb-4">
                            {perfilesForComp.length === 0 ? (
                              <div className="text-xs text-gray-400 italic">No hay perfiles asociados.</div>
                            ) : (
                              perfilesForComp.map(perfil => (
                                <div key={perfil.id} className="flex items-center justify-between bg-white p-2 border rounded-md shadow-sm text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] bg-slate-100 px-1 rounded text-slate-600 border">{perfil.codigo}</span>
                                    <span className="text-gray-800">{perfil.nombre}</span>
                                  </div>
                                   <div className="flex items-center gap-2 ml-4">
                                     {mayEditar && (
                                       <button onClick={() => editPerfil(perfil, comp.id)} className="text-blue-400 hover:text-blue-600">
                                         <Pencil className="w-3.5 h-3.5" />
                                       </button>
                                     )}
                                     {mayEliminar && (
                                       <button onClick={() => handleDeletePerfil(perfil.id)} className="text-gray-400 hover:text-red-600">
                                         <Trash2 className="w-3.5 h-3.5" />
                                       </button>
                                     )}
                                   </div>
                                </div>
                              ))
                            )}
                          </div>

                          {activeTab === "Perfil" && (
                            <div className="bg-white p-3 border rounded border-indigo-200 shadow-sm mt-3 animate-in fade-in zoom-in-95 duration-200">
                              <h5 className="text-xs font-semibold text-indigo-800 mb-2">{editingPerfil ? 'Editar' : 'Añadir'} Perfil del Instructor</h5>
                              <form onSubmit={(e) => handleAddPerfil(e, comp.id)} className="flex gap-2">
                                <input required type="text" list="perf-codigos" placeholder="Código" value={perfilCodigo} onChange={e => {
                                  const val = e.target.value;
                                  setPerfilCodigo(val);
                                  if (!editingPerfil) {
                                    const found = uniquePerfiles.find(p => p.codigo === val);
                                    if (found) setPerfilNombre(found.nombre);
                                  }
                                }} className="w-24 border rounded text-xs px-2 py-1.5 focus:border-indigo-500 outline-none" />
                                <datalist id="perf-codigos">
                                  {uniquePerfiles.map(p => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
                                </datalist>
                                <input required type="text" placeholder="Nombre del perfil..." value={perfilNombre} onChange={e => setPerfilNombre(e.target.value)} className="flex-1 border rounded text-xs px-2 py-1.5 focus:border-indigo-500 outline-none" />
                                <button type="submit" disabled={!perfilCodigo || !perfilNombre} className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 text-xs font-medium disabled:opacity-50">Guardar</button>
                                <button type="button" onClick={() => { setActiveTab(null); setEditingPerfil(null); }} className="text-gray-500 px-2 hover:bg-gray-100 rounded text-xs">Cancelar</button>
                              </form>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
