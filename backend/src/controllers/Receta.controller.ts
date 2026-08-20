import { Request, Response } from 'express';
import * as RecetaModel from '../models/Receta.model';
import { obtenerActor } from '../config/actor';

export const getRecetas = async (req: Request, res: Response) => {
  try {
    res.json(await RecetaModel.selectReceta());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener recetas' });
  }
};

export const getRecetaById = async (req: Request, res: Response) => {
  try {
    const receta = await RecetaModel.selectRecetaById(Number(req.params.id));
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' });
    res.json(receta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la receta' });
  }
};

export const createReceta = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await RecetaModel.insertReceta(req.body, actor);
    res.status(201).json({ mensaje: 'Receta creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la receta' });
  }
};

export const updateReceta = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await RecetaModel.updateReceta(Number(req.params.id), req.body, actor);
    res.json({ mensaje: 'Receta actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la receta' });
  }
};

export const cambiarEstadoReceta = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await RecetaModel.camEstadoReceta(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado de la receta actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la receta' });
  }
};