import React from 'react';
import imgLogo from './district-icon.png';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => (
  <img src={imgLogo} alt="District Store" className={`inline-block object-contain ${className ?? ''}`} />
);
