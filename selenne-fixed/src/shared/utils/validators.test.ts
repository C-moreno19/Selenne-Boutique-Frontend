import { describe, expect, it } from 'vitest';
import { lettersOnly, numbersOnly, removeSpaces, removeAt } from './validators';

describe('lettersOnly', () => {
  it('quita numeros y simbolos, conserva letras y acentos', () => {
    expect(lettersOnly('María José 123!')).toBe('María José ');
  });

  it('devuelve el valor tal cual si esta vacio', () => {
    expect(lettersOnly('')).toBe('');
  });
});

describe('numbersOnly', () => {
  it('quita todo lo que no sea digito', () => {
    expect(numbersOnly('+57 (304) 292-8493')).toBe('573042928493');
  });
});

describe('removeSpaces', () => {
  it('quita todos los espacios', () => {
    expect(removeSpaces('Selenne  Boutique')).toBe('SelenneBoutique');
  });
});

describe('removeAt', () => {
  it('quita el simbolo @', () => {
    expect(removeAt('user@mail.com')).toBe('usermail.com');
  });
});
