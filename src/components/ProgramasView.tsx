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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeProgramaCurriculo, setActiveProgramaCurriculo] = useState<Programa | null>(null);

  const [notification, setNotification] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showMessage = (text: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
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
      cancelEdit();
      fetchData();
    } catch (e: any) {
      console.error(e);
      showMessage(e.message || "Error al guardar el programa");
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
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDenominacion("");
    setCodigo("");
    setVersion("");
    setHorasLectiva("");
    setHorasProductiva("");
    setTipoPrograma("Técnico");
    setPdfDocument("");
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
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Programas de Formación</h1>
      </div>

      {notification && (
        <div className={`p-4 rounded-md text-sm border font-medium flex items-center justify-between ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {(mayCrear || editingId !== null) && (
          <div className="xl:col-span-1 border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b bg-gray-50 shrink-0">
              <h2 className="text-lg font-medium">{editingId ? "Editar Programa" : "Nuevo Programa"}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Denominación del Programa</label>
                <input type="text" required value={denominacion} onChange={e => setDenominacion(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código</label>
                  <input type="text" required value={codigo} onChange={e => setCodigo(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Versión</label>
                  <input type="text" required value={version} onChange={e => setVersion(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Horas Etapa Lectiva</label>
                  <input type="number" required value={horasLectiva} onChange={e => setHorasLectiva(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Horas Etapa Productiva</label>
                  <input type="number" required value={horasProductiva} onChange={e => setHorasProductiva(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Programa</label>
                <select required value={tipoPrograma} onChange={e => setTipoPrograma(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value="Técnico">Técnico</option>
                  <option value="Tecnólogo">Tecnólogo</option>
                  <option value="Especialización Tecnológica">Especialización Tecnológica</option>
                  <option value="Operario">Operario</option>
                  <option value="Auxiliar">Auxiliar</option>
                  <option value="Curso Especial">Curso Especial</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 sticky bottom-0 bg-white border-t mt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium">
                  {editingId ? "Actualizar" : <><Plus className="w-4 h-4" /> Agregar</>}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 text-sm font-medium">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className={(mayCrear || editingId !== null) ? "xl:col-span-2" : "xl:col-span-3"}>
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
                            <button onClick={() => setDeletingId(p.id)} className="text-gray-400 hover:text-red-600 transition p-1" title="Eliminar">
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
        </div>
      </div>

      {activeProgramaCurriculo && (
        <CurriculoModal programa={activeProgramaCurriculo} onClose={() => setActiveProgramaCurriculo(null)} />
      )}
      <ConfirmDialog
        title="Eliminar Programa"
        message="¿Estás seguro de que deseas eliminar este programa de formación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        danger={true}
        isOpen={deletingId !== null}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => { if (deletingId) { handleDelete(deletingId); setDeletingId(null); } }}
      />
    </div>
  );
}
