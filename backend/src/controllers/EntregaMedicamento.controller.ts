import { Request, Response } from 'express';
import * as EntregaModel from '../models/EntregaMedicamento.model';
import { obtenerActor } from '../config/actor';

const esCampoVacio = (valor: unknown): boolean => {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
};

const esEnteroPositivo = (valor: unknown): boolean => {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
};

const validarDatosEntrega = (body: any): string | null => {
  if (esCampoVacio(body.IdReceta) || !esEnteroPositivo(body.IdReceta)) {
    return 'La receta es obligatoria y debe ser válida';
  }
  if (esCampoVacio(body.IdUsuario) || !esEnteroPositivo(body.IdUsuario)) {
    return 'El farmacéutico que entrega es obligatorio y debe ser válido';
  }
  if (body.Estado !== undefined && body.Estado !== 'A' && body.Estado !== 'I') {
    return 'El estado no es válido';
  }
  return null;
};

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
<<<<<<< Updated upstream
    const actor = await obtenerActor(req);
    await EntregaModel.insertEntregaMedicamento(req.body, actor);
=======
    const errorValidacion = validarDatosEntrega(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    await EntregaModel.insertEntregaMedicamento({
      IdReceta: Number(req.body.IdReceta),
      IdUsuario: Number(req.body.IdUsuario),
      Estado: req.body.Estado,
    });
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const actor = await obtenerActor(req);
    await EntregaModel.updateEntregaMedicamento(Number(req.params.id), req.body, actor);
=======
    const errorValidacion = validarDatosEntrega(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    await EntregaModel.updateEntregaMedicamento(Number(req.params.id), {
      IdReceta: Number(req.body.IdReceta),
      IdUsuario: Number(req.body.IdUsuario),
      Estado: req.body.Estado,
    });
>>>>>>> Stashed changes
    res.json({ mensaje: 'Entrega actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la entrega' });
  }
};

export const cambiarEstadoEntrega = async (req: Request, res: Response) => {
  try {
<<<<<<< Updated upstream
    const actor = await obtenerActor(req);
    await EntregaModel.camEstadoEntregaMedicamento(Number(req.params.id), req.body.Estado, actor);
=======
    if (esCampoVacio(req.body.Estado) || (req.body.Estado !== 'A' && req.body.Estado !== 'I')) {
      return res.status(400).json({ error: 'El estado no es válido' });
    }
    await EntregaModel.camEstadoEntregaMedicamento(Number(req.params.id), req.body.Estado);
>>>>>>> Stashed changes
    res.json({ mensaje: 'Estado de la entrega actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la entrega' });
  }
};