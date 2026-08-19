import { Request, Response } from 'express';
import * as ReporteModel from '../models/Reporte.model';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    res.json(await ReporteModel.selectDashboardAdmin());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el dashboard' });
  }
};

const validarRango = (req: Request, res: Response): { desde: string; hasta: string } | null => {
  const { desde, hasta } = req.query;
  if (!desde || !hasta) {
    res.status(400).json({ error: 'Debes indicar "desde" y "hasta" (YYYY-MM-DD)' });
    return null;
  }
  return { desde: String(desde), hasta: String(hasta) };
};

export const getCitasRango = async (req: Request, res: Response) => {
  const rango = validarRango(req, res);
  if (!rango) return;
  try {
    res.json(await ReporteModel.selectReporteCitasRango(rango.desde, rango.hasta));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el reporte de citas' });
  }
};

export const getCitasEspecialidad = async (req: Request, res: Response) => {
  const rango = validarRango(req, res);
  if (!rango) return;
  const idEspecialidad = Number(req.query.idEspecialidad);
  if (!idEspecialidad) return res.status(400).json({ error: 'Debes indicar "idEspecialidad"' });
  try {
    res.json(await ReporteModel.selectReporteCitasEspecialidad(rango.desde, rango.hasta, idEspecialidad));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el reporte de citas por especialidad' });
  }
};

export const getMedicamentosCategoria = async (req: Request, res: Response) => {
  const idCategoria = Number(req.query.idCategoria);
  if (!idCategoria) return res.status(400).json({ error: 'Debes indicar "idCategoria"' });
  try {
    res.json(await ReporteModel.selectReporteMedicamentosCategoria(idCategoria));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el reporte de medicamentos' });
  }
};

export const getIngresosRango = async (req: Request, res: Response) => {
  const rango = validarRango(req, res);
  if (!rango) return;
  try {
    res.json(await ReporteModel.selectReporteIngresosRango(rango.desde, rango.hasta));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el reporte de ingresos' });
  }
};

export const getFacturacionEspecialidad = async (req: Request, res: Response) => {
  const rango = validarRango(req, res);
  if (!rango) return;
  const idEspecialidad = Number(req.query.idEspecialidad);
  if (!idEspecialidad) return res.status(400).json({ error: 'Debes indicar "idEspecialidad"' });
  try {
    res.json(await ReporteModel.selectReporteFacturacionEspecialidad(rango.desde, rango.hasta, idEspecialidad));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el reporte de facturación por especialidad' });
  }
};

export const getPacientesNuevos = async (req: Request, res: Response) => {
  const rango = validarRango(req, res);
  if (!rango) return;
  try {
    res.json(await ReporteModel.selectReportePacientesNuevos(rango.desde, rango.hasta));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el reporte de pacientes nuevos' });
  }
};