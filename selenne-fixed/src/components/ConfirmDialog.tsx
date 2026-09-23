import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  /** 'danger' para eliminar (rojo, ícono de papelera); 'warning' para acciones sensibles no destructivas (marca, ícono de alerta) */
  variant?: 'danger' | 'warning';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  loading = false,
  variant = 'danger',
}) => {
  const isDanger = variant === 'danger';
  const Icon = isDanger ? Trash2 : AlertTriangle;

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <AlertDialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-5">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              isDanger ? 'bg-red-50 dark:bg-red-950/30' : 'bg-[#fdf2f8] dark:bg-[#3a2530]'
            }`}
          >
            <Icon className={`w-6 h-6 ${isDanger ? 'text-red-500' : 'text-[#A3395C]'}`} />
          </div>
          <AlertDialogHeader className="gap-1.5 text-left">
            <AlertDialogTitle style={{ fontFamily: FONT_SANS }} className="text-lg">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: FONT_SANS }} className="leading-relaxed">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="gap-2 px-6 py-4 bg-[#FBF8F5] dark:bg-[#2a2029] border-t border-[#E7E0DA] dark:border-[#453840]">
          <AlertDialogCancel disabled={loading} style={{ fontFamily: FONT_SANS }}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            style={{ fontFamily: FONT_SANS }}
            className={isDanger ? 'bg-red-600 hover:bg-red-700' : undefined}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
