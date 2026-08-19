import { Request, Response } from 'express';
import * as EspecialidadModel from '../models/Especialidad.model';
import { obtenerActor } from '../config/actor';

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
    const actor = await obtenerActor(req);
    await EspecialidadModel.insertEspecialidad(req.body, actor);
    res.status(201).json({ mensaje: 'Especialidad creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la especialidad' });
  }
};

export const updateEspecialidad = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await EspecialidadModel.updateEspecialidad(Number(req.params.id), req.body, actor);
    res.json({ mensaje: 'Especialidad actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la especialidad' });
  }
};

export const cambiarEstadoEspecialidad = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await EspecialidadModel.camEstadoEspecialidad(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado de la especialidad actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la especialidad' });
  }
};