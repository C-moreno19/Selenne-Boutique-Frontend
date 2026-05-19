import React from 'react';
import { ShoppingBag, X, ArrowRight, Plus, Minus, Trash2 } from 'lucide-react';

interface CartItem {
  id: string;
  nombre: string;
  imagen: string;
  precio: number;
  cantidad: number;
  talla?: string;
  color?: string;
}

interface MiniCartProps {
  items: CartItem[];
  onRemoveItem?: (itemId: string) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onCheckout?: () => void;
  onClose?: () => void;
  isOpen: boolean;
  className?: string;
}

export const MiniCart: React.FC<MiniCartProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  onClose,
  isOpen,
  className = '',
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const envio = subtotal > 100000 ? 0 : 10000;
  const total = subtotal + envio;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Slide Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#d65391]" />
            <h2
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-xl font-bold text-gray-900"
            >
              Tu Carrito
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items Container */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-lg font-semibold text-gray-900 mb-2"
              >
                Tu carrito está vacío
              </h3>
              <p
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-gray-600 mb-6"
              >
                Agrega productos para comenzar
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#d65391] hover:bg-[#c1427e] text-white rounded-lg font-medium transition-colors"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-4 flex gap-4 group hover:bg-gray-100 transition-colors"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1"
                    >
                      {item.nombre}
                    </h4>

                    {/* Attributes */}
                    {(item.talla || item.color) && (
                      <p
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                        className="text-xs text-gray-600 mb-2"
                      >
                        {item.talla && `Talla: ${item.talla}`}
                        {item.talla && item.color && ' · '}
                        {item.color && `Color: ${item.color}`}
                      </p>
                    )}

                    {/* Price */}
                    <p
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className="text-sm font-bold text-[#d65391]"
                    >
                      ${item.precio.toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex flex-col items-end justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg">
                      <button
                        onClick={() =>
                          onUpdateQuantity?.(item.id, Math.max(0, item.cantidad - 1))
                        }
                        className="p-1 hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>

                      <span
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                        className="w-6 text-center text-xs font-medium"
                      >
                        {item.cantidad}
                      </span>

                      <button
                        onClick={() =>
                          onUpdateQuantity?.(item.id, item.cantidad + 1)
                        }
                        className="p-1 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => onRemoveItem?.(item.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Totals & Checkout) */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
            {/* Subtotal */}
            <div className="flex justify-between">
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-gray-600"
              >
                Subtotal
              </span>
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="font-semibold text-gray-900"
              >
                ${subtotal.toLocaleString()}
              </span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between">
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-gray-600"
              >
                Envío {envio === 0 && '(Gratis)'}
              </span>
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`font-semibold ${
                  envio === 0 ? 'text-green-600' : 'text-gray-900'
                }`}
              >
                ${envio.toLocaleString()}
              </span>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4 flex justify-between">
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="font-bold text-gray-900"
              >
                Total
              </span>
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-xl font-bold text-[#d65391]"
              >
                ${total.toLocaleString()}
              </span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={onCheckout}
              className="w-full bg-gradient-to-r from-[#d65391] to-[#f8a9c5] hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              Ir al Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Continue Shopping */}
            <button
              onClick={onClose}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 rounded-lg border border-gray-200 transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniCart;
