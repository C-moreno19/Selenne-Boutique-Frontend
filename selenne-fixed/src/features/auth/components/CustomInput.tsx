import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface CustomInputProps {
  type?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  success?: boolean;
  placeholder?: string;
  showPasswordToggle?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  type = 'text',
  label,
  value,
  onChange,
  error,
  success,
  placeholder,
  showPasswordToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  const getBorderColor = () => {
    if (error) return 'border-[#d64545]';
    if (success) return 'border-[#2eaf6f]';
    if (isFocused) return 'border-[#A3395C] ring-2 ring-[#EFD9DF]';
    return 'border-[#E7E0DA]';
  };

  return (
    <div className="w-full font-inter">
      <label className="block mb-2 text-[11px] uppercase tracking-wide font-semibold text-[#7d6f77]">
        {label}
      </label>

      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 outline-none bg-white text-[#241B22] ${getBorderColor()}`}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7d6f77] hover:text-[#A3395C] transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-[#d64545] text-[13px] font-inter">
          {error}
        </p>
      )}
    </div>
  );
};
