import React, { useEffect, useState, useCallback } from 'react';
import { ChevronRight, Loader2, Mail, Send, Trash2, Users } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { toast } from '@/lib/toast';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { getJson, postJson, deleteJson } from '../../../services/api';

interface Suscriptor {
  suscriptorID: number;
  email: string;
  activo: boolean;
  fechaSuscripcion: string;
}

export const NewsletterView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('productos:editar');

  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmarEnvioOpen, setConfirmarEnvioOpen] = useState(false);
  const [eliminarId, setEliminarId] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getJson<{ data?: Suscriptor[] }>('/api/admin/suscriptores');
      setSuscriptores(r?.data ?? []);
    } catch {
      toast.error('No se pudieron cargar los suscriptores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const activos = suscriptores.filter(s => s.activo);

  const enviarCampana = async () => {
    if (!asunto.trim() || !mensaje.trim()) { toast.error('Completa el asunto y el mensaje'); return; }
    setEnviando(true);
    try {
      const r: any = await postJson('/api/admin/suscriptores/enviar', { Asunto: asunto, Mensaje: mensaje });
      toast.success(r?.message || r?.data?.message || 'Correo enviado');
      setAsunto(''); setMensaje(''); setConfirmarEnvioOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Error enviando el correo');
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async () => {
    if (eliminarId == null) return;
    setEliminando(true);
    try {
      await deleteJson(`/api/admin/suscriptores/${eliminarId}`);
      toast.success('Suscriptor eliminado');
      setEliminarId(null);
      cargar();
    } catch { toast.error('Error eliminando suscriptor'); }
    finally { setEliminando(false); }
  };

  return (
    <div className="p-8 bg-[#FBF8F5] dark:bg-[#2a2029] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b8a3ac]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b8a3ac]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#241B22] dark:text-[#F5EDE9]">Newsletter</span>
      </div>
      <div className="mb-6">
        <h1 className="admin-page-title text-3xl font-bold text-[#241B22] dark:text-[#F5EDE9]">Newsletter</h1>
        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 dark:text-[#b8a3ac] text-sm mt-1">
          {loading ? 'Cargando...' : `${activos.length} suscriptores activos de ${suscriptores.length} en total`}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enviar promoción */}
        <div className="bg-white dark:bg-[#322631] rounded-xl border border-[#E7E0DA] dark:border-[#453840] shadow-sm overflow-hidden h-fit">
          <div className="bg-[#FBF8F5] dark:bg-[#2a2029] px-6 py-4 border-b border-[#E7E0DA] dark:border-[#453840]">
            <h3 className="font-semibold text-[#241B22] dark:text-[#F5EDE9] text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-[#A3395C]" /> Enviar promoción
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-[#F5EDE9]">Asunto</Label>
              <Input value={asunto} onChange={e => setAsunto(e.target.value)}
                placeholder="Ej: Nueva colección disponible ✨" className="h-10 border-gray-300 dark:border-[#453840]" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-[#F5EDE9]">Mensaje</Label>
              <textarea value={mensaje} onChange={e => setMensaje(e.target.value)}
                rows={6}
                placeholder="Escribe el contenido del correo..."
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#453840] rounded-xl text-sm focus:outline-none focus:border-[#A3395C] resize-none bg-white dark:bg-[#2a2029] text-gray-900 dark:text-[#F5EDE9] transition" />
            </div>
            <button
              onClick={() => { if (!asunto.trim() || !mensaje.trim()) { toast.error('Completa el asunto y el mensaje'); return; } setConfirmarEnvioOpen(true); }}
              disabled={enviando || activos.length === 0}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-[#241B22] via-[#7a3350] to-[#A3395C] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition font-semibold text-sm">
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar a {activos.length} suscriptores
            </button>
            {activos.length === 0 && !loading && (
              <p className="text-xs text-gray-400 dark:text-[#b8a3ac] text-center">Todavía no hay suscriptores activos.</p>
            )}
          </div>
        </div>

        {/* Lista de suscriptores */}
        <div className="bg-white dark:bg-[#322631] rounded-xl border border-[#E7E0DA] dark:border-[#453840] shadow-sm overflow-hidden h-fit">
          <div className="bg-[#FBF8F5] dark:bg-[#2a2029] px-6 py-4 border-b border-[#E7E0DA] dark:border-[#453840]">
            <h3 className="font-semibold text-[#241B22] dark:text-[#F5EDE9] text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A3395C]" /> Suscriptores
            </h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : suscriptores.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-[#b8a3ac] text-sm">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Todavía no hay suscriptores.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-[#453840]">
              {suscriptores.map(s => (
                <div key={s.suscriptorID} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-[#F5EDE9]">{s.email}</p>
                    <p className="text-xs text-gray-400 dark:text-[#b8a3ac]">
                      {new Date(s.fechaSuscripcion).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${s.activo ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-[#362b34] text-gray-400 dark:text-[#b8a3ac]'}`}>
                      {s.activo ? 'Activo' : 'Dado de baja'}
                    </span>
                    {puedeEditar && (
                      <button onClick={() => setEliminarId(s.suscriptorID)}
                        className="p-1.5 text-gray-400 dark:text-[#b8a3ac] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmar envío */}
      <AlertDialog open={confirmarEnvioOpen} onOpenChange={v => { if (!enviando) setConfirmarEnvioOpen(v); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar promoción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará "<strong>{asunto}</strong>" a <strong>{activos.length}</strong> suscriptores activos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={enviarCampana} disabled={enviando}
              className="bg-[#A3395C] hover:bg-[#8a2e4d] flex items-center gap-2">
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />} Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar eliminar */}
      <AlertDialog open={eliminarId != null} onOpenChange={v => { if (!eliminando && !v) setEliminarId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar suscriptor?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar} disabled={eliminando}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2">
              {eliminando && <Loader2 className="w-4 h-4 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
