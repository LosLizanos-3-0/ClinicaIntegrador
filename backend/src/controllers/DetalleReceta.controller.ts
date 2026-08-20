import { Request, Response } from 'express';
import * as DetalleModel from '../models/DetalleReceta.model';
import { obtenerActor } from '../config/actor';

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
    const actor = await obtenerActor(req);
    await DetalleModel.insertDetalleReceta(req.body, actor);
    res.status(201).json({ mensaje: 'Detalle creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el detalle' });
  }
};

export const updateDetalle = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await DetalleModel.updateDetalleReceta(Number(req.params.id), req.body, actor);
    res.json({ mensaje: 'Detalle actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el detalle' });
  }
};

export const cambiarEstadoDetalle = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await DetalleModel.camEstadoDetalleReceta(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado del detalle actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del detalle' });
  }
};

// Checkbox del frontend: "cobrar aqui" / "lo retiro en otra farmacia"
export const marcarIncluirFactura = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await DetalleModel.marcarIncluirFacturaDetalleReceta(Number(req.params.id), req.body.IncluirFactura, actor);
    res.json({ mensaje: 'Preferencia de facturación actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la preferencia de facturación' });
  }
};