import { Request, Response } from 'express';
import * as DetalleModel from '../models/DetalleReceta.model';

const INDICACIONES_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.,+%/() -]{0,300}$/;

const esCampoVacio = (valor: unknown): boolean => {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
};

const esEnteroPositivo = (valor: unknown): boolean => {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
};

const validarDatosDetalle = (body: any): string | null => {
  if (esCampoVacio(body.IdReceta) || !esEnteroPositivo(body.IdReceta)) {
    return 'La receta es obligatoria y debe ser válida';
  }
  if (esCampoVacio(body.IdMedicamento) || !esEnteroPositivo(body.IdMedicamento)) {
    return 'El medicamento es obligatorio y debe ser válido';
  }
  if (esCampoVacio(body.Cantidad) || !esEnteroPositivo(body.Cantidad)) {
    return 'La cantidad es obligatoria y debe ser un número entero mayor a cero';
  }
  if (body.Indicaciones !== undefined && body.Indicaciones !== null && body.Indicaciones !== '') {
    if (typeof body.Indicaciones !== 'string' || !INDICACIONES_REGEX.test(body.Indicaciones.trim()) || body.Indicaciones.trim().length > 300) {
      return 'Las indicaciones contienen caracteres no válidos';
    }
  }
  if (body.Estado !== undefined && body.Estado !== 'A' && body.Estado !== 'I') {
    return 'El estado no es válido';
  }
  return null;
};

export const getDetalles = async (req: Request, res: Response) => {
  try {
    res.json(await DetalleModel.selectDetalleReceta());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalles de receta' });
  }
};

export const getDetalleById = async (req: Request, res: Response) => {
  try {
    const item = await DetalleModel.selectDetalleRecetaById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Detalle no encontrado' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el detalle' });
  }
};

export const createDetalle = async (req: Request, res: Response) => {
  try {
    const errorValidacion = validarDatosDetalle(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    await DetalleModel.insertDetalleReceta({
      IdReceta: Number(req.body.IdReceta),
      IdMedicamento: Number(req.body.IdMedicamento),
      Cantidad: Number(req.body.Cantidad),
      Indicaciones: req.body.Indicaciones ? req.body.Indicaciones.trim() : undefined,
      IncluirFactura: req.body.IncluirFactura ?? false,
      Estado: req.body.Estado,
    });
    res.status(201).json({ mensaje: 'Detalle creado correctamente' });
  } catch (error: any) {
    console.error(error);
    if (error?.message?.includes('Stock insuficiente')) {
      return res.status(400).json({ error: 'Stock insuficiente para recetar la cantidad solicitada' });
    }
    if (error?.message?.includes('inactivo')) {
      return res.status(400).json({ error: 'El medicamento esta inactivo y no se puede recetar' });
    }
    if (error?.message?.includes('no existe')) {
      return res.status(400).json({ error: 'El medicamento no existe' });
    }
    res.status(500).json({ error: 'Error al crear el detalle' });
  }
};

export const updateDetalle = async (req: Request, res: Response) => {
  try {
    const errorValidacion = validarDatosDetalle(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    await DetalleModel.updateDetalleReceta(Number(req.params.id), {
      IdReceta: Number(req.body.IdReceta),
      IdMedicamento: Number(req.body.IdMedicamento),
      Cantidad: Number(req.body.Cantidad),
      Indicaciones: req.body.Indicaciones ? req.body.Indicaciones.trim() : undefined,
      IncluirFactura: req.body.IncluirFactura ?? false,
      Estado: req.body.Estado,
    });
    res.json({ mensaje: 'Detalle actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el detalle' });
  }
};

export const cambiarEstadoDetalle = async (req: Request, res: Response) => {
  try {
    if (esCampoVacio(req.body.Estado) || (req.body.Estado !== 'A' && req.body.Estado !== 'I')) {
      return res.status(400).json({ error: 'El estado no es válido' });
    }
    await DetalleModel.camEstadoDetalleReceta(Number(req.params.id), req.body.Estado);
    res.json({ mensaje: 'Estado del detalle actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del detalle' });
  }
};

// Checkbox del frontend: "cobrar aqui" / "lo retiro en otra farmacia"
export const marcarIncluirFactura = async (req: Request, res: Response) => {
  try {
    if (typeof req.body.IncluirFactura !== 'boolean') {
      return res.status(400).json({ error: 'La preferencia de facturación no es válida' });
    }
    await DetalleModel.marcarIncluirFacturaDetalleReceta(Number(req.params.id), req.body.IncluirFactura);
    res.json({ mensaje: 'Preferencia de facturación actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la preferencia de facturación' });
  }
};