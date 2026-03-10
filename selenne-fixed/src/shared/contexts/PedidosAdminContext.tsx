import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface DatosCliente {
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  banco?: string;
  cuenta?: string;
}

export interface Pedido {
  id: string;
  numeroComprobante: string;
  cliente: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  numeroDocumento?: string; // Documento del cliente
  monto: number;
  fecha: string;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Completada';
  comprobante: string; // URL o base64 image
  banco: string;
  cuenta: string;
  metodoPago: string;
  idVenta?: string; // Referencia a la venta en VentasView
  items?: Array<{ // Items comprados
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    tallaSeleccionada?: string;
    colorSeleccionado?: string;
  }>;
  notas?: string; // Notas del pedido
}

interface PedidosAdminContextType {
  pedidos: Pedido[];
  crearPedido: (pedido: Pedido) => void;
  aprobarPedido: (id: string) => void;
  rechazarPedido: (id: string, razon?: string) => void;
  actualizarPedido: (id: string, datos: Partial<Pedido>) => void;
  eliminarPedido: (id: string) => void;
}

const PedidosAdminContext = createContext<PedidosAdminContextType | undefined>(undefined);

export const PedidosAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    try {
      const stored = localStorage.getItem('selenne_pedidos');
      console.log('📂 Cargando pedidos desde localStorage:', stored ? 'datos encontrados' : 'vacío');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📊 Pedidos cargados:', parsed);
        // Retornar solo pedidos válidos y completos
        const valid = parsed.filter((p: Pedido) => 
          p && 
          p.id && 
          p.estado && 
          p.cliente && 
          p.email && 
          p.numeroComprobante &&
          (p.monto === undefined || p.monto > 0)
        );
        
        // Si hay pedidos inválidos, limpiar localStorage
        if (valid.length !== parsed.length) {
          console.log(`🧹 Limpiando ${parsed.length - valid.length} pedidos incompletos`);
          localStorage.setItem('selenne_pedidos', JSON.stringify(valid));
        }
        
        return valid;
      }
    } catch (error) {
      console.error('Error loading pedidos from localStorage:', error);
    }

    // Sin datos iniciales - empezar vacío
    console.log('🆕 Inicializando con carrito vacío');
    return [];
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      console.log('💾 Guardando pedidos en localStorage:', pedidos);
      localStorage.setItem('selenne_pedidos', JSON.stringify(pedidos));
      console.log('✅ Pedidos guardados correctamente');
    } catch (error) {
      console.error('Error saving pedidos to localStorage:', error);
    }
  }, [pedidos]);

  // Sincronización continua con localStorage - verifica cambios cada 1 segundo
  useEffect(() => {
    const checkLocalStorage = () => {
      try {
        const stored = localStorage.getItem('selenne_pedidos');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Filtro mejorado: solo pedidos completos y válidos
          const validPedidos = parsed.filter((p: Pedido) => 
            p && 
            p.id && 
            p.estado && 
            p.cliente && 
            p.email && 
            p.numeroComprobante &&
            (p.monto === undefined || p.monto > 0)
          );
          
          setPedidos(currentPedidos => {
            // Comparar si hay nuevos pedidos en localStorage
            const newPedidos = validPedidos.filter(
              (p: Pedido) => !currentPedidos.find(cp => cp.id === p.id)
            );
            
            if (newPedidos.length > 0) {
              console.log('🔄 Nuevos pedidos detectados en localStorage:', newPedidos);
              return validPedidos;
            }
            
            return currentPedidos;
          });
        }
      } catch (error) {
        console.error('Error checking localStorage for new pedidos:', error);
      }
    };

    const intervalId = setInterval(checkLocalStorage, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Broadcast channel for real-time updates between tabs/windows
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      if ('BroadcastChannel' in window) {
        channelRef.current = new BroadcastChannel('selenne_pedidos_channel');
        channelRef.current.onmessage = (ev) => {
          const msg = ev.data;
          if (!msg || !msg.type) return;
          if (msg.type === 'pedido_creado') {
            setPedidos(prev => (prev.find(p => p.id === msg.pedido.id) ? prev : [...prev, msg.pedido]));
          }
          if (msg.type === 'pedido_actualizado') {
            setPedidos(prev => prev.map(p => p.id === msg.pedido.id ? msg.pedido : p));
          }
          if (msg.type === 'pedido_eliminado') {
            setPedidos(prev => prev.filter(p => p.id !== msg.id));
          }
        };
      } else {
        const onStorage = (e: StorageEvent) => {
          if (e.key === 'selenne_pedidos_broadcast' && e.newValue) {
            try {
              const msg = JSON.parse(e.newValue);
              if (msg.type === 'pedido_creado') {
                setPedidos(prev => (prev.find(p => p.id === msg.pedido.id) ? prev : [...prev, msg.pedido]));
              }
            } catch (err) {
              // ignore
            }
          }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
      }
    } catch (err) {
      console.error('BroadcastChannel init error', err);
    }

    return () => {
      try { channelRef.current?.close(); } catch (e) {}
    };
  }, []);

  const crearPedido = (pedido: Pedido) => {
    console.log('📋 crearPedido called with:', {
      id: pedido.id,
      cliente: pedido.cliente,
      estado: pedido.estado,
      monto: pedido.monto,
      email: pedido.email,
      full: pedido
    });
    
    // Validar que el pedido tenga datos requeridos
    if (!pedido.cliente || !pedido.email || !pedido.numeroComprobante || pedido.monto === 0 || pedido.monto === undefined) {
      console.warn('⚠️ Pedido incompleto rechazado:', {
        cliente: pedido.cliente,
        email: pedido.email,
        comprobante: pedido.numeroComprobante,
        monto: pedido.monto
      });
      return;
    }
    
    setPedidos(prev => {
      // Check if pedido already exists
      if (prev.find(p => p.id === pedido.id)) {
        console.log('❌ Pedido duplicado, ignorando');
        return prev;
      }
      try {
        // notify other tabs
        channelRef.current?.postMessage({ type: 'pedido_creado', pedido });
        // fallback: trigger storage event for older browsers
        try { localStorage.setItem('selenne_pedidos_broadcast', JSON.stringify({ type: 'pedido_creado', pedido })); } catch(e){}
      } catch(e){}
      console.log('✅ Pedido guardado correctamente. Total después de guardar:', prev.length + 1);
      return [...prev, pedido];
    });
  };

  const aprobarPedido = (id: string) => {
    setPedidos(prev => {
      const next = prev.map(p => p.id === id ? { ...p, estado: 'Aprobada' as const } : p);
      const updated = next.find(p => p.id === id);
      try {
        channelRef.current?.postMessage({ type: 'pedido_aprobado', pedido: updated });
        try { localStorage.setItem('selenne_pedidos_broadcast', JSON.stringify({ type: 'pedido_aprobado', pedido: updated })); } catch(e){}
      } catch (e) {}
      // Send approval email (simulated via mailto)
      try {
        if (updated?.email) {
          const subject = encodeURIComponent('✅ Pago Aprobado - Selenne Boutique');
          const body = encodeURIComponent(
            `¡Excelente! Tu pago ha sido aprobado.

Detalles de tu compra:
═════════════════════════════
Número de Pedido: ${updated.numeroComprobante}
Monto Aprobado: $${updated.monto.toLocaleString('es-CO')}
Fecha: ${updated.fecha}
Estado: ✅ APROBADA

Próximos pasos:
1. Tu pedido será preparado para envío
2. Recibirás un correo con el número de seguimiento
3. Puedes rastrear tu pedido en mi cuenta
4. Tiempo de entrega: 2-5 días hábiles

¿Dudas sobre tu compra? Contacta a admin@seleneboutique.com

Gracias por tu confianza,
Selenne Boutique 👗✨`
          );
          window.open(`mailto:${updated.email}?subject=${subject}&body=${body}`);
        }
      } catch (e) {}
      return next;
    });
  };

  const rechazarPedido = (id: string, razon?: string) => {
    setPedidos(prev => {
      const next = prev.map(p => p.id === id ? { ...p, estado: 'Rechazada' as const } : p);
      const updated = next.find(p => p.id === id);
      try {
        channelRef.current?.postMessage({ type: 'pedido_rechazado', pedido: updated });
        try { localStorage.setItem('selenne_pedidos_broadcast', JSON.stringify({ type: 'pedido_rechazado', pedido: updated })); } catch(e){}
      } catch (e) {}
      try {
        if (updated?.email) {
          const subject = encodeURIComponent('❌ Pago Rechazado - Selenne Boutique');
          const body = encodeURIComponent(
            `Hola ${updated.cliente},

Revisamos tu comprobante de pago y desafortunadamente ha sido rechazado.

Detalles:
═════════════════════════════
Número de Pedido: ${updated.numeroComprobante}
Monto Rechazado: $${updated.monto.toLocaleString('es-CO')}
Motivo del Rechazo: ${razon || 'Información incompleta o datos inválidos'}

¿Qué hacer ahora?
1. Verifica que el comprobante sea correcto y legible
2. Asegúrate de que el monto coincida exactamente con el pedido
3. Vuelve a enviarnos el comprobante
4. Nos pondremos en contacto para aclarar cualquier duda

Necesitamos tu pago completo para procesar tu pedido.
Contacta a admin@seleneboutique.com para enviar otro comprobante.

Estamos aquí para ayudarte,
Selenne Boutique 👗✨`
          );
          window.open(`mailto:${updated.email}?subject=${subject}&body=${body}`);
        }
      } catch (e) {}
      return next;
    });
  };

  const actualizarPedido = (id: string, datos: Partial<Pedido>) => {
    setPedidos(prev =>
      prev.map(p => p.id === id ? { ...p, ...datos } : p)
    );
  };

  const eliminarPedido = (id: string) => {
    setPedidos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <PedidosAdminContext.Provider
      value={{
        pedidos,
        crearPedido,
        aprobarPedido,
        rechazarPedido,
        actualizarPedido,
        eliminarPedido,
      }}
    >
      {children}
    </PedidosAdminContext.Provider>
  );
};

export const usePedidosAdmin = () => {
  const context = useContext(PedidosAdminContext);
  if (!context) {
    throw new Error('usePedidosAdmin debe usarse dentro de PedidosAdminProvider');
  }
  return context;
};
