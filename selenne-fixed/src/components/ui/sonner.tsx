"use client";

import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      duration={2600}
      offset={{ top: 88 }}
      toastOptions={{
        classNames: {
          toast: 'rounded-none border border-[#2a1f33] bg-[#0A0A0A] shadow-2xl px-4 py-3.5 gap-3',
          title: 'text-[13px] font-bold tracking-wide text-white leading-snug',
          description: 'text-[12px] text-[#b9aedd] mt-0.5 leading-snug',
          closeButton: 'rounded-none bg-transparent border-[#3A2E4D] text-[#b9aedd] hover:text-white hover:bg-transparent',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
