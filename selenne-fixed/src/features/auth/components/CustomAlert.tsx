import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface CustomAlertProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  type,
  message,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-[#2eaf6f]',
      icon: <CheckCircle2 size={20} />,
    },
    error: {
      bg: 'bg-[#d64545]',
      icon: <XCircle size={20} />,
    },
    info: {
      bg: 'bg-[#2b78d9]',
      icon: <Info size={20} />,
    },
  };

  const { bg, icon } = config[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`${bg} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3`}
      >
        {icon}
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
};
