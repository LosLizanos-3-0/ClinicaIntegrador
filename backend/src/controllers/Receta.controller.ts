import { Request, Response } from 'express';
import * as RecetaModel from '../models/Receta.model';
import { obtenerActor } from '../config/actor';

const ESTADOS_VALIDOS = ['Pendiente', 'Despachada', 'Anulada'];

const esCampoVacio = (valor: unknown): boolean => {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
};

const esEnteroPositivo = (valor: unknown): boolean => {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
};

const validarDatosReceta = (body: any): string | null => {
  if (esCampoVacio(body.IdConsulta) || !esEnteroPositivo(body.IdConsulta)) {
    return 'La consulta asociada a la receta es obligatoria y debe ser válida';
  }
  if (esCampoVacio(body.IdPaciente) || !esEnteroPositivo(body.IdPaciente)) {
    return 'El paciente de la receta es obligatorio y debe ser válido';
  }
  if (esCampoVacio(body.IdUsuario) || !esEnteroPositivo(body.IdUsuario)) {
    return 'El médico de la receta es obligatorio y debe ser válido';
  }
  if (body.Estado !== undefined && !ESTADOS_VALIDOS.includes(body.Estado)) {
    return 'El estado de la receta no es válido';
  }
  return null;
};

export const getRecetas = async (req: Request, res: Response) => {
  try {
    res.json(await RecetaModel.selectReceta());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener recetas' });
  }
};

export const getRecetaById = async (req: Request, res: Response) => {
  try {
    const receta = await RecetaModel.selectRecetaById(Number(req.params.id));
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' });
    res.json(receta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la receta' });
  }
};

export const createReceta = async (req: Request, res: Response) => {
  try {
<<<<<<< Updated upstream
    const actor = await obtenerActor(req);
    await RecetaModel.insertReceta(req.body, actor);
=======
    const errorValidacion = validarDatosReceta(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    await RecetaModel.insertReceta({
      IdConsulta: Number(req.body.IdConsulta),
      IdPaciente: Number(req.body.IdPaciente),
      IdUsuario: Number(req.body.IdUsuario),
      Estado: req.body.Estado,
    });
>>>>>>> Stashed changes
    res.status(201).json({ mensaje: 'Receta creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la receta' });
  }
};

export const updateReceta = async (req: Request, res: Response) => {
  try {
<<<<<<< Updated upstream
    const actor = await obtenerActor(req);
    await RecetaModel.updateReceta(Number(req.params.id), req.body, actor);
=======
    const errorValidacion = validarDatosReceta(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    await RecetaModel.updateReceta(Number(req.params.id), {
      IdConsulta: Number(req.body.IdConsulta),
      IdPaciente: Number(req.body.IdPaciente),
      IdUsuario: Number(req.body.IdUsuario),
      Estado: req.body.Estado,
    });
>>>>>>> Stashed changes
    res.json({ mensaje: 'Receta actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la receta' });
  }
};

export const cambiarEstadoReceta = async (req: Request, res: Response) => {
  try {
<<<<<<< Updated upstream
    const actor = await obtenerActor(req);
    await RecetaModel.camEstadoReceta(Number(req.params.id), req.body.Estado, actor);
=======
    if (esCampoVacio(req.body.Estado) || !ESTADOS_VALIDOS.includes(req.body.Estado)) {
      return res.status(400).json({ error: 'El estado de la receta no es válido' });
    }
    await RecetaModel.camEstadoReceta(Number(req.params.id), req.body.Estado);
>>>>>>> Stashed changes
    res.json({ mensaje: 'Estado de la receta actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la receta' });
  }
};