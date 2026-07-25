import { Request, Response } from 'express';
import * as PacienteModel from '../models/Paciente.model';

export const getPacientes = async (req: Request, res: Response) => {
  try {
    res.json(await PacienteModel.selectPaciente());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
};

export const buscarPaciente = async (req: Request, res: Response) => {
  try {
    res.json(await PacienteModel.buscarPacientePorNombre(req.params.nombre));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al buscar pacientes' });
  }
};

export const getPacienteById = async (req: Request, res: Response) => {
  try {
    const paciente = await PacienteModel.selectPacienteById(Number(req.params.id));
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(paciente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el paciente' });
  }
};

export const createPaciente = async (req: Request, res: Response) => {
  try {
    await PacienteModel.insertPaciente(req.body);
    res.status(201).json({ mensaje: 'Paciente creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el paciente' });
  }
};

export const updatePaciente = async (req: Request, res: Response) => {
  try {
    await PacienteModel.updatePaciente(Number(req.params.id), req.body);
    res.json({ mensaje: 'Paciente actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el paciente' });
  }
};

export const cambiarEstadoPaciente = async (req: Request, res: Response) => {
  try {
    await PacienteModel.camEstadoPaciente(Number(req.params.id), req.body.Estado);
    res.json({ mensaje: 'Estado del paciente actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del paciente' });
  }
};