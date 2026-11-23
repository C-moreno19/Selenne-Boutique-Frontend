"use client";

import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      duration={2600}
      offset={{ top: 88 }}
      toastOptions={{
        classNames: {
          title: 'text-[13px] font-semibold text-[#0A0A0A] leading-snug',
          description: 'text-[12px] text-[#7d6f77] mt-0.5 leading-snug',
          icon: 'text-[#5C2A52]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
