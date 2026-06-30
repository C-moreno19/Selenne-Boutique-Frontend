import { toast as t } from 'sonner@2.0.3';
import type { CSSProperties } from 'react';

const base: CSSProperties = {
  background: 'linear-gradient(135deg, #fff 55%, #fce7f3 100%)',
  color: '#1f2937',
  border: 'none',
  borderLeft: '4px solid #d65391',
  borderRadius: '14px',
  boxShadow: '0 12px 40px rgba(214,83,145,.18)',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  padding: '12px 16px',
  fontSize: '13px',
  fontWeight: '500',
};

const red: CSSProperties = {
  ...base,
  background: 'linear-gradient(135deg, #fff 55%, #fee2e2 100%)',
  borderLeft: '4px solid #dc2626',
  boxShadow: '0 12px 40px rgba(220,38,38,.15)',
};

const amber: CSSProperties = {
  ...base,
  background: 'linear-gradient(135deg, #fff 55%, #fef3c7 100%)',
  borderLeft: '4px solid #d97706',
  boxShadow: '0 12px 40px rgba(217,119,6,.15)',
};

type Opts = Parameters<typeof t.success>[1];

export const toast = Object.assign(
  (msg: string, opts?: Opts) => t(msg, { style: base, ...opts }),
  {
    success: (msg: string, opts?: Opts) => t.success(msg, { style: base,  ...opts }),
    error:   (msg: string, opts?: Opts) => t.error(msg,   { style: red,   ...opts }),
    info:    (msg: string, opts?: Opts) => t.info(msg,    { style: base,  ...opts }),
    warning: (msg: string, opts?: Opts) => t.warning(msg, { style: amber, ...opts }),
    loading: (msg: string, opts?: Opts) => t.loading(msg, { style: base,  ...opts }),
    dismiss: t.dismiss,
    promise: t.promise,
    custom:  t.custom,
  }
);
