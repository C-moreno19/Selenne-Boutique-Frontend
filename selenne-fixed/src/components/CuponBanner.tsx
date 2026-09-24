import React, { useEffect, useState } from 'react';
import { Tag, X } from 'lucide-react';
import { getJson } from '../services/api';

interface CuponPublico {
  codigo: string;
  tipoDescuento: 'porcentaje' | 'monto';
  valorDescuento: number;
  montoMinimo?: number | null;
  fechaExpiracion?: string | null;
}

const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GRADIENT = 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)';

const formatDescuento = (c: CuponPublico) =>
  c.tipoDescuento === 'porcentaje'
    ? `${c.valorDescuento}% OFF`
    : `${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(c.valorDescuento)} OFF`;

// Banner de cupon vigente — se muestra a cualquier visitante (logueado o no)
// en la home, hasta que lo cierre. Se usa tanto en LandingView como en ClienteView.
export const CuponBanner: React.FC = () => {
  const [cupon, setCupon] = useState<CuponPublico | null>(null);
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    getJson<{ data?: CuponPublico[] }>('/api/cupones/publicos')
      .then((r) => {
        const activos = r?.data ?? [];
        if (activos.length === 0) return;
        const c = activos[0];
        setCupon(c);
        setCerrado(sessionStorage.getItem(`cupon_cerrado_${c.codigo}`) === '1');
      })
      .catch(() => {});
  }, []);

  if (!cupon || cerrado) return null;

  const cerrar = () => {
    sessionStorage.setItem(`cupon_cerrado_${cupon.codigo}`, '1');
    setCerrado(true);
  };

  return (
    <div style={{ background: GRADIENT, fontFamily: FONT_SANS }} className="relative w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2 text-center">
        <Tag className="w-4 h-4 text-white/90 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-white">
          <span className="font-bold">{formatDescuento(cupon)}</span> con el código{' '}
          <span className="font-bold tracking-wider">{cupon.codigo}</span>
          {cupon.montoMinimo ? (
            <span className="hidden sm:inline text-white/80">
              {' '}· compras desde {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cupon.montoMinimo)}
            </span>
          ) : null}
        </p>
        <button
          onClick={cerrar}
          aria-label="Cerrar aviso de cupón"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default CuponBanner;
