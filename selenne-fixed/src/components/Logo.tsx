import React from 'react';
import imgLogo from 'figma:asset/8184a8c16f30f2f7daa53602475d236bcd50c9b3.png';

interface LogoProps {
  className?: string;
}

/**
 * El PNG original es monocromo (marca sobre fondo transparente), asi que se
 * usa como mascara CSS para poder pintarlo con el color exacto de marca en
 * cada tema en vez de depender de filtros de inversion aproximados.
 */
export const Logo: React.FC<LogoProps> = ({ className }) => (
  <span
    role="img"
    aria-label="Selenne Boutique"
    className={`inline-block bg-[#241B22] dark:bg-[#F5EDE9] ${className ?? ''}`}
    style={{
      WebkitMaskImage: `url(${imgLogo})`,
      maskImage: `url(${imgLogo})`,
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
    }}
  />
);
