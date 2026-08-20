import { Request, Response } from 'express';
import * as CitaModel from '../models/Cita.model';
import { obtenerActor } from '../config/actor';

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
    const { FechaCita, HoraCita } = req.body;
    if (FechaCita && HoraCita) {
      const fechaHoraCita = new Date(`${FechaCita}T${HoraCita}`);
      if (fechaHoraCita.getTime() < Date.now()) {
        return res.status(400).json({ error: 'No se puede agendar una cita en una fecha u hora que ya pasó' });
      }
    }
    const actor = await obtenerActor(req);
    await CitaModel.insertCita(req.body, actor);
    res.status(201).json({ mensaje: 'Cita creada correctamente' });
  } catch (error: any) {
    console.error(error);
    if (error?.message?.includes('Solo un medico puede ser asignado')) {
      return res.status(400).json({ error: 'El usuario seleccionado no es médico' });
    }
    if (error?.message?.includes('ya tiene una cita en ese horario')) {
      return res.status(400).json({ error: 'El médico ya tiene una cita en ese horario' });
    }
    res.status(500).json({ error: 'Error al crear la cita' });
  }
};

export const updateCita = async (req: Request, res: Response) => {
  try {
    const { FechaCita, HoraCita } = req.body;
    if (FechaCita && HoraCita) {
      const fechaHoraCita = new Date(`${FechaCita}T${HoraCita}`);
      if (fechaHoraCita.getTime() < Date.now()) {
        return res.status(400).json({ error: 'No se puede reprogramar una cita a una fecha u hora que ya pasó' });
      }
    }
    const actor = await obtenerActor(req);
    await CitaModel.updateCita(Number(req.params.id), req.body, actor);
    res.json({ mensaje: 'Cita actualizada correctamente' });
  } catch (error: any) {
    console.error(error);
    if (error?.message?.includes('ya tiene una cita en ese horario')) {
      return res.status(400).json({ error: 'El médico ya tiene una cita en ese horario' });
    }
    res.status(500).json({ error: 'Error al actualizar la cita' });
  }
};

export const cambiarEstadoCita = async (req: Request, res: Response) => {
  try {
    const actor = await obtenerActor(req);
    await CitaModel.camEstadoCita(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado de la cita actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la cita' });
  }
};