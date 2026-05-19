import React from 'react';
import { AlertCircle, ShoppingBag, Heart, Search, PackageX, MessageSquare } from 'lucide-react';

interface EmptyStateProps {
  type?: 'cart' | 'favorites' | 'products' | 'orders' | 'messages' | 'notifications' | 'searching' | 'generic';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const getDefaultState = (type: string) => {
  const states: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
    cart: {
      title: 'Tu carrito está vacío',
      description: 'Agrega productos a tu carrito para continuar comprando',
      icon: <ShoppingBag className="w-16 h-16 text-gray-300" />,
    },
    favorites: {
      title: 'Sin favoritos',
      description: 'Marca productos como favoritos para guardarlos aquí',
      icon: <Heart className="w-16 h-16 text-gray-300" />,
    },
    products: {
      title: 'Sin productos disponibles',
      description: 'No hay productos disponibles en este momento',
      icon: <PackageX className="w-16 h-16 text-gray-300" />,
    },
    orders: {
      title: 'Sin pedidos',
      description: 'Aún no has realizado ningún pedido',
      icon: <ShoppingBag className="w-16 h-16 text-gray-300" />,
    },
    messages: {
      title: 'Sin mensajes',
      description: 'Aquí aparecerán tus mensajes',
      icon: <MessageSquare className="w-16 h-16 text-gray-300" />,
    },
    notifications: {
      title: 'Sin notificaciones',
      description: 'Volveremos a contactarte cuando haya novedades',
      icon: <AlertCircle className="w-16 h-16 text-gray-300" />,
    },
    searching: {
      title: 'Sin resultados',
      description: 'Intenta con otras palabras clave',
      icon: <Search className="w-16 h-16 text-gray-300" />,
    },
    generic: {
      title: 'Sin contenido',
      description: 'No hay nada que mostrar aquí',
      icon: <AlertCircle className="w-16 h-16 text-gray-300" />,
    },
  };

  return states[type] || states.generic;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  const defaultState = getDefaultState(type);
  const displayTitle = title || defaultState.title;
  const displayDescription = description || defaultState.description;
  const displayIcon = icon || defaultState.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="mb-4 animate-pulse transition-all duration-300">
        {displayIcon}
      </div>
      
      <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-semibold text-gray-900 mb-2 text-center">
        {displayTitle}
      </h3>
      
      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 text-center mb-6 max-w-sm">
        {displayDescription}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-[#d65391] hover:bg-[#c1427e] text-white rounded-lg transition-colors duration-200 font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
