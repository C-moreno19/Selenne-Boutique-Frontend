import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../shared/contexts/ThemeContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const OPTIONS = [
  { value: 'light' as const, label: 'Claro', desc: 'Fondo claro', icon: Sun },
  { value: 'dark' as const, label: 'Oscuro', desc: 'Fondo oscuro', icon: Moon },
  { value: 'system' as const, label: 'Sistema', desc: 'Según tu dispositivo', icon: Monitor },
];

interface ThemeToggleProps {
  buttonClassName?: string;
  iconClassName?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ buttonClassName, iconClassName }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const CurrentIcon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Cambiar tema"
          aria-label="Cambiar tema"
          className={
            buttonClassName ??
            'p-2 rounded-full text-[#241B22] dark:text-[#F5EDE9] transition-all hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] hover:text-[#A3395C] dark:hover:text-[#F5A9C0]'
          }
        >
          <CurrentIcon className={iconClassName ?? 'w-5 h-5'} strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-[220px] p-2 rounded-2xl border-0 shadow-[0_16px_48px_rgba(36,27,34,0.18)] bg-white dark:bg-[#322631]"
      >
        <p
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          className="px-2.5 pt-1.5 pb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#241B22] dark:text-[#F5EDE9]"
        >
          Apariencia
        </p>
        {OPTIONS.map(({ value, label, desc, icon: Icon }) => {
          const activo = theme === value;
          return (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className={`flex items-center gap-3 cursor-pointer rounded-xl px-2.5 py-2.5 mb-0.5 last:mb-0 transition-colors focus:bg-[#FBF8F5] dark:focus:bg-[#2a2029] ${
                activo ? 'bg-[#FBF8F5] dark:bg-[#2a2029]' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  activo
                    ? 'text-white'
                    : 'bg-[#FBF8F5] dark:bg-[#2a2029] text-[#7d6f77] dark:text-[#b8a3ac]'
                }`}
                style={activo ? { background: 'linear-gradient(135deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' } : undefined}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                <p className="text-sm font-semibold text-[#241B22] dark:text-[#F5EDE9] leading-tight">{label}</p>
                <p className="text-[11px] text-[#7d6f77] dark:text-[#b8a3ac] leading-tight mt-0.5">{desc}</p>
              </div>
              {activo && <Check className="w-4 h-4 text-[#A3395C] flex-shrink-0" strokeWidth={2.5} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
