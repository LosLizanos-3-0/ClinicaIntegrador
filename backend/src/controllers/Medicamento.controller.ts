import { Request, Response } from 'express';
import * as MedicamentoModel from '../models/Medicamento.model';

export const getMedicamentos = async (req: Request, res: Response) => {
  try {
    res.json(await MedicamentoModel.selectMedicamento());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener medicamentos' });
  }
};

export const getMedicamentoById = async (req: Request, res: Response) => {
  try {
    const item = await MedicamentoModel.selectMedicamentoById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Medicamento no encontrado' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el medicamento' });
  }
};

export const createMedicamento = async (req: Request, res: Response) => {
  try {
    await MedicamentoModel.insertMedicamento(req.body);
    res.status(201).json({ mensaje: 'Medicamento creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el medicamento' });
  }
};

export const updateMedicamento = async (req: Request, res: Response) => {
  try {
    await MedicamentoModel.updateMedicamento(Number(req.params.id), req.body);
    res.json({ mensaje: 'Medicamento actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el medicamento' });
  }
};

export const deleteMedicamento = async (req: Request, res: Response) => {
  try {
    await MedicamentoModel.deleteMedicamento(Number(req.params.id));
    res.json({ mensaje: 'Medicamento eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el medicamento' });
  }
};