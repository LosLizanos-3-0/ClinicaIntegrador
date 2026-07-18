import { Request, Response } from 'express';
import * as CitaModel from '../models/Cita.model';

export const getCitas = async (req: Request, res: Response) => {
  try {
    res.json(await CitaModel.selectCita());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

export const getCitaById = async (req: Request, res: Response) => {
  try {
    const cita = await CitaModel.selectCitaById(Number(req.params.id));
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json(cita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la cita' });
  }
};

export const createCita = async (req: Request, res: Response) => {
  try {
    await CitaModel.insertCita(req.body);
    res.status(201).json({ mensaje: 'Cita creada correctamente' });
  } catch (error: any) {
    console.error(error);
    if (error?.message?.includes('Solo un medico puede ser asignado')) {
      return res.status(400).json({ error: 'El usuario seleccionado no es médico' });
    }
    res.status(500).json({ error: 'Error al crear la cita' });
  }
};

export const updateCita = async (req: Request, res: Response) => {
  try {
    await CitaModel.updateCita(Number(req.params.id), req.body);
    res.json({ mensaje: 'Cita actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la cita' });
  }
};

export const deleteCita = async (req: Request, res: Response) => {
  try {
    await CitaModel.deleteCita(Number(req.params.id));
    res.json({ mensaje: 'Cita eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la cita' });
  }
};