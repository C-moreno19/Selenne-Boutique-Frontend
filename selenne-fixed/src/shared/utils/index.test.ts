import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, truncateText } from './index';

describe('formatCurrency', () => {
  it('formatea un monto entero con separador de miles y sufijo COP', () => {
    expect(formatCurrency(1500000)).toBe('$1.500.000 COP');
  });

  it('redondea decimales (0 decimales configurados)', () => {
    expect(formatCurrency(1000.6)).toBe('$1.001 COP');
  });

  it('formatea cero', () => {
    expect(formatCurrency(0)).toBe('$0 COP');
  });
});

describe('formatDate', () => {
  it('formatea una fecha ISO en texto largo en español', () => {
    expect(formatDate('2026-01-15T00:00:00')).toBe('15 de enero de 2026');
  });

  it('acepta un objeto Date directamente', () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe('15 de enero de 2026');
  });
});

describe('truncateText', () => {
  it('no corta texto mas corto que el limite', () => {
    expect(truncateText('Selenne', 20)).toBe('Selenne');
  });

  it('corta y agrega elipsis cuando excede el limite', () => {
    expect(truncateText('Selenne Boutique', 7)).toBe('Selenne...');
  });

  it('respeta el limite exacto sin truncar', () => {
    expect(truncateText('Selenne', 7)).toBe('Selenne');
  });
});
