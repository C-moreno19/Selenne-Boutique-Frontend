/**
 * 🔐 Utility para generar contraseñas temporales y credenciales
 */

export interface GeneratedCredentials {
  password: string;
  tempPassword: string;
  expiresIn: string;
}

/**
 * Genera una contraseña temporal segura
 * Formato: SelenneBQ + 4 dígitos + !
 * Ejemplo: SelenneBQ2026!
 */
export const generarContraseñaTemporal = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `SelenneBQ${year}${random}!`;
};

/**
 * Genera credenciales temporales para nuevo cliente
 */
export const generarCredencialesTemporales = (email: string): GeneratedCredentials => {
  return {
    password: generarContraseñaTemporal(),
    tempPassword: generarContraseñaTemporal(),
    expiresIn: '24 horas'
  };
};

/**
 * Valida que una contraseña cumpla requisitos mínimos
 */
export const validarContraseña = (password: string): {
  valida: boolean;
  errores: string[];
} => {
  const errores: string[] = [];

  if (password.length < 8) {
    errores.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errores.push('Debe contener mayúsculas');
  }
  if (!/[a-z]/.test(password)) {
    errores.push('Debe contener minúsculas');
  }
  if (!/[0-9]/.test(password)) {
    errores.push('Debe contener números');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errores.push('Debe contener caracteres especiales (!@#$%^&*)');
  }

  return {
    valida: errores.length === 0,
    errores
  };
};

export default {
  generarContraseñaTemporal,
  generarCredencialesTemporales,
  validarContraseña
};
