import { Request, Response } from 'express';
import * as DetalleModel from '../models/DetalleReceta.model';

export const getDetalles = async (req: Request, res: Response) => {
  try {
    res.json(await DetalleModel.selectDetalleReceta());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalles de receta' });
  }
};

export const getDetalleById = async (req: Request, res: Response) => {
  try {
    const item = await DetalleModel.selectDetalleRecetaById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Detalle no encontrado' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el detalle' });
  }
};

export const createDetalle = async (req: Request, res: Response) => {
  try {
    await DetalleModel.insertDetalleReceta(req.body);
    res.status(201).json({ mensaje: 'Detalle creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el detalle' });
  }
};

export const updateDetalle = async (req: Request, res: Response) => {
  try {
    await DetalleModel.updateDetalleReceta(Number(req.params.id), req.body);
    res.json({ mensaje: 'Detalle actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el detalle' });
  }
};

export const deleteDetalle = async (req: Request, res: Response) => {
  try {
    await DetalleModel.deleteDetalleReceta(Number(req.params.id));
    res.json({ mensaje: 'Detalle eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el detalle' });
  }
};