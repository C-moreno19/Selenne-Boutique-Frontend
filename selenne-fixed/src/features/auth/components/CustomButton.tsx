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
    ? 'bg-[#000000] text-white hover:bg-[#2a2a2a]'
    : 'bg-[#f2d9e6] text-[#000000] hover:bg-[#c84a8f] hover:text-white';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`${baseClasses} ${variantClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{ 
        borderRadius: '6px',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: '600',
        height: '44px',
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
