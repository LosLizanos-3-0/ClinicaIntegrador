import { Request, Response } from 'express';
import * as ConsultaModel from '../models/Consulta.model';

export const getConsultas = async (req: Request, res: Response) => {
  try {
    res.json(await ConsultaModel.selectConsulta());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener consultas' });
  }
};

export const getConsultaById = async (req: Request, res: Response) => {
  try {
    const consulta = await ConsultaModel.selectConsultaById(Number(req.params.id));
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json(consulta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la consulta' });
  }
};

export const createConsulta = async (req: Request, res: Response) => {
  try {
    await ConsultaModel.insertConsulta(req.body);
    res.status(201).json({ mensaje: 'Consulta creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la consulta' });
  }
};

export const updateConsulta = async (req: Request, res: Response) => {
  try {
    await ConsultaModel.updateConsulta(Number(req.params.id), req.body);
    res.json({ mensaje: 'Consulta actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la consulta' });
  }
};

export const deleteConsulta = async (req: Request, res: Response) => {
  try {
    await ConsultaModel.deleteConsulta(Number(req.params.id));
    res.json({ mensaje: 'Consulta eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la consulta' });
  }
};