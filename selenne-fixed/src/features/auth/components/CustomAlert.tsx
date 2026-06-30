import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

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
  duration = 1600,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration <= 0) return;
    const hide = setTimeout(() => setVisible(false), duration - 300);
    const close = setTimeout(onClose, duration);
    return () => { clearTimeout(hide); clearTimeout(close); };
  }, [duration, onClose]);

  const config = {
    success: {
      accent: '#d65391',
      iconBg: 'bg-[#fce7f3]',
      iconColor: 'text-[#d65391]',
      icon: <CheckCircle2 size={17} />,
      progressColor: '#d65391',
    },
    error: {
      accent: '#dc2626',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      icon: <XCircle size={17} />,
      progressColor: '#dc2626',
    },
    info: {
      accent: '#d65391',
      iconBg: 'bg-[#fce7f3]',
      iconColor: 'text-[#d65391]',
      icon: <Info size={17} />,
      progressColor: '#d65391',
    },
  };

  const { accent, iconBg, iconColor, icon, progressColor } = config[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(214,83,145,.22)]"
          style={{ background: 'linear-gradient(135deg, #fff 60%, #fce7f3 100%)', borderLeft: `4px solid ${accent}` }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className={`${iconBg} ${iconColor} w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0`}>
              {icon}
            </div>
            <p className="flex-1 text-[13px] font-medium text-gray-800 leading-snug">{message}</p>
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-transparent border-0 p-1"
            >
              <X size={14} />
            </button>
          </div>
          {/* progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            style={{ background: progressColor, transformOrigin: 'left', height: '3px' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
