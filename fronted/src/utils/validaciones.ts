/**
 * Validaciones de formato reutilizables para los formularios de Admin.
 * (El formateo mientras se escribe sigue viviendo en utils/Formato.ts)
 */

export const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$/;
export const REGEX_CEDULA = /^\d-\d{4}-\d{4}$/;       // 1-2345-6789
export const REGEX_TELEFONO = /^\d{4}-\d{4}$/;        // 8888-0000
export const REGEX_USUARIO = /^[A-Za-z0-9._-]{3,30}$/; // jvenegas, j.venegas, etc.

export const validarNombre = (valor: string): boolean => REGEX_NOMBRE.test(valor.trim());
export const validarCedula = (valor: string): boolean => REGEX_CEDULA.test(valor.trim());
export const validarTelefono = (valor: string): boolean => REGEX_TELEFONO.test(valor.trim());
export const validarNombreUsuario = (valor: string): boolean => REGEX_USUARIO.test(valor.trim());
export const validarContrasena = (valor: string): boolean => valor.trim().length >= 3;