import React from 'react';
import { CheckCircle2, Clock, Truck, Package, MapPin, Calendar } from 'lucide-react';

export type OrderStatus = 'confirmado' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';

interface OrderStatusStep {
  status: OrderStatus;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface OrderTrackingProps {
  currentStatus: OrderStatus;
  orderNumber: string;
  estimatedDate?: string;
  steps?: OrderStatusStep[];
  details?: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    lastUpdate?: string;
  };
  className?: string;
}

const defaultSteps: OrderStatusStep[] = [
  {
    status: 'confirmado',
    label: 'Confirmado',
    icon: <CheckCircle2 className="w-6 h-6" />,
    description: 'Tu pedido ha sido confirmado',
  },
  {
    status: 'procesando',
    label: 'Procesando',
    icon: <Package className="w-6 h-6" />,
    description: 'Estamos preparando tu pedido',
  },
  {
    status: 'enviado',
    label: 'Enviado',
    icon: <Truck className="w-6 h-6" />,
    description: 'Tu pedido está en camino',
  },
  {
    status: 'entregado',
    label: 'Entregado',
    icon: <MapPin className="w-6 h-6" />,
    description: 'Tu pedido ha sido entregado',
  },
];

const statusOrder = ['confirmado', 'procesando', 'enviado', 'entregado'];

export const OrderTracking: React.FC<OrderTrackingProps> = ({
  currentStatus,
  orderNumber,
  estimatedDate,
  steps = defaultSteps,
  details,
  className = '',
}) => {
  const currentIndex = statusOrder.indexOf(currentStatus as any);
  const isCompleted = currentStatus === 'entregado';
  const isCancelled = currentStatus === 'cancelado';

  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-lg font-bold text-gray-900"
            >
              Rastreo de Pedido
            </h3>
            <p
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-sm text-gray-500"
            >
              Pedido #{orderNumber}
            </p>
          </div>

          {isCancelled && (
            <div className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              Cancelado
            </div>
          )}

          {isCompleted && (
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Completado
            </div>
          )}

          {!isCancelled && !isCompleted && (
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              En progreso
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {!isCancelled && (
        <div className="mb-8">
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isActive = statusOrder.indexOf(step.status as any) <= currentIndex;
              const isCurrentStep = step.status === currentStatus;

              return (
                <div key={step.status} className="flex gap-4">
                  {/* Icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white'
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrentStep ? 'ring-2 ring-[#d65391] ring-offset-2' : ''}`}
                    >
                      {step.icon}
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-12 mt-2 ${
                          isActive && statusOrder.indexOf(steps[index + 1].status as any) <= currentIndex
                            ? 'bg-[#d65391]'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-4">
                    <h4
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className={`font-semibold ${
                        isActive ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </h4>
                    {step.description && (
                      <p
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                        className="text-sm text-gray-600 mt-1"
                      >
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details */}
      {details && (
        <div className="border-t border-gray-200 pt-6 space-y-4">
          {details.carrier && (
            <div className="flex items-center justify-between">
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm text-gray-600"
              >
                Transportista:
              </span>
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm font-medium text-gray-900"
              >
                {details.carrier}
              </span>
            </div>
          )}

          {details.trackingNumber && (
            <div className="flex items-center justify-between">
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm text-gray-600"
              >
                Número de rastreo:
              </span>
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm font-mono font-medium text-gray-900"
              >
                {details.trackingNumber}
              </span>
            </div>
          )}

          {details.estimatedDelivery && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#d65391]" />
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm text-gray-600"
              >
                Entrega estimada: <strong>{details.estimatedDelivery}</strong>
              </span>
            </div>
          )}

          {details.lastUpdate && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-4 h-4" />
              Última actualización: {details.lastUpdate}
            </div>
          )}
        </div>
      )}

      {/* Estimated Date */}
      {estimatedDate && !isCancelled && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-sm text-blue-900"
          >
            <strong>Fecha estimada de entrega:</strong> {estimatedDate}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
