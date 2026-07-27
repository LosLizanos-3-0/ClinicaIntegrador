import { Request, Response } from 'express';
import * as EntregaModel from '../models/EntregaMedicamento.model';

export const getEntregas = async (req: Request, res: Response) => {
  try {
    res.json(await EntregaModel.selectEntregaMedicamento());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
};

export const getEntregaById = async (req: Request, res: Response) => {
  try {
    const item = await EntregaModel.selectEntregaMedicamentoById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Entrega no encontrada' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la entrega' });
  }
};

export const createEntrega = async (req: Request, res: Response) => {
  try {
    await EntregaModel.insertEntregaMedicamento(req.body);
    res.status(201).json({ mensaje: 'Entrega registrada correctamente' });
  } catch (error: any) {
    console.error(error);
    if (error?.message?.includes('Stock insuficiente')) {
      return res.status(400).json({ error: 'Stock insuficiente para completar la entrega' });
    }
    res.status(500).json({ error: 'Error al registrar la entrega' });
  }
};

export const updateEntrega = async (req: Request, res: Response) => {
  try {
    await EntregaModel.updateEntregaMedicamento(Number(req.params.id), req.body);
    res.json({ mensaje: 'Entrega actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la entrega' });
  }
};

export const cambiarEstadoEntrega = async (req: Request, res: Response) => {
  try {
    await EntregaModel.camEstadoEntregaMedicamento(Number(req.params.id), req.body.Estado);
    res.json({ mensaje: 'Estado de la entrega actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la entrega' });
  }
};