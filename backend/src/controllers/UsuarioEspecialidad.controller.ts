import { Request, Response } from 'express';
import * as UEModel from '../models/UsuarioEspecialidad.model';

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
    const data = await UEModel.selectUsuarioEspecialidadByUsuario(Number(req.params.idUsuario));
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener especialidades del usuario' });
  }
};

export const createUsuarioEspecialidad = async (req: Request, res: Response) => {
  try {
    await UEModel.insertUsuarioEspecialidad(req.body);
    res.status(201).json({ mensaje: 'Relación creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la relación' });
  }
};

export const deleteUsuarioEspecialidad = async (req: Request, res: Response) => {
  try {
    const { idUsuario, idEspecialidad } = req.params;
    await UEModel.deleteUsuarioEspecialidad(Number(idUsuario), Number(idEspecialidad));
    res.json({ mensaje: 'Relación eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la relación' });
  }
};