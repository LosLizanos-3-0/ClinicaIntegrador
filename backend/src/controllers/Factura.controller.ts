import { Request, Response } from 'express';
import * as FacturaModel from '../models/Factura.model';
import { obtenerActor } from '../config/actor';

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
    const actor = await obtenerActor(req);
    const idFactura = await FacturaModel.insertFactura(req.body, actor);
    res.status(201).json({ mensaje: 'Factura creada correctamente', IdFactura: idFactura });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la factura' });
  }
};

export const updateFactura = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await FacturaModel.updateFactura(Number(req.params.id), req.body, actor);
    res.json({ mensaje: 'Factura actualizada correctamente' });
  } catch (error: any) {
    console.error(error);
    if (error?.message?.includes('No se puede modificar una factura ya pagada')) {
      return res.status(400).json({ error: 'No se puede modificar una factura ya pagada' });
    }
    res.status(500).json({ error: 'Error al actualizar la factura' });
  }
};

export const updateMontoConsultaFactura = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await FacturaModel.updateMontoConsultaFactura(Number(req.params.id), req.body.MontoConsulta, actor);
    res.json({ mensaje: 'Monto de consulta actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el monto de consulta' });
  }
};

export const cambiarEstadoFactura = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await FacturaModel.camEstadoFactura(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado de la factura actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la factura' });
  }
};