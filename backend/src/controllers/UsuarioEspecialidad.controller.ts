import { Request, Response } from 'express';
import * as UEModel from '../models/UsuarioEspecialidad.model';
import { obtenerActor } from '../config/actor';

export const getUsuarioEspecialidades = async (req: Request, res: Response) => {
  try {
    res.json(await UEModel.selectUsuarioEspecialidad());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener relaciones usuario-especialidad' });
  }
};

export const getByUsuario = async (req: Request, res: Response) => {
  try {
    res.json(await UEModel.selectUsuarioEspecialidadByUsuario(Number(req.params.idUsuario)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener especialidades del usuario' });
  }
};

export const createUsuarioEspecialidad = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await UEModel.insertUsuarioEspecialidad(req.body, actor);
    res.status(201).json({ mensaje: 'Relación creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la relación' });
  }
};

export const deleteUsuarioEspecialidad = async (req: Request, res: Response) => {
  try {
    const { idUsuario, idEspecialidad } = req.params;
    const actor = await obtenerActor(req);
    await UEModel.deleteUsuarioEspecialidad(Number(idUsuario), Number(idEspecialidad), actor);
    res.json({ mensaje: 'Relación eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la relación' });
  }
};