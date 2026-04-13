import { useState, useEffect, useCallback } from 'react';
import { getJson } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../contexts/AuthContext';

export interface NotifItem {
  notificacionID: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fechaCreacion: string;
  referencia?: string;
}

export function useNotificaciones() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!user) { setNotificaciones([]); return; }
    setLoading(true);
    try {
      const res = await getJson('/api/notificaciones');
      const lista = (res?.data || res || []) as NotifItem[];
      setNotificaciones(lista.sort((a, b) =>
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      ));
    } catch { /* silently ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    cargar();
    const onLogin = () => cargar();
    const onLogout = () => setNotificaciones([]);
    window.addEventListener('auth:login', onLogin);
    window.addEventListener('auth:logout', onLogout);
    return () => {
      window.removeEventListener('auth:login', onLogin);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, [cargar]);

  const marcarLeida = async (id: number) => {
    try {
      await api.fetchWithAuth(`/api/notificaciones/${id}/marcar-leida`, { method: 'PUT' });
      setNotificaciones(prev => prev.map(n => n.notificacionID === id ? { ...n, leida: true } : n));
    } catch { /* ignore */ }
  };

  const marcarTodas = async () => {
    try {
      await api.fetchWithAuth('/api/notificaciones/marcar-todas-leidas', { method: 'POST' });
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch { /* ignore */ }
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return { notificaciones, loading, noLeidas, cargar, marcarLeida, marcarTodas };
}
