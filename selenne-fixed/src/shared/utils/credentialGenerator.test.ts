import { describe, expect, it } from 'vitest';
import { generarContraseñaTemporal, validarContraseña } from './credentialGenerator';

describe('generarContraseñaTemporal', () => {
  it('sigue el formato SelenneBQ + 2 digitos de anio + 4 digitos + !', () => {
    expect(generarContraseñaTemporal()).toMatch(/^SelenneBQ\d{2}\d{4}!$/);
  });

  it('la contraseña generada es valida segun validarContraseña', () => {
    expect(validarContraseña(generarContraseñaTemporal()).valida).toBe(true);
  });
});

describe('validarContraseña', () => {
  it('rechaza una contraseña demasiado corta', () => {
    const r = validarContraseña('Ab1!');
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('Mínimo 8 caracteres');
  });

  it('exige mayusculas, minusculas, numeros y caracteres especiales', () => {
    const r = validarContraseña('minusculas1');
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('Debe contener mayúsculas');
    expect(r.errores).toContain('Debe contener caracteres especiales (!@#$%^&*)');
  });

  it('acepta una contraseña que cumple todos los requisitos', () => {
    const r = validarContraseña('Selenne2026!');
    expect(r.valida).toBe(true);
    expect(r.errores).toHaveLength(0);
  });
});
