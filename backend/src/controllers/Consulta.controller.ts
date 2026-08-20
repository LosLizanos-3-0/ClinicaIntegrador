import { Request, Response } from 'express';
import * as ConsultaModel from '../models/Consulta.model';
import { obtenerActor } from '../config/actor';

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
    const actor = await obtenerActor(req);
    await ConsultaModel.insertConsulta(req.body, actor);
    res.status(201).json({ mensaje: 'Consulta creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la consulta' });
  }
};

export const updateConsulta = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await ConsultaModel.updateConsulta(Number(req.params.id), req.body, actor);
    res.json({ mensaje: 'Consulta actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la consulta' });
  }
};

export const cambiarEstadoConsulta = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await ConsultaModel.camEstadoConsulta(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado de la consulta actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la consulta' });
  }
};