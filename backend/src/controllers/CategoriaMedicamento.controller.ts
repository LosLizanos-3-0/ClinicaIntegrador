import { Request, Response } from 'express';
import * as CategoriaMedicamentoModel from '../models/CategoriaMedicamento.model';
import { obtenerActor } from '../config/actor';

const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.,+%/() -]{2,100}$/;
const COMENTARIO_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.,+%/() -]{0,300}$/;

const esCampoVacio = (valor: unknown): boolean => {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
};

const validarDatosCategoria = (body: any): string | null => {
  if (esCampoVacio(body.NombreCategoria) || typeof body.NombreCategoria !== 'string' || !NOMBRE_REGEX.test(body.NombreCategoria.trim())) {
    return 'El nombre de la categoría es obligatorio y contiene caracteres no válidos';
  }
  if (body.Comentario !== undefined && body.Comentario !== null && body.Comentario !== '') {
    if (typeof body.Comentario !== 'string' || !COMENTARIO_REGEX.test(body.Comentario.trim()) || body.Comentario.trim().length > 300) {
      return 'El comentario contiene caracteres no válidos';
    }
  }
  if (body.Estado !== undefined && body.Estado !== 'A' && body.Estado !== 'I') {
    return 'El estado no es válido';
  }
  return null;
};

export const getCategoriasMedicamento = async (req: Request, res: Response) => {
  try {
    res.json(await CategoriaMedicamentoModel.selectCategoriaMedicamento());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las categorías de medicamento' });
  }
};

export const getCategoriaMedicamentoById = async (req: Request, res: Response) => {
  try {
    const item = await CategoriaMedicamentoModel.selectCategoriaMedicamentoById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la categoría' });
  }
};

export const createCategoriaMedicamento = async (req: Request, res: Response) => {
  try {
    const errorValidacion = validarDatosCategoria(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    const actor = await obtenerActor(req);
    await CategoriaMedicamentoModel.insertCategoriaMedicamento({
      NombreCategoria: req.body.NombreCategoria.trim(),
      Comentario: req.body.Comentario ? req.body.Comentario.trim() : undefined,
      Estado: req.body.Estado,
    }, actor);
    res.status(201).json({ mensaje: 'Categoría creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
};

export const updateCategoriaMedicamento = async (req: Request, res: Response) => {
  try {
    const errorValidacion = validarDatosCategoria(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    const actor = await obtenerActor(req);
    await CategoriaMedicamentoModel.updateCategoriaMedicamento(Number(req.params.id), {
      NombreCategoria: req.body.NombreCategoria.trim(),
      Comentario: req.body.Comentario ? req.body.Comentario.trim() : undefined,
      Estado: req.body.Estado,
    }, actor);
    res.json({ mensaje: 'Categoría actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
};

export const cambiarEstadoCategoriaMedicamento = async (req: Request, res: Response) => {
  try {
    if (req.body.Estado !== 'A' && req.body.Estado !== 'I') {
      return res.status(400).json({ error: 'El estado no es válido' });
    }
    const actor = await obtenerActor(req);
    await CategoriaMedicamentoModel.camEstadoCategoriaMedicamento(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado de la categoría actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado de la categoría' });
  }
};