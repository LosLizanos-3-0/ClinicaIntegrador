import { Request, Response } from 'express';
import * as FacturaModel from '../models/Factura.model';

export const getFacturas = async (req: Request, res: Response) => {
  try {
    res.json(await FacturaModel.selectFactura());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
};

export const getFacturaById = async (req: Request, res: Response) => {
  try {
    const factura = await FacturaModel.selectFacturaById(Number(req.params.id));
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(factura);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la factura' });
  }
};

export const createFactura = async (req: Request, res: Response) => {
  try {
    await FacturaModel.insertFactura(req.body);
    res.status(201).json({ mensaje: 'Factura creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la factura' });
  }
};

export const updateFactura = async (req: Request, res: Response) => {
  try {
    await FacturaModel.updateFactura(Number(req.params.id), req.body);
    res.json({ mensaje: 'Factura actualizada correctamente' });
  } catch (error: any) {
    console.error(error);
    if (error?.message?.includes('No se puede modificar una factura ya pagada')) {
      return res.status(400).json({ error: 'No se puede modificar una factura ya pagada' });
    }
    res.status(500).json({ error: 'Error al actualizar la factura' });
  }
};

export const cambiarEstadoFactura = async (req: Request, res: Response) => {
  try {
    await FacturaModel.camEstadoFactura(Number(req.params.id), req.body.Estado);
    res.json({ mensaje: 'Estado de la factura actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la factura' });
  }
};