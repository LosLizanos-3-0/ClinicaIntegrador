import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as UsuarioModel from '../models/Usuario.model';
import * as RolModel from '../models/Rol.model';
import * as BitacoraModel from '../models/Bitacora.model';

export const login = async (req: Request, res: Response) => {
  const { usuario, contrasena } = req.body;

  // Para todo intento FALLIDO se guarda "Desconocido" como usuario que
  // realizó la acción (nunca se revela el nombre real de la cuenta,
  // exista o no, aunque el detalle interno del intento sí queda en el
  // campo Registro para auditoría).
    const registrarIntento = async (
    resultado: 'EXITOSO' | 'FALLIDO',
    detalle: string,
    usuarioMostrar: string = 'Desconocido',
    rol: string = 'Desconocido'
  ) => {
    try {
      await BitacoraModel.insertBitacoraLogin(usuario || '(vacío)', resultado, detalle, usuarioMostrar, rol);
    } catch (errorBitacora) {
      // Un fallo al escribir la bitácora nunca debe tumbar el login
      console.error('No se pudo registrar el intento de login en la bitácora:', errorBitacora);
    }
  };

  try {
    if (!usuario || !contrasena) {
      await registrarIntento('FALLIDO', 'Usuario/correo y contraseña son obligatorios');
      return res.status(400).json({ error: 'Usuario/correo y contraseña son obligatorios' });
    }

    const usuarios = await UsuarioModel.selectUsuario();
    const encontrado = usuarios.find(
      (u) =>
        u.NombreUsuario.toLowerCase() === usuario.trim().toLowerCase() ||
        u.Correo.toLowerCase() === usuario.trim().toLowerCase()
    );

    if (!encontrado) {
      await registrarIntento('FALLIDO', `El usuario "${usuario}" no existe`);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    if (encontrado.Estado === 'I') {
      await registrarIntento('FALLIDO', `El usuario "${usuario}" está inactivo`);
      return res.status(403).json({ error: 'Este usuario está inactivo. Contacta al administrador.' });
    }

    const coincide = await bcrypt.compare(contrasena, encontrado.Contrasena);
    if (!coincide) {
      await registrarIntento('FALLIDO', `Contraseña incorrecta para "${usuario}"`);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const roles = await RolModel.selectRol();
    const rol = roles.find((r) => r.IdRol === encontrado.IdRol);
    const nombreMostrar = `${encontrado.Nombre} ${encontrado.Apellido1}`.trim();

    await registrarIntento(
      'EXITOSO',
      `Inicio de sesión de "${encontrado.NombreUsuario}" (${rol?.NombreRol ?? 'Sin rol'})`,
      nombreMostrar,
      rol?.NombreRol
    );

    res.json({
      IdUsuario: encontrado.IdUsuario,
      Nombre: encontrado.Nombre,
      Apellido1: encontrado.Apellido1,
      Apellido2: encontrado.Apellido2,
      Correo: encontrado.Correo,
      NombreUsuario: encontrado.NombreUsuario,
      Rol: rol?.NombreRol ?? 'Sin rol',
    });
  } catch (error) {
    console.error(error);
    await registrarIntento('FALLIDO', 'Error interno del servidor');
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};