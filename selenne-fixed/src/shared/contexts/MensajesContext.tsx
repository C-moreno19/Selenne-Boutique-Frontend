import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Mensaje {
  id: string;
  idVenta: string; // Referencia a la venta
  emailCliente: string;
  emailAdmin?: string; // Email del admin para respuestas
  remitente: 'admin' | 'cliente';
  contenido: string;
  tipo: 'aprobacion' | 'rechazo' | 'notificacion' | 'consulta' | 'pago-incompleto' | 'respuesta-cliente' | 'cambio-contrasena' | 'cambio-perfil' | 'nuevo-cliente';
  fecha: string;
  leido: boolean;
  respondidoA?: string; // ID del mensaje al que responde
  destinatarios?: string[]; // 'admin' | 'cliente' para saber a quién va
  enviadoPorEmail?: boolean; // Si fue enviado por email
}

export interface LogCambio {
  id: string;
  usuarioID: number;
  tipo: 'contrasena' | 'perfil' | 'email';
  campoModificado: string;
  valorAnterior: string;
  valorNuevo: string;
  origen: 'Seguridad' | 'InformacionPersonal' | 'RegistroInicial';
  fecha: string;
  notificacionEnviada: boolean;
}

interface MensajesContextType {
  mensajes: Mensaje[];
  cambios: LogCambio[];
  crearMensaje: (mensaje: Omit<Mensaje, 'id' | 'fecha' | 'leido'>) => void;
  marcarComoLeido: (id: string) => void;
  obtenerMensajesPorVenta: (idVenta: string) => Mensaje[];
  obtenerMensajesPorCliente: (emailCliente: string) => Mensaje[];
  obtenerMensajesAdmin: () => Mensaje[]; // Nuevos mensajes para admin
  obtenerRespuestasClientes: () => Mensaje[]; // Respuestas de clientes al admin
  eliminarMensaje: (id: string) => void;
  enviarEmailNotificacion: (email: string, asunto: string, contenido: string, tipo: string) => void;
  registrarCambio: (cambio: Omit<LogCambio, 'id' | 'fecha'>) => void;
  obtenerCambiosPorUsuario: (usuarioID: number) => LogCambio[];
  obtenerPedidosNuevos: () => Mensaje[];
}

const MensajesContext = createContext<MensajesContextType | undefined>(undefined);

export const MensajesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => {
    try {
      const stored = localStorage.getItem('selenne_mensajes');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading mensajes from localStorage:', error);
    }
    return [];
  });

  const [cambios, setCambios] = useState<LogCambio[]>(() => {
    try {
      const stored = localStorage.getItem('selenne_cambios');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading cambios from localStorage:', error);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('selenne_mensajes', JSON.stringify(mensajes));
  }, [mensajes]);

  // si hay una API, cargar notificaciones/mensajes iniciales desde el servidor
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || '';
    if (!API) return;

    fetch(`${API}/notificaciones`, {
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: Mensaje[]) => {
        // escribir solo si el backend responde con un arreglo
        if (Array.isArray(data)) {
          setMensajes(prev => {
            // evitar duplicados utilizando IDs
            const existingIds = new Set(prev.map(m => m.id));
            const nuevos = data.filter(m => !existingIds.has(m.id));
            return [...nuevos, ...prev];
          });
        }
      })
      .catch(err => console.warn('No se pudo cargar notificaciones desde servidor:', err));
  }, []);

  useEffect(() => {
    localStorage.setItem('selenne_cambios', JSON.stringify(cambios));
  }, [cambios]);

  const crearMensaje = (mensaje: Omit<Mensaje, 'id' | 'fecha' | 'leido'>) => {
    const nuevoMensaje: Mensaje = {
      ...mensaje,
      id: `msg-${Date.now()}`,
      fecha: new Date().toLocaleString('es-CO'),
      leido: false
    };
    setMensajes(prev => [nuevoMensaje, ...prev]);
    
    // Si es un mensaje de cambios de perfil o contraseña, enviar email notificación automáticamente
    if (['cambio-contrasena', 'cambio-perfil', 'nuevo-cliente'].includes(mensaje.tipo)) {
      const asuntos: Record<string, string> = {
        'cambio-contrasena': 'Tu contraseña ha sido actualizada',
        'cambio-perfil': 'Tu información personal ha sido actualizada',
        'nuevo-cliente': 'Bienvenido a Selenne Boutique'
      };
      enviarEmailNotificacion(
        mensaje.emailCliente,
        asuntos[mensaje.tipo] || 'Notificación',
        mensaje.contenido,
        mensaje.tipo
      );
    }
  };

  const marcarComoLeido = (id: string) => {
    setMensajes(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, leido: true } : msg))
    );
  };

  const obtenerMensajesPorVenta = (idVenta: string) => {
    return mensajes.filter(msg => msg.idVenta === idVenta).sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  const obtenerMensajesPorCliente = (emailCliente: string) => {
    return mensajes
      .filter(msg => msg.emailCliente && msg.emailCliente.toLowerCase() === emailCliente.toLowerCase())
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const eliminarMensaje = (id: string) => {
    setMensajes(prev => prev.filter(msg => msg.id !== id));
  };

  const obtenerMensajesAdmin = () => {
    // Mensajes dirigidos al admin (respuestas de clientes y consultas)
    return mensajes
      .filter(msg => msg.destinatarios?.includes('admin') || msg.remitente === 'cliente')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const obtenerRespuestasClientes = () => {
    // Solo respuestas de clientes a comunicaciones del admin
    return mensajes
      .filter(msg => msg.tipo === 'respuesta-cliente' && msg.remitente === 'cliente')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const obtenerPedidosNuevos = () => {
    // Mensajes de tipos pedidos y nuevo-cliente para la campana del admin
    return mensajes
      .filter(msg => msg.tipo === 'nuevo-cliente' || msg.destinatarios?.includes('admin'))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // Simula envío de email (en producción se conectaría a un servicio real)
  const enviarEmailNotificacion = (email: string, asunto: string, contenido: string, tipo: string) => {
    console.log(`📧 EMAIL ENVIADO:`);
    console.log(`  Para: ${email}`);
    console.log(`  Asunto: ${asunto}`);
    console.log(`  Contenido: ${contenido}`);
    console.log(`  Tipo: ${tipo}`);
    console.log(`  Fecha: ${new Date().toLocaleString('es-CO')}`);
    
    // Simular delay de envío
    setTimeout(() => {
      console.log(`✅ Email enviado correctamente a ${email}`);
    }, 500);
  };

  const registrarCambio = (cambio: Omit<LogCambio, 'id' | 'fecha'>) => {
    const nuevoCambio: LogCambio = {
      ...cambio,
      id: `cambio-${Date.now()}`,
      fecha: new Date().toLocaleString('es-CO')
    };
    setCambios(prev => [nuevoCambio, ...prev]);
  };

  const obtenerCambiosPorUsuario = (usuarioID: number) => {
    return cambios
      .filter(c => c.usuarioID === usuarioID)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  return (
    <MensajesContext.Provider value={{ 
      mensajes, 
      cambios,
      crearMensaje, 
      marcarComoLeido, 
      obtenerMensajesPorVenta, 
      obtenerMensajesPorCliente, 
      obtenerMensajesAdmin, 
      obtenerRespuestasClientes, 
      eliminarMensaje,
      enviarEmailNotificacion,
      registrarCambio,
      obtenerCambiosPorUsuario,
      obtenerPedidosNuevos
    }}>
      {children}
    </MensajesContext.Provider>
  );
};

export const useMensajes = () => {
  const context = useContext(MensajesContext);
  if (context === undefined) {
    throw new Error('useMensajes must be used within MensajesProvider');
  }
  return context;
};

