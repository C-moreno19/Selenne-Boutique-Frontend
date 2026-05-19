import React from 'react';

export const SatinBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Degradado base: rosado hacia blanco */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #d65391 0%, #e0689a 30%, #e89ab5 60%, #f2c4d4 100%)',
        }}
      />

      {/* Brillo suave para profundidad */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 70% 60% at 15% 50%, rgba(255,255,255,0.4) 0%, transparent 65%)',
            'radial-gradient(ellipse 50% 40% at 80% 10%, rgba(255,255,255,0.3) 0%, transparent 60%)',
          ].join(', '),
        }}
      />
    </div>
  );
};
