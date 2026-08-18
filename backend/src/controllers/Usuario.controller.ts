import { Request, Response } from 'express';
import * as UsuarioModel from '../models/Usuario.model';
import bcrypt from 'bcryptjs';

const SOLO_LETRAS_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{2,50}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^\d{4}-\d{4}$/;
const IDENT_REGEX = /^\d-\d{4}-\d{4}$/;
const USUARIO_REGEX = /^[A-Za-z0-9._-]{3,50}$/;

const validarDatosUsuario = (body: any, requiereContrasena: boolean): string | null => {
  if (typeof body.Nombre !== 'string' || !SOLO_LETRAS_REGEX.test(body.Nombre.trim())) {
    return 'El nombre es obligatorio y solo puede contener letras (2 a 50 caracteres)';
  }
  if (typeof body.Apellido1 !== 'string' || !SOLO_LETRAS_REGEX.test(body.Apellido1.trim())) {
    return 'El primer apellido es obligatorio y solo puede contener letras (2 a 50 caracteres)';
  }
  if (body.Apellido2 !== undefined && body.Apellido2 !== null && body.Apellido2 !== '') {
    if (typeof body.Apellido2 !== 'string' || !SOLO_LETRAS_REGEX.test(body.Apellido2.trim())) {
      return 'El segundo apellido solo puede contener letras (2 a 50 caracteres)';
    }
  }
  if (typeof body.Ident !== 'string' || !IDENT_REGEX.test(body.Ident.trim())) {
    return 'La cédula/identificación debe tener el formato 0-0000-0000';
  }
  if (body.Telefono !== undefined && body.Telefono !== null && body.Telefono !== '') {
    if (typeof body.Telefono !== 'string' || !TELEFONO_REGEX.test(body.Telefono.trim())) {
      return 'El teléfono debe tener el formato 0000-0000';
    }
  }
  if (typeof body.Correo !== 'string' || !CORREO_REGEX.test(body.Correo.trim())) {
    return 'El correo electrónico no tiene un formato válido';
  }
  if (typeof body.NombreUsuario !== 'string' || !USUARIO_REGEX.test(body.NombreUsuario.trim())) {
    return 'El usuario de acceso debe tener entre 3 y 50 caracteres (letras, números, puntos, guiones)';
  }
  if (requiereContrasena) {
    if (typeof body.Contrasena !== 'string' || body.Contrasena.trim().length < 4) {
      return 'La contraseña es obligatoria y debe tener al menos 4 caracteres';
    }
  }
  if (body.Estado !== undefined && body.Estado !== 'A' && body.Estado !== 'I') {
    return 'El estado no es válido';
  }
  if (!Number.isFinite(Number(body.IdRol)) || Number(body.IdRol) <= 0) {
    return 'Debes seleccionar un rol válido';
  }
  return null;
};

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    res.json(await UsuarioModel.selectUsuario());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const getUsuarioById = async (req: Request, res: Response) => {
  try {
    const usuario = await UsuarioModel.selectUsuarioById(Number(req.params.id));
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

export const createUsuario = async (req: Request, res: Response) => {
  try {
    const errorValidacion = validarDatosUsuario(req.body, true);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    const usuariosExistentes = await UsuarioModel.selectUsuario();
    const nombreUsuario = req.body.NombreUsuario.trim().toLowerCase();
    const correo = req.body.Correo.trim().toLowerCase();
    const ident = req.body.Ident.trim();
    const duplicado = usuariosExistentes.find(
      (u) =>
        u.NombreUsuario.trim().toLowerCase() === nombreUsuario ||
        u.Correo.trim().toLowerCase() === correo ||
        u.Ident.trim() === ident
    );
    if (duplicado) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese usuario de acceso, correo o cédula' });
    }

    const hash = await bcrypt.hash(req.body.Contrasena, 10);
    await UsuarioModel.insertUsuario({
      ...req.body,
      Nombre: req.body.Nombre.trim(),
      Apellido1: req.body.Apellido1.trim(),
      Apellido2: req.body.Apellido2 ? req.body.Apellido2.trim() : undefined,
      Ident: ident,
      Telefono: req.body.Telefono ? req.body.Telefono.trim() : undefined,
      Correo: req.body.Correo.trim(),
      NombreUsuario: req.body.NombreUsuario.trim(),
      Contrasena: hash,
    });
    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const errorValidacion = validarDatosUsuario(req.body, false);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    const idActual = Number(req.params.id);
    const usuariosExistentes = await UsuarioModel.selectUsuario();
    const nombreUsuario = req.body.NombreUsuario.trim().toLowerCase();
    const correo = req.body.Correo.trim().toLowerCase();
    const ident = req.body.Ident.trim();
    const duplicado = usuariosExistentes.find(
      (u) =>
        u.IdUsuario !== idActual &&
        (u.NombreUsuario.trim().toLowerCase() === nombreUsuario ||
          u.Correo.trim().toLowerCase() === correo ||
          u.Ident.trim() === ident)
    );
    if (duplicado) {
      return res.status(409).json({ error: 'Ya existe otro usuario con ese usuario de acceso, correo o cédula' });
    }

    const datos = { ...req.body };
    datos.Nombre = req.body.Nombre.trim();
    datos.Apellido1 = req.body.Apellido1.trim();
    datos.Apellido2 = req.body.Apellido2 ? req.body.Apellido2.trim() : undefined;
    datos.Ident = ident;
    datos.Telefono = req.body.Telefono ? req.body.Telefono.trim() : undefined;
    datos.Correo = req.body.Correo.trim();
    datos.NombreUsuario = req.body.NombreUsuario.trim();

    // Si viene una contraseña nueva en texto plano, se cifra. Si ya es un
    // hash bcrypt existente (porque el formulario reenvía el valor actual
    // sin que el usuario la haya cambiado), se deja igual.
    if (datos.Contrasena && !datos.Contrasena.startsWith('$2a$') && !datos.Contrasena.startsWith('$2b$')) {
      datos.Contrasena = await bcrypt.hash(datos.Contrasena, 10);
    }

    await UsuarioModel.updateUsuario(idActual, datos);
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

export const cambiarEstadoUsuario = async (req: Request, res: Response) => {
  try {
    if (req.body.Estado !== 'A' && req.body.Estado !== 'I') {
      return res.status(400).json({ error: 'El estado no es válido' });
    }
    await UsuarioModel.camEstadoUsuario(Number(req.params.id), req.body.Estado);
    res.json({ mensaje: 'Estado del usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del usuario' });
  }
};