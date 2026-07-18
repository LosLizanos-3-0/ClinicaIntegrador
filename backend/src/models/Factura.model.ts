import sql from 'mssql';
import poolPromise from '../config/db';
import { Factura } from '../types';

export const insertFactura = async (data: Factura) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdCita', sql.Int, data.IdCita)
    .input('Total', sql.Decimal(10, 2), data.Total ?? 0)
    .input('Estado', sql.VarChar(20), data.Estado ?? 'Pendiente')
    .execute('InsertFactura');
};

export const selectFactura = async (): Promise<Factura[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectFactura');
  return result.recordset;
};

export const selectFacturaById = async (id: number): Promise<Factura | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdFactura', sql.Int, id)
    .execute('SelectFacturaById');
  return result.recordset[0];
};

export const updateFactura = async (id: number, data: Factura) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdFactura', sql.Int, id)
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdCita', sql.Int, data.IdCita)
    .input('Total', sql.Decimal(10, 2), data.Total)
    .input('Estado', sql.VarChar(20), data.Estado)
    .execute('UpdateFactura');
};

export const deleteFactura = async (id: number) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdFactura', sql.Int, id)
    .execute('DeleteFactura');
};