import { Request, Response } from 'express';
import * as MedicamentoModel from '../models/Medicamento.model';
import { obtenerActor } from '../config/actor';

const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.,+%/() -]{2,100}$/;
const TEXTO_LIBRE_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.,+%/() -]{0,300}$/;

const esNumeroValido = (valor: unknown): valor is number => {
  return typeof valor === 'number' && Number.isFinite(valor);
};

const validarDatosMedicamento = (body: any, requiereStockActual: boolean): string | null => {
  if (typeof body.NombreMedicamento !== 'string' || !NOMBRE_REGEX.test(body.NombreMedicamento.trim())) {
    return 'El nombre del medicamento es obligatorio y contiene caracteres no válidos';
  }
  if (!esNumeroValido(Number(body.IdCategoria)) || Number(body.IdCategoria) <= 0) {
    return 'La categoria seleccionada no es válida';
  }
  if (body.Descripcion !== undefined && body.Descripcion !== null && body.Descripcion !== '') {
    if (typeof body.Descripcion !== 'string' || !TEXTO_LIBRE_REGEX.test(body.Descripcion.trim()) || body.Descripcion.trim().length > 300) {
      return 'La descripción contiene caracteres no válidos';
    }
  }
  if (body.Presentacion !== undefined && body.Presentacion !== null && body.Presentacion !== '') {
    if (typeof body.Presentacion !== 'string' || !TEXTO_LIBRE_REGEX.test(body.Presentacion.trim()) || body.Presentacion.trim().length > 50) {
      return 'La presentación contiene caracteres no válidos';
    }
  }
  if (typeof body.Ubicacion !== 'string' || body.Ubicacion.trim().length < 2 || !TEXTO_LIBRE_REGEX.test(body.Ubicacion.trim()) || body.Ubicacion.trim().length > 200) {
    return 'La ubicación es obligatoria y contiene caracteres no válidos';
  }
  if (requiereStockActual) {
    if (!esNumeroValido(Number(body.StockActual)) || Number(body.StockActual) < 0) {
      return 'El stock actual debe ser un número mayor o igual a cero';
    }
  }
  if (!esNumeroValido(Number(body.StockMinimo)) || Number(body.StockMinimo) < 0) {
    return 'El stock mínimo debe ser un número mayor o igual a cero';
  }
  if (!esNumeroValido(Number(body.PrecioUnitario)) || Number(body.PrecioUnitario) < 0) {
    return 'El precio unitario debe ser un número mayor o igual a cero';
  }
  if (body.Estado !== undefined && body.Estado !== 'A' && body.Estado !== 'I') {
    return 'El estado no es válido';
  }
  return null;
};

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
    const errorValidacion = validarDatosMedicamento(req.body, true);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    const actor = await obtenerActor(req);
    await MedicamentoModel.insertMedicamento({
      NombreMedicamento: req.body.NombreMedicamento.trim(),
      Descripcion: req.body.Descripcion ? req.body.Descripcion.trim() : undefined,
      IdCategoria: Number(req.body.IdCategoria),
      Presentacion: req.body.Presentacion ? req.body.Presentacion.trim() : undefined,
      Ubicacion: req.body.Ubicacion.trim(),
      StockActual: Number(req.body.StockActual),
      StockMinimo: Number(req.body.StockMinimo),
      PrecioUnitario: Number(req.body.PrecioUnitario),
      Estado: req.body.Estado,
    }, actor);
    res.status(201).json({ mensaje: 'Medicamento creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el medicamento' });
  }
};

export const updateMedicamento = async (req: Request, res: Response) => {
  try {
    const errorValidacion = validarDatosMedicamento(req.body, false);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    const actor = await obtenerActor(req);
    await MedicamentoModel.updateMedicamento(Number(req.params.id), {
      NombreMedicamento: req.body.NombreMedicamento.trim(),
      Descripcion: req.body.Descripcion ? req.body.Descripcion.trim() : undefined,
      IdCategoria: Number(req.body.IdCategoria),
      Presentacion: req.body.Presentacion ? req.body.Presentacion.trim() : undefined,
      Ubicacion: req.body.Ubicacion.trim(),
      StockMinimo: Number(req.body.StockMinimo),
      PrecioUnitario: Number(req.body.PrecioUnitario),
      Estado: req.body.Estado,
    }, actor);
    res.json({ mensaje: 'Medicamento actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el medicamento' });
  }
};

export const cambiarEstadoMedicamento = async (req: Request, res: Response) => {
  try {
    if (req.body.Estado !== 'A' && req.body.Estado !== 'I') {
      return res.status(400).json({ error: 'El estado no es válido' });
    }
    const actor = await obtenerActor(req);
    await MedicamentoModel.camEstadoMedicamento(Number(req.params.id), req.body.Estado, actor);
    res.json({ mensaje: 'Estado del medicamento actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del medicamento' });
  }
};

// Solo el rol Administrador puede tocar el stock actual directamente.
// El frontend manda el rol en el header 'x-rol' (igual de fuerte que el resto
// del sistema, que tampoco usa tokens de sesión).
export const updateStockMedicamento = async (req: Request, res: Response) => {
  try {
    const rol = req.header('x-rol');
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo un administrador puede modificar el stock actual.' });
    }
    const stockActual = Number(req.body.StockActual);
    if (!Number.isFinite(stockActual) || stockActual < 0) {
      return res.status(400).json({ error: 'El stock actual debe ser un número mayor o igual a cero' });
    }
    const actor = await obtenerActor(req);
    await MedicamentoModel.updateStockMedicamento(Number(req.params.id), stockActual, actor);
    res.json({ mensaje: 'Stock actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el stock' });
  }
};