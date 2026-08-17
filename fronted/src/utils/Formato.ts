/**
 Funciones para autoformatear campos mientras el usuario escribe.
 */

export const formatearCedula = (valor: string): string => {
  const digitos = valor.replace(/\D/g, "").slice(0, 9);
  if (digitos.length <= 1) return digitos;
  if (digitos.length <= 5) return `${digitos.slice(0, 1)}-${digitos.slice(1)}`;
  return `${digitos.slice(0, 1)}-${digitos.slice(1, 5)}-${digitos.slice(5, 9)}`;
};

export const formatearTelefono = (valor: string): string => {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 4) return digitos;
  return `${digitos.slice(0, 4)}-${digitos.slice(4, 8)}`;
};

export const esCorreoValido = (correo: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
};


export const soloLetras = (valor: string): string => {
  return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
};