import sql from 'mssql';
import poolPromise from '../config/db';
import { Medicamento } from '../types';

export const insertMedicamento = async (data: Medicamento) => {
  const pool = await poolPromise;
  await pool.request()
    .input('NombreMedicamento', sql.VarChar(100), data.NombreMedicamento)
    .input('Descripcion', sql.VarChar(300), data.Descripcion ?? null)
    .input('Presentacion', sql.VarChar(50), data.Presentacion ?? null)
    .input('Ubicacion', sql.VarChar(200), data.Ubicacion)
    .input('StockActual', sql.Int, data.StockActual ?? 0)
    .input('StockMinimo', sql.Int, data.StockMinimo ?? 0)
    .input('PrecioUnitario', sql.Decimal(10, 2), data.PrecioUnitario ?? 0)
    .execute('InsertMedicamento');
};

export const selectMedicamento = async (): Promise<Medicamento[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectMedicamento');
  return result.recordset;
};

export const selectMedicamentoById = async (id: number): Promise<Medicamento | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdMedicamento', sql.Int, id).execute('SelectMedicamentoById');
  return result.recordset[0];
};

export const updateMedicamento = async (id: number, data: Medicamento) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdMedicamento', sql.Int, id)
    .input('NombreMedicamento', sql.VarChar(100), data.NombreMedicamento)
    .input('Descripcion', sql.VarChar(300), data.Descripcion ?? null)
    .input('Presentacion', sql.VarChar(50), data.Presentacion ?? null)
    .input('Ubicacion', sql.VarChar(200), data.Ubicacion)
    .input('StockActual', sql.Int, data.StockActual)
    .input('StockMinimo', sql.Int, data.StockMinimo)
    .input('PrecioUnitario', sql.Decimal(10, 2), data.PrecioUnitario)
    .execute('UpdateMedicamento');
};

export const camEstadoMedicamento = async (id: number, estado: 'A' | 'I') => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdMedicamento', sql.Int, id)
    .input('Estado', sql.Char(1), estado)
    .execute('CamEstadoMedicamento');
};