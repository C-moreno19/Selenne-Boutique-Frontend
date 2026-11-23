import React from 'react';
import { motion } from 'motion/react';

interface CustomButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  onClick,
  loading = false,
  variant = 'primary',
  type = 'button',
  fullWidth = true,
}) => {
  const baseClasses = `px-8 py-3 transition-all duration-200 ${fullWidth ? 'w-full' : ''}`;
  
  const variantClasses = variant === 'primary'
    ? 'text-white'
    : 'border border-[#0A0A0A] dark:border-[#F5F3FA] text-[#0A0A0A] dark:text-[#F5F3FA] hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-[#F5F3FA] dark:hover:text-[#0A0A0A]';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`${baseClasses} ${variantClasses} disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-widest`}
      style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        height: '48px',
        ...(variant === 'primary' ? { background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' } : {}),
      }}
      whileHover={{ scale: loading ? 1 : 1.01 }}
      whileTap={{ scale: loading ? 1 : 0.99 }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Cargando...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};
