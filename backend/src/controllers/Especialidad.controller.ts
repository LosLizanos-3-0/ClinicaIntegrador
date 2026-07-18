import { Request, Response } from 'express';
import * as EspecialidadModel from '../models/Especialidad.model';

export const getEspecialidades = async (req: Request, res: Response) => {
  try {
    res.json(await EspecialidadModel.selectEspecialidad());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
};

export const getEspecialidadById = async (req: Request, res: Response) => {
  try {
    const item = await EspecialidadModel.selectEspecialidadById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Especialidad no encontrada' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la especialidad' });
  }
};

export const createEspecialidad = async (req: Request, res: Response) => {
  try {
    await EspecialidadModel.insertEspecialidad(req.body);
    res.status(201).json({ mensaje: 'Especialidad creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la especialidad' });
  }
};

export const updateEspecialidad = async (req: Request, res: Response) => {
  try {
    await EspecialidadModel.updateEspecialidad(Number(req.params.id), req.body);
    res.json({ mensaje: 'Especialidad actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la especialidad' });
  }
};

export const deleteEspecialidad = async (req: Request, res: Response) => {
  try {
    await EspecialidadModel.deleteEspecialidad(Number(req.params.id));
    res.json({ mensaje: 'Especialidad eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la especialidad' });
  }
};