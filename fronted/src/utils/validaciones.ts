/**
 * Validaciones de formato reutilizables para los formularios de Admin.
 * (El formateo mientras se escribe sigue viviendo en utils/Formato.ts)
 */

export const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$/;
export const REGEX_CEDULA = /^\d-\d{4}-\d{4}$/;       // 1-2345-6789
export const REGEX_TELEFONO = /^\d{4}-\d{4}$/;        // 8888-0000
export const REGEX_USUARIO = /^[A-Za-z0-9._-]{3,30}$/; // jvenegas, j.venegas, etc.

// Contraseña: 8-12 caracteres, al menos 1 mayúscula, 1 número y 1 carácter especial.
export const REGEX_CONTRASENA_MAYUSCULA = /[A-ZÁÉÍÓÚÑ]/;
export const REGEX_CONTRASENA_NUMERO = /[0-9]/;
export const REGEX_CONTRASENA_ESPECIAL = /[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/;

export const validarNombre = (valor: string): boolean => REGEX_NOMBRE.test(valor.trim());
export const validarCedula = (valor: string): boolean => REGEX_CEDULA.test(valor.trim());
export const validarTelefono = (valor: string): boolean => REGEX_TELEFONO.test(valor.trim());
export const validarNombreUsuario = (valor: string): boolean => REGEX_USUARIO.test(valor.trim());

export const validarContrasena = (valor: string): boolean => {
  const v = valor.trim();
  if (v.length < 8 || v.length > 12) return false;
  if (!REGEX_CONTRASENA_MAYUSCULA.test(v)) return false;
  if (!REGEX_CONTRASENA_NUMERO.test(v)) return false;
  if (!REGEX_CONTRASENA_ESPECIAL.test(v)) return false;
  return true;
};

export const MENSAJE_REQUISITOS_CONTRASENA =
  "Debe tener entre 8 y 12 caracteres, con al menos 1 mayúscula, 1 número y 1 carácter especial.";