import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as UsuarioModel from '../models/Usuario.model';
import * as RolModel from '../models/Rol.model';

export const login = async (req: Request, res: Response) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({ error: 'Usuario/correo y contraseña son obligatorios' });
    }

    const usuarios = await UsuarioModel.selectUsuario();
    const encontrado = usuarios.find(
      (u) =>
        u.NombreUsuario.toLowerCase() === usuario.trim().toLowerCase() ||
        u.Correo.toLowerCase() === usuario.trim().toLowerCase()
    );

    if (!encontrado) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    if (encontrado.Estado === 'I') {
      return res.status(403).json({ error: 'Este usuario está inactivo. Contacta al administrador.' });
    }

    const coincide = await bcrypt.compare(contrasena, encontrado.Contrasena);
    if (!coincide) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const roles = await RolModel.selectRol();
    const rol = roles.find((r) => r.IdRol === encontrado.IdRol);

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
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};