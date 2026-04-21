import { useCallback, useEffect, useState } from "react";
import { backupsApi, getToken } from "../../api";
import type { BackupItem } from "../../types";
import { formatDateEs } from "../../utils";
import PageHeader from "../../components/PageHeader";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function BackupsPage() {
  const [items, setItems] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await backupsApi.list();
      setItems(data);
    } catch {
      setError("No se pudo cargar la lista de respaldos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function onCreate() {
    setCreating(true);
    setError(null);
    try {
      await backupsApi.create();
      await load();
    } catch {
      setError("No se pudo crear el respaldo.");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(name: string) {
    if (!confirm(`¿Eliminar el respaldo ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await backupsApi.remove(name);
      await load();
    } catch {
      setError("No se pudo eliminar el respaldo.");
    }
  }

  async function onDownload(name: string) {
    try {
      const url = backupsApi.downloadUrl(name);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError("No se pudo descargar el respaldo.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administración"
        title="Copias de seguridad"
        subtitle="Respaldos automáticos diarios de la base de datos. Retención de 30 días."
        actions={
          <button className="btn-primary" onClick={onCreate} disabled={creating}>
            {creating ? "Generando..." : "Crear respaldo ahora"}
          </button>
        }
      />

      {error && (
        <div className="card p-4 mb-6 text-sm text-rose-700">{error}</div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                <th className="text-left px-4 py-3">Archivo</th>
                <th className="text-left px-4 py-3">Creado</th>
                <th className="text-right px-4 py-3">Tamaño</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500 text-xs uppercase tracking-widest"
                  >
                    Cargando
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Aún no hay respaldos. El primero se generará al próximo inicio
                    del servidor o al pulsar "Crear respaldo ahora".
                  </td>
                </tr>
              ) : (
                items.map((b) => (
                  <tr key={b.filename} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-900">
                      {b.filename}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateEs(b.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatSize(b.size_bytes)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn-ghost"
                          onClick={() => onDownload(b.filename)}
                        >
                          Descargar
                        </button>
                        <button
                          className="btn-ghost text-rose-700"
                          onClick={() => onDelete(b.filename)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
