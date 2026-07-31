import React from 'react';

export const SatinBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Degradado base: berenjena hacia marfil */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1c151a 0%, #3a2430 35%, #6b3348 70%, #A3395C 100%)',
        }}
      />

      {/* Brillo suave para profundidad */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 70% 60% at 15% 50%, rgba(255,255,255,0.22) 0%, transparent 65%)',
            'radial-gradient(ellipse 50% 40% at 80% 10%, rgba(255,255,255,0.18) 0%, transparent 60%)',
          ].join(', '),
        }}
      />
    </div>
  );
};
