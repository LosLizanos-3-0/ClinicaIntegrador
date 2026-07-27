import { Request, Response } from 'express';
import * as RolModel from '../models/Rol.model';

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
    await RolModel.insertRol(req.body);
    res.status(201).json({ mensaje: 'Rol creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el rol' });
  }
};

export const updateRol = async (req: Request, res: Response) => {
  try {
    await RolModel.updateRol(Number(req.params.id), req.body);
    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el rol' });
  }
};

export const cambiarEstadoRol = async (req: Request, res: Response) => {
  try {
    await RolModel.camEstadoRol(Number(req.params.id), req.body.Estado);
    res.json({ mensaje: 'Estado del rol actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del rol' });
  }
};