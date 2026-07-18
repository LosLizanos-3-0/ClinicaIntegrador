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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la factura' });
  }
};

export const deleteFactura = async (req: Request, res: Response) => {
  try {
    await FacturaModel.deleteFactura(Number(req.params.id));
    res.json({ mensaje: 'Factura eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la factura' });
  }
};