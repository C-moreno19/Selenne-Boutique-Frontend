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
      accent: '#22c55e',
      iconColor: 'text-[#22c55e]',
      icon: <CheckCircle2 size={17} />,
    },
    error: {
      accent: '#dc2626',
      iconColor: 'text-[#dc2626]',
      icon: <XCircle size={17} />,
    },
    info: {
      accent: '#5C2A52',
      iconColor: 'text-[#C9A8C3]',
      icon: <Info size={17} />,
    },
  };

  const { accent, iconColor, icon } = config[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden shadow-2xl border border-[#2a1f33]"
          style={{ background: '#0A0A0A', borderLeft: `4px solid ${accent}` }}
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className={`${iconColor} flex-shrink-0`}>
              {icon}
            </div>
            <p
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="flex-1 text-[13px] font-semibold text-white leading-snug"
            >
              {message}
            </p>
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={onClose}
              className="flex-shrink-0 text-[#b9aedd] hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-1"
            >
              <X size={14} />
            </button>
          </div>
          {/* progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            style={{ background: accent, transformOrigin: 'left', height: '2px' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
