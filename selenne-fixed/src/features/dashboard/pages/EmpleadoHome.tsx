import React from 'react';
import { ShoppingBag, DollarSign } from 'lucide-react';

export const EmpleadoHome: React.FC = () => {
  const stats = [
    { label: 'Mis Ventas Hoy', value: '$2,340', icon: DollarSign, color: 'bg-green-500' },
    { label: 'Productos Vendidos', value: '24', icon: ShoppingBag, color: 'bg-blue-500' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '32px' }} className="mb-2">
          Mi Panel
        </h1>
        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
          Tus ventas y actividad del día
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 text-sm mb-1">
              {stat.label}
            </h3>
            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '24px' }} className="mb-4">
          Ventas Recientes
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Venta #{1000 + item}</p>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
                  Hace {item * 15} minutos
                </p>
              </div>
              <span className="text-green-600" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                +${(Math.random() * 200 + 50).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
