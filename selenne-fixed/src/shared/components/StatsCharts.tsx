import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
    label?: string;
  };
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  backgroundColor = 'from-[#d65391] to-[#f8a9c5]',
  textColor = 'text-white',
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p
            style={{ fontFamily: 'Inter, sans-serif' }}
            className="text-sm text-gray-600 mb-1"
          >
            {title}
          </p>
          <h3
            style={{ fontFamily: 'Playfair Display, serif' }}
            className="text-2xl font-bold text-gray-900"
          >
            {value}
          </h3>
        </div>

        {/* Icon */}
        <div
          className={`bg-gradient-to-br ${backgroundColor} p-3 rounded-lg flex-shrink-0`}
        >
          <div className={`w-6 h-6 ${textColor}`}>{icon}</div>
        </div>
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-2">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span
            style={{ fontFamily: 'Inter, sans-serif' }}
            className={`text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.direction === 'up' ? '+' : '-'}
            {trend.percentage}%
          </span>
          {trend.label && (
            <span
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="text-sm text-gray-500"
            >
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  maxValue?: number;
  title?: string;
  showValue?: boolean;
  animate?: boolean;
  className?: string;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  title,
  showValue = true,
  animate = true,
  className = '',
}) => {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      {title && (
        <h3
          style={{ fontFamily: 'Playfair Display, serif' }}
          className="text-lg font-bold text-gray-900 mb-6"
        >
          {title}
        </h3>
      )}

      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = (item.value / max) * 100;
          const color = item.color || '#d65391';

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="text-sm font-medium text-gray-700"
                >
                  {item.label}
                </span>
                {showValue && (
                  <span
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="text-sm font-semibold text-gray-900"
                  >
                    {item.value}
                  </span>
                )}
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out rounded-full ${
                    animate ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: color,
                    width: `${percentage}%`,
                    animation: animate
                      ? `slideIn 0.8s ease-out forwards`
                      : 'none',
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            width: 0;
          }
          to {
            width: var(--width);
          }
        }
      `}</style>
    </div>
  );
};

interface PieChartDataItem {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  showLegend?: boolean;
  className?: string;
}

export const SimplePieChart: React.FC<PieChartProps> = ({
  data,
  title,
  showLegend = true,
  className = '',
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  const colors = ['#d65391', '#f8a9c5', '#ea7ec9', '#d6518c', '#f1b3d9'];

  const segments = data.map((item, index) => {
    const sliceAngle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    const color = item.color || colors[index % colors.length];

    const start = polarToCartesian(100, startAngle);
    const end = polarToCartesian(100, endAngle);
    const largeArc = sliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${50} ${50}`,
      `L ${start.x} ${start.y}`,
      `A ${100} ${100} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');

    currentAngle = endAngle;

    return { pathData, color, label: item.label, value: item.value, percentage: (item.value / total) * 100 };
  });

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      {title && (
        <h3
          style={{ fontFamily: 'Playfair Display, serif' }}
          className="text-lg font-bold text-gray-900 mb-6"
        >
          {title}
        </h3>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
        {/* Pie */}
        <svg width="200" height="200" viewBox="0 0 200 200">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.pathData}
              fill={segment.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
          <circle cx="50" cy="50" r="40" fill="white" />
        </svg>

        {/* Legend */}
        {showLegend && (
          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                ></div>
                <div>
                  <p
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="text-sm font-medium text-gray-900"
                  >
                    {segment.label}
                  </p>
                  <p
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="text-xs text-gray-500"
                  >
                    {segment.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function polarToCartesian(radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: 50 + radius * Math.cos(angleInRadians),
    y: 50 + radius * Math.sin(angleInRadians),
  };
}

export default { StatCard, SimpleBarChart, SimplePieChart };
