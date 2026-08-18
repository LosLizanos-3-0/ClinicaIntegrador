import { Request, Response } from 'express';
import * as RolModel from '../models/Rol.model';

const NOMBRE_ROL_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,50}$/;

const validarDatosRol = (body: any): string | null => {
  if (typeof body.NombreRol !== 'string' || !NOMBRE_ROL_REGEX.test(body.NombreRol.trim())) {
    return 'El nombre del rol es obligatorio y solo puede contener letras (3 a 50 caracteres)';
  }
  if (typeof body.cita !== 'boolean') {
    return 'El campo "cita" debe ser verdadero o falso';
  }
  if (body.Estado !== undefined && body.Estado !== 'A' && body.Estado !== 'I') {
    return 'El estado no es válido';
  }
  return null;
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    res.json(await RolModel.selectRol());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

export const getRolById = async (req: Request, res: Response) => {
  try {
    const rol = await RolModel.selectRolById(Number(req.params.id));
    if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });
    res.json(rol);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el rol' });
  }
};

export const createRol = async (req: Request, res: Response) => {
  try {
    const errorValidacion = validarDatosRol(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    const roles = await RolModel.selectRol();
    const nombreRol = req.body.NombreRol.trim().toLowerCase();
    if (roles.some((r) => r.NombreRol.trim().toLowerCase() === nombreRol)) {
      return res.status(409).json({ error: 'Ya existe un rol con ese nombre' });
    }

    await RolModel.insertRol({ ...req.body, NombreRol: req.body.NombreRol.trim() });
    res.status(201).json({ mensaje: 'Rol creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el rol' });
  }
};

export const updateRol = async (req: Request, res: Response) => {
  try {
    const errorValidacion = validarDatosRol(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    const idActual = Number(req.params.id);
    const roles = await RolModel.selectRol();
    const nombreRol = req.body.NombreRol.trim().toLowerCase();
    if (roles.some((r) => r.IdRol !== idActual && r.NombreRol.trim().toLowerCase() === nombreRol)) {
      return res.status(409).json({ error: 'Ya existe otro rol con ese nombre' });
    }

    await RolModel.updateRol(idActual, { ...req.body, NombreRol: req.body.NombreRol.trim() });
    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el rol' });
  }
};

export const cambiarEstadoRol = async (req: Request, res: Response) => {
  try {
    if (req.body.Estado !== 'A' && req.body.Estado !== 'I') {
      return res.status(400).json({ error: 'El estado no es válido' });
    }
    await RolModel.camEstadoRol(Number(req.params.id), req.body.Estado);
    res.json({ mensaje: 'Estado del rol actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del rol' });
  }
};