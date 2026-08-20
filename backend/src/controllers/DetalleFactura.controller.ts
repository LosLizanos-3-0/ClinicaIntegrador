import { Request, Response } from 'express';
import * as DetalleModel from '../models/DetalleFactura.model';
import { obtenerActor } from '../config/actor';

export const getDetalles = async (req: Request, res: Response) => {
  try {
    res.json(await DetalleModel.selectDetalleFactura());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalles de factura' });
  }
};

export const getDetalleById = async (req: Request, res: Response) => {
  try {
    const item = await DetalleModel.selectDetalleFacturaById(Number(req.params.id));
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
    await DetalleModel.insertDetalleFactura(req.body, actor);
    res.status(201).json({ mensaje: 'Detalle creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el detalle' });
  }
};

export const updateDetalle = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await DetalleModel.updateDetalleFactura(Number(req.params.id), req.body, actor);
    res.json({ mensaje: 'Detalle actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el detalle' });
  }
};

export const cambiarEstadoDetalle = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await DetalleModel.camEstadoDetalleFactura(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado del detalle actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del detalle' });
  }
};

// Crea automaticamente las lineas de medicamentos de una receta (los marcados
// IncluirFactura=1) dentro de una factura. El precio sale del catalogo de
// Medicamento en la BD, nunca del frontend.
export const generarDesdeReceta = async (req: Request, res: Response) => {
  try {
    const { IdFactura, IdReceta } = req.body;
    const actor = await obtenerActor(req);
    await DetalleModel.generarDetalleFacturaDesdeReceta(IdFactura, IdReceta, actor);
    res.status(201).json({ mensaje: 'Medicamentos agregados a la factura correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar los medicamentos a la factura' });
  }
};