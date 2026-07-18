import sql from 'mssql';
import poolPromise from '../config/db';
import { Pago } from '../types';

export const insertPago = async (data: Pago) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdFactura', sql.Int, data.IdFactura)
    .input('Monto', sql.Decimal(10, 2), data.Monto)
    .input('MetodoPago', sql.VarChar(30), data.MetodoPago)
    .execute('InsertPago');
};

export const selectPago = async (): Promise<Pago[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectPago');
  return result.recordset;
};

export const selectPagoById = async (id: number): Promise<Pago | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdPago', sql.Int, id)
    .execute('SelectPagoById');
  return result.recordset[0];
};

export const updatePago = async (id: number, data: Pago) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdPago', sql.Int, id)
    .input('IdFactura', sql.Int, data.IdFactura)
    .input('Monto', sql.Decimal(10, 2), data.Monto)
    .input('MetodoPago', sql.VarChar(30), data.MetodoPago)
    .execute('UpdatePago');
};

export const deletePago = async (id: number) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdPago', sql.Int, id)
    .execute('DeletePago');
};