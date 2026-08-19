import { Request, Response } from 'express';
import * as UsuarioModel from '../models/Usuario.model';
import * as RolModel from '../models/Rol.model';
import { obtenerActor as obtenerActorBitacora } from '../config/actor';
import bcrypt from 'bcryptjs';

const SOLO_LETRAS_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{2,50}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^\d{4}-\d{4}$/;
const IDENT_REGEX = /^\d-\d{4}-\d{4}$/;
const USUARIO_REGEX = /^[A-Za-z0-9._-]{3,50}$/;

const ROL_ADMINISTRADOR = 'Administrador';
// Usuario de acceso único del administrador principal (Juan Daniel Venegas
// Tellez), precargado automáticamente al iniciar el backend (server.ts).
// Es el único que puede editar a otros administradores.
const USUARIO_ADMIN_PRINCIPAL = 'admin';

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
    // Mínimo 3 caracteres (antes era 4).
    if (typeof body.Contrasena !== 'string' || body.Contrasena.trim().length < 3) {
      return 'La contraseña es obligatoria y debe tener al menos 3 caracteres';
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

// ─── Protección entre administradores ──────────────────────────────────────
// Reglas:
//  1) Ningún administrador puede editarse a sí mismo (ni el principal ni
//     uno secundario).
//  2) Un administrador secundario NO puede editar a otro administrador
//     (incluyendo al principal).
//  3) El administrador principal (usuario "admin") SÍ puede editar a
//     cualquier otro administrador y a cualquier usuario de cualquier rol.
//  4) Cualquier administrador puede editar libremente usuarios que NO
//     sean administradores (Médico, Recepcionista, Farmacéutico, etc.).
const esAdminPrincipal = (nombreUsuario: string): boolean =>
  nombreUsuario.trim().toLowerCase() === USUARIO_ADMIN_PRINCIPAL;

const obtenerActor = async (req: Request) => {
  const idHeader = req.header('x-usuario-id');
  const actorId = Number(idHeader);
  if (!idHeader || !Number.isFinite(actorId) || actorId <= 0) return null;

  const actor = await UsuarioModel.selectUsuarioById(actorId);
  if (!actor) return null;

  const roles = await RolModel.selectRol();
  const rolActor = roles.find((r) => r.IdRol === actor.IdRol)?.NombreRol ?? '';

  return { IdUsuario: actor.IdUsuario as number, NombreUsuario: actor.NombreUsuario, Rol: rolActor };
};

// Devuelve null si la edición está permitida, o un mensaje de error si no.
const validarPermisoEdicion = async (
  actor: { IdUsuario: number; NombreUsuario: string; Rol: string },
  idObjetivo: number
): Promise<string | null> => {
  const objetivo = await UsuarioModel.selectUsuarioById(idObjetivo);
  if (!objetivo) return 'Usuario no encontrado';

  const roles = await RolModel.selectRol();
  const rolObjetivo = roles.find((r) => r.IdRol === objetivo.IdRol)?.NombreRol ?? '';

  // El usuario objetivo no es administrador: cualquier administrador puede editarlo.
  if (rolObjetivo !== ROL_ADMINISTRADOR) return null;

  // El usuario objetivo SÍ es administrador:
  if (actor.IdUsuario === idObjetivo) {
    return 'Un administrador no puede editar ni desactivar su propio usuario';
  }
  if (esAdminPrincipal(actor.NombreUsuario)) {
    return null; // el administrador principal puede editar a otros administradores
  }
  return 'Solo el administrador principal puede modificar a otro administrador';
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

    const actorBitacora = await obtenerActorBitacora(req);
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
    }, actorBitacora);
    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const idActual = Number(req.params.id);

    const actor = await obtenerActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'No se pudo identificar al usuario que realiza esta acción' });
    }
    const errorPermiso = await validarPermisoEdicion(actor, idActual);
    if (errorPermiso) return res.status(403).json({ error: errorPermiso });

    const errorValidacion = validarDatosUsuario(req.body, false);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

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

    const actorBitacora = await obtenerActorBitacora(req);
    await UsuarioModel.updateUsuario(idActual, datos, actorBitacora);
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

export const cambiarEstadoUsuario = async (req: Request, res: Response) => {
  try {
    const idActual = Number(req.params.id);

    const actor = await obtenerActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'No se pudo identificar al usuario que realiza esta acción' });
    }
    const errorPermiso = await validarPermisoEdicion(actor, idActual);
    if (errorPermiso) return res.status(403).json({ error: errorPermiso });

    if (req.body.Estado !== 'A' && req.body.Estado !== 'I') {
      return res.status(400).json({ error: 'El estado no es válido' });
    }
    const actorBitacora = await obtenerActorBitacora(req);
    await UsuarioModel.camEstadoUsuario(idActual, req.body.Estado, actorBitacora);
    res.json({ mensaje: 'Estado del usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del usuario' });
  }
};