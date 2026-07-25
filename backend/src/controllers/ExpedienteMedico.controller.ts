import { Request, Response } from 'express';
import * as ExpedienteModel from '../models/ExpedienteMedico.model';

export const getExpedientes = async (req: Request, res: Response) => {
  try {
    res.json(await ExpedienteModel.selectExpedienteMedico());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener expedientes' });
  }
};

export const getExpedienteById = async (req: Request, res: Response) => {
  try {
    const item = await ExpedienteModel.selectExpedienteMedicoById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Expediente no encontrado' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el expediente' });
  }
};

export const createExpediente = async (req: Request, res: Response) => {
  try {
    await ExpedienteModel.insertExpedienteMedico(req.body);
    res.status(201).json({ mensaje: 'Expediente creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el expediente' });
  }
};

export const updateExpediente = async (req: Request, res: Response) => {
  try {
    await ExpedienteModel.updateExpedienteMedico(Number(req.params.id), req.body);
    res.json({ mensaje: 'Expediente actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el expediente' });
  }
};

export const cambiarEstadoExpediente = async (req: Request, res: Response) => {
  try {
    await ExpedienteModel.camEstadoExpedienteMedico(Number(req.params.id), req.body.Estado);
    res.json({ mensaje: 'Estado del expediente actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del expediente' });
  }
};