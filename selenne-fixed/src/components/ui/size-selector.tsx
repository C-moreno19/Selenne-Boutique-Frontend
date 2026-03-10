import React from "react";

interface SizeSelectorProps {
  sizes: string[];
  value?: string;
  onChange: (size: string) => void;
  className?: string;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  value,
  onChange,
  className = "",
}) => {
  return (
    <div className={className}>
      <div className="flex gap-2 flex-wrap">
        {sizes.map((talla) => (
          <button
            key={talla}
            onClick={() => onChange(talla)}
            className={`px-4 py-2 border-2 rounded-lg transition-colors ${
              value === talla
                ? "border-[#d65391] bg-[#f8a9c5] text-white"
                : "border-gray-300 hover:border-[#d65391]"
            }`}
          >
            {talla}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelector;
