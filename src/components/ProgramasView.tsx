import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, FileText, Download, List, X } from "lucide-react";
import CurriculoModal from "./CurriculoModal";
import { useHasPermission, useHasAnyPermission } from "../lib/auth-context";
import ConfirmDialog from "./ConfirmDialog";

export interface Programa {
  id: number;
  denominacion: string;
  codigo: string;
  version: string;
  horasLectiva: number;
  horasProductiva: number;
  tipoPrograma: string;
  pdfDocument?: string;
}

export default function ProgramasView() {
  const mayCrear = useHasPermission('programas.crear');
  const mayEditar = useHasPermission('programas.editar');
  const mayEliminar = useHasPermission('programas.eliminar');
  const hayAcciones = mayCrear || mayEditar || mayEliminar;
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeProgramaCurriculo, setActiveProgramaCurriculo] = useState<Programa | null>(null);

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
      const res = await fetch(`/api/dependencias/programas/${id}`);
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

  // Form State
  const [denominacion, setDenominacion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [version, setVersion] = useState("");
  const [horasLectiva, setHorasLectiva] = useState("");
  const [horasProductiva, setHorasProductiva] = useState("");
  const [tipoPrograma, setTipoPrograma] = useState("Técnico");
  const [pdfDocument, setPdfDocument] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/programas");
      const data = await res.json();
      setProgramas(Array.isArray(data) ? data : []);
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
    setDenominacion("");
    setCodigo("");
    setVersion("");
    setHorasLectiva("");
    setHorasProductiva("");
    setTipoPrograma("Técnico");
    setPdfDocument("");
    setError(null);
  }

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfDocument(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      showMessage("Por favor cargue un archivo PDF válido.", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      denominacion,
      codigo,
      version,
      horasLectiva: Number(horasLectiva),
      horasProductiva: Number(horasProductiva),
      tipoPrograma,
      pdfDocument
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/programas/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        showMessage("Programa actualizado correctamente", "success");
      } else {
        const res = await fetch("/api/programas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        showMessage("Programa creado correctamente", "success");
      }
      handleClose();
      fetchData();
    } catch (e: any) {
      setError(e.message || "Error al guardar el programa");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Programa) => {
    setEditingId(p.id);
    setDenominacion(p.denominacion);
    setCodigo(p.codigo);
    setVersion(p.version);
    setHorasLectiva(p.horasLectiva.toString());
    setHorasProductiva(p.horasProductiva.toString());
    setTipoPrograma(p.tipoPrograma);
    setPdfDocument(p.pdfDocument || "");
    setError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const resp = await fetch(`/api/programas/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al borrar asegúrese que no existan dependencias.");
      showMessage("Programa eliminado correctamente", "success");
      fetchData();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al borrar programa");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Programas de Formación</h1>
        {mayCrear && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setDenominacion(""); setCodigo(""); setVersion(""); setHorasLectiva(""); setHorasProductiva(""); setTipoPrograma("Técnico"); setPdfDocument(""); setError(null); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg">
            <Plus className="w-4 h-4" /> Nuevo Programa
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
                <th className="px-6 py-3 font-medium text-gray-500">Programa</th>
                <th className="px-6 py-3 font-medium text-gray-500">Cod / Version</th>
                <th className="px-6 py-3 font-medium text-gray-500">Tipo</th>
                <th className="px-6 py-3 font-medium text-gray-500">Total Horas</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y relative">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : programas.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay programas registrados.</td></tr>
              ) : (
                programas.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 align-top">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 whitespace-normal min-w-[200px]">{p.denominacion}</div>
                      {p.pdfDocument && (
                        <a href={p.pdfDocument} download={`Programa_${p.codigo}.pdf`} className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                          <Download className="w-3 h-3" /> Descargar PDF
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <div>{p.codigo}</div>
                      <div className="text-xs text-gray-500">v{p.version}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{p.tipoPrograma}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{p.horasLectiva + p.horasProductiva} h</div>
                      <div className="text-xs text-gray-500 mt-1">Lectiva: {p.horasLectiva} h</div>
                      <div className="text-xs text-gray-500">Productiva: {p.horasProductiva} h</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setActiveProgramaCurriculo(p)} className="text-gray-400 hover:text-green-600 transition p-1" title="Contenidos Curriculares">
                        <List className="w-4 h-4" />
                      </button>
                      {mayEditar && (
                        <button onClick={() => handleEdit(p)} className="text-gray-400 hover:text-blue-600 transition p-1" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {mayEliminar && (
                        <button onClick={() => handleTrashClick(p.id)} className="text-gray-400 hover:text-red-600 transition p-1" title="Eliminar">
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

      {activeProgramaCurriculo && (
        <CurriculoModal programa={activeProgramaCurriculo} onClose={() => setActiveProgramaCurriculo(null)} />
      )}

      {showForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
          onClick={handleClose}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar Programa' : 'Nuevo Programa'}</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Denominación del Programa</label>
                <input type="text" value={denominacion} onChange={e => setDenominacion(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
                  <input type="text" value={version} onChange={e => setVersion(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas Etapa Lectiva</label>
                  <input type="number" value={horasLectiva} onChange={e => setHorasLectiva(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas Etapa Productiva</label>
                  <input type="number" value={horasProductiva} onChange={e => setHorasProductiva(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Programa</label>
                <select value={tipoPrograma} onChange={e => setTipoPrograma(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="Técnico">Técnico</option>
                  <option value="Tecnólogo">Tecnólogo</option>
                  <option value="Especialización Tecnológica">Especialización Tecnológica</option>
                  <option value="Operario">Operario</option>
                  <option value="Auxiliar">Auxiliar</option>
                  <option value="Curso Especial">Curso Especial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento PDF</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="border border-dashed rounded-lg px-3 py-2 text-sm text-gray-500 hover:border-green-500 hover:text-green-600 text-center">
                      <FileText className="w-4 h-4 inline mr-1" /> Seleccionar PDF
                    </div>
                    <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                  </label>
                  {pdfDocument && (
                    <button type="button" onClick={() => setPdfDocument("")} className="text-red-500 hover:text-red-700 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {pdfDocument && <p className="text-xs text-green-600 mt-1">PDF cargado ({Math.round((pdfDocument.length * 3) / 4 / 1024)} KB)</p>}
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving || !denominacion.trim() || !codigo.trim() || !version.trim() || !horasLectiva || !horasProductiva}
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
        title="Eliminar Programa"
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
        title="Eliminar Programa"
        message="¿Estás seguro de que deseas eliminar este programa de formación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        danger
        onConfirm={() => { if (deletingId !== null) { handleDelete(deletingId); setDeletingId(null); } setPasoDialogo('ninguno'); }}
        onClose={() => { setDeletingId(null); setPasoDialogo('ninguno'); }}
      />
    </div>
  );
}
