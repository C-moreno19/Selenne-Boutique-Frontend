"use client";

import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      duration={2600}
      toastOptions={{
        classNames: {
          title: 'text-[13px] font-semibold text-gray-800 leading-snug',
          description: 'text-[12px] text-gray-500 mt-0.5 leading-snug',
          icon: 'text-[#d65391]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
