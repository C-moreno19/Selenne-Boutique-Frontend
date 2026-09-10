import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../shared/contexts/ThemeContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const OPTIONS = [
  { value: 'light' as const, label: 'Claro', icon: Sun },
  { value: 'dark' as const, label: 'Oscuro', icon: Moon },
  { value: 'system' as const, label: 'Sistema', icon: Monitor },
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
          className={buttonClassName ?? 'p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors'}
        >
          <CurrentIcon className={iconClassName ?? 'w-5 h-5 text-[#241B22] dark:text-[#F5EDE9]'} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="flex items-center gap-2 cursor-pointer"
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          >
            <Icon className="w-4 h-4" />
            <span className="flex-1">{label}</span>
            {theme === value && <Check className="w-4 h-4 text-[#A3395C]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
