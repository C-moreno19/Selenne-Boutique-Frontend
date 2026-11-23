import React from 'react';
import loginBg from './login-bg.jpg';

export const SatinBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Foto de fondo (fluid art morado/negro) + degradado encima para legibilidad */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #120821 0%, #3B0A45 45%, #5C2A52 100%)',
          opacity: 0.55,
        }}
      />

      {/* Brillo suave para profundidad */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 70% 60% at 15% 50%, rgba(255,255,255,0.14) 0%, transparent 65%)',
            'radial-gradient(ellipse 50% 40% at 80% 10%, rgba(255,255,255,0.1) 0%, transparent 60%)',
          ].join(', '),
        }}
      />
    </div>
  );
};
