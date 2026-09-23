import React from "react";
import { CheckCircle, XCircle, CreditCard, Truck, Package, Info } from "lucide-react";
import type { NotifItem } from "../shared/hooks/useNotificaciones";

const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const TIPO_CONFIG: Record<string, { icon: React.ReactNode; bg: string; border: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
    bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-900/50",
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />,
    bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900/50",
  },
  warning: {
    icon: <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/50",
  },
  shipping: {
    icon: <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/50",
  },
  info: {
    icon: <Info className="w-5 h-5 text-[#A3395C]" />,
    bg: "bg-[#fdf2f8] dark:bg-[#3a2530]", border: "border-[#f9a8d4] dark:border-[#5a3a48]",
  },
};

function getTipoConfig(titulo: string, tipo: string) {
  if (titulo.includes("aprobado") || titulo.includes("Aprobado") || tipo === "success") return TIPO_CONFIG.success;
  if (titulo.includes("rechazado") || titulo.includes("Rechazado") || tipo === "error") return TIPO_CONFIG.error;
  if (titulo.includes("enviado") || titulo.includes("Enviado") || titulo.includes("camino") || titulo.includes("guía")) return TIPO_CONFIG.shipping;
  if (titulo.includes("pago") || titulo.includes("Pago") || tipo === "warning") return TIPO_CONFIG.warning;
  return TIPO_CONFIG.info;
}

export function formatFechaNotif(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

interface NotificacionCardProps {
  notif: NotifItem;
  onClick?: () => void;
  onVerReferencia?: () => void;
  referenciaLabel?: string;
}

export const NotificacionCard: React.FC<NotificacionCardProps> = ({
  notif, onClick, onVerReferencia, referenciaLabel = "Ver pedido",
}) => {
  const cfg = getTipoConfig(notif.titulo, notif.tipo);
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#322631] rounded-2xl border shadow-sm overflow-hidden transition-all ${onClick ? "cursor-pointer hover:shadow-md" : ""} ${
        !notif.leida ? "border-l-4 border-l-[#A3395C] border-gray-100 dark:border-[#453840]" : "border-gray-100 dark:border-[#453840]"
      }`}
    >
      <div className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontFamily: FONT_SANS }} className="font-semibold text-sm text-gray-900 dark:text-[#F5EDE9]">
                {notif.titulo}
              </span>
              {!notif.leida && <span className="w-2 h-2 bg-[#A3395C] rounded-full flex-shrink-0" />}
            </div>
            <span style={{ fontFamily: FONT_SANS }} className="text-xs text-gray-400 dark:text-[#b8a3ac] flex-shrink-0 whitespace-nowrap">
              {formatFechaNotif(notif.fechaCreacion)}
            </span>
          </div>
          <p style={{ fontFamily: FONT_SANS }} className="text-sm text-gray-600 dark:text-[#b8a3ac] mt-1 leading-relaxed">
            {notif.mensaje}
          </p>
          {notif.referencia && onVerReferencia && (
            <button
              onClick={(e) => { e.stopPropagation(); onVerReferencia(); }}
              className="flex items-center gap-1.5 mt-2 hover:text-[#A3395C] transition-colors group"
            >
              <Package className="w-3 h-3 text-gray-400 dark:text-[#b8a3ac] group-hover:text-[#A3395C]" />
              <span style={{ fontFamily: FONT_SANS }} className="text-xs text-gray-400 dark:text-[#b8a3ac] group-hover:text-[#A3395C] underline underline-offset-2">
                {referenciaLabel}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
