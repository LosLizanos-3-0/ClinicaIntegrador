import { Request, Response } from 'express';
import * as PagoModel from '../models/Pago.model';
import { obtenerActor } from '../config/actor';

export const getPagos = async (req: Request, res: Response) => {
  try {
    res.json(await PagoModel.selectPago());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
};

export const getPagoById = async (req: Request, res: Response) => {
  try {
    const pago = await PagoModel.selectPagoById(Number(req.params.id));
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(pago);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el pago' });
  }
};

export const createPago = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await PagoModel.insertPago(req.body, actor);
    res.status(201).json({ mensaje: 'Pago registrado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
};

export const updatePago = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await PagoModel.updatePago(Number(req.params.id), req.body, actor);
    res.json({ mensaje: 'Pago actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el pago' });
  }
};

export const cambiarEstadoPago = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await PagoModel.camEstadoPago(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado del pago actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del pago' });
  }
};