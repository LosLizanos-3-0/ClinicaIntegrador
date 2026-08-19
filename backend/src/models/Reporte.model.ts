import sql from 'mssql';
import poolPromise from '../config/db';

export const selectDashboardAdmin = async () => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectDashboardAdmin');
  return {
    kpis: result.recordsets[0][0],
    consultasPorEspecialidad: result.recordsets[1],
    estadoCitas: result.recordsets[2],
  };
};

export const selectReporteCitasRango = async (desde: string, hasta: string) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Desde', sql.Date, desde)
    .input('Hasta', sql.Date, hasta)
    .execute('SelectReporteCitasRango');
  return result.recordset;
};

export const selectReporteCitasEspecialidad = async (desde: string, hasta: string, idEspecialidad: number) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Desde', sql.Date, desde)
    .input('Hasta', sql.Date, hasta)
    .input('IdEspecialidad', sql.Int, idEspecialidad)
    .execute('SelectReporteCitasEspecialidad');
  return result.recordset;
};

export const selectReporteMedicamentosCategoria = async (idCategoria: number) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdCategoria', sql.Int, idCategoria)
    .execute('SelectReporteMedicamentosCategoria');
  return result.recordset;
};

export const selectReporteIngresosRango = async (desde: string, hasta: string) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Desde', sql.Date, desde)
    .input('Hasta', sql.Date, hasta)
    .execute('SelectReporteIngresosRango');
  return result.recordset;
};

export const selectReporteFacturacionEspecialidad = async (desde: string, hasta: string, idEspecialidad: number) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Desde', sql.Date, desde)
    .input('Hasta', sql.Date, hasta)
    .input('IdEspecialidad', sql.Int, idEspecialidad)
    .execute('SelectReporteFacturacionEspecialidad');
  return result.recordset;
};

export const selectReportePacientesNuevos = async (desde: string, hasta: string) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Desde', sql.Date, desde)
    .input('Hasta', sql.Date, hasta)
    .execute('SelectReportePacientesNuevos');
  return result.recordset;
};