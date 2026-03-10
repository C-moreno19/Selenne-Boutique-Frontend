import React from 'react';

export const SatinBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">

      {/* Gradiente base */}
      <div
        className="absolute inset-0 bg-[linear-gradient(135deg,#ff9ec4_0%,#e75fa0_40%,#d65391_70%,#c9478a_100%)]"
      />

      {/* SVG con efectos líquidos */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradiente principal rosa metálico */}
          <linearGradient id="metallic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb3d9" stopOpacity="1" />
            <stop offset="30%" stopColor="#ff8cc2" stopOpacity="1" />
            <stop offset="60%" stopColor="#e75fa0" stopOpacity="1" />
            <stop offset="85%" stopColor="#d65391" stopOpacity="1" />
            <stop offset="100%" stopColor="#c9478a" stopOpacity="1" />
          </linearGradient>

          {/* Brillo */}
          <radialGradient id="shine-gradient" cx="75%" cy="25%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="25%" stopColor="#ffe5f0" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#ffcce0" stopOpacity="0.3" />
            <stop offset="75%" stopColor="#ffb3d9" stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Sombra */}
          <radialGradient id="shadow-gradient" cx="30%" cy="70%">
            <stop offset="0%" stopColor="#c9478a" stopOpacity="0.25" />
            <stop offset="40%" stopColor="#d65391" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Filtros */}
          <filter id="blur-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
          </filter>

          <filter id="soft-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
            <feColorMatrix type="saturate" values="1.2" />
          </filter>

          <filter id="texture-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.003 0.004" numOctaves="3" seed="2" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 0.05" />
            </feComponentTransfer>
            <feBlend mode="overlay" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Fondo metálico */}
        <rect width="1200" height="800" fill="url(#metallic-gradient)" />

        {/* Ondas */}
        <path
          d="M 0,400 Q 300,320 600,380 T 1200,350 L 1200,800 L 0,800 Z"
          fill="#c9478a"
          opacity="0.18"
          filter="url(#soft-filter)"
        />

        <path
          d="M 0,450 Q 400,380 800,420 T 1200,400 L 1200,800 L 0,800 Z"
          fill="#e75fa0"
          opacity="0.15"
          filter="url(#soft-filter)"
        />

        <path
          d="M 0,500 Q 350,440 700,480 T 1200,460 L 1200,800 L 0,800 Z"
          fill="#ff8cc2"
          opacity="0.12"
          filter="url(#soft-filter)"
        />

        {/* Brillo superior */}
        <ellipse
          cx="900"
          cy="200"
          rx="400"
          ry="300"
          fill="url(#shine-gradient)"
          filter="url(#blur-filter)"
          opacity="1"
        />

        <ellipse
          cx="1000"
          cy="150"
          rx="250"
          ry="200"
          fill="#ffffff"
          filter="url(#blur-filter)"
          opacity="0.3"
        />

        {/* Sombras */}
        <ellipse
          cx="300"
          cy="600"
          rx="350"
          ry="250"
          fill="url(#shadow-gradient)"
          filter="url(#blur-filter)"
          opacity="0.6"
        />

        {/* Textura */}
        <rect width="1200" height="800" filter="url(#texture-filter)" opacity="0.15" />

        {/* Brillos */}
        <circle cx="800" cy="180" r="80" fill="#ffffff" opacity="0.45" filter="url(#blur-filter)" />
        <circle cx="950" cy="250" r="60" fill="#ffffff" opacity="0.4" filter="url(#blur-filter)" />
        <circle cx="750" cy="300" r="40" fill="#ffe5f0" opacity="0.5" filter="url(#blur-filter)" />
        <circle cx="650" cy="400" r="50" fill="#ffcce0" opacity="0.35" filter="url(#blur-filter)" />
        <circle cx="1050" cy="350" r="35" fill="#ffffff" opacity="0.3" filter="url(#blur-filter)" />
      </svg>

      {/* Overlay final suavizado */}
      <div className="absolute inset-0 opacity-35 bg-[radial-gradient(ellipse_1000px_700px_at_85%_15%,rgba(255,255,255,0.5)_0%,rgba(255,230,240,0.2)_30%,transparent_60%),radial-gradient(ellipse_700px_500px_at_20%_80%,rgba(201,71,138,0.15)_0%,transparent_50%),radial-gradient(ellipse_500px_400px_at_50%_50%,rgba(255,179,217,0.1)_0%,transparent_60%)]" />
    </div>
  );
};
