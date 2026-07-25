import sql from 'mssql';
import poolPromise from '../config/db';
import { DetalleFactura } from '../types';

export const insertDetalleFactura = async (data: DetalleFactura) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdFactura', sql.Int, data.IdFactura)
    .input('Concepto', sql.VarChar(250), data.Concepto)
    .input('Cantidad', sql.Int, data.Cantidad)
    .input('PrecioUnitario', sql.Decimal(10, 2), data.PrecioUnitario)
    .input('Subtotal', sql.Decimal(10, 2), data.Subtotal)
    .execute('InsertDetalleFactura');
};

export const selectDetalleFactura = async (): Promise<DetalleFactura[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectDetalleFactura');
  return result.recordset;
};

export const selectDetalleFacturaById = async (id: number): Promise<DetalleFactura | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdDetalleFactura', sql.Int, id).execute('SelectDetalleFacturaById');
  return result.recordset[0];
};

export const updateDetalleFactura = async (id: number, data: DetalleFactura) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdDetalleFactura', sql.Int, id)
    .input('IdFactura', sql.Int, data.IdFactura)
    .input('Concepto', sql.VarChar(250), data.Concepto)
    .input('Cantidad', sql.Int, data.Cantidad)
    .input('PrecioUnitario', sql.Decimal(10, 2), data.PrecioUnitario)
    .input('Subtotal', sql.Decimal(10, 2), data.Subtotal)
    .execute('UpdateDetalleFactura');
};

export const camEstadoDetalleFactura = async (id: number, estado: 'A' | 'I') => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdDetalleFactura', sql.Int, id)
    .input('Estado', sql.Char(1), estado)
    .execute('CamEstadoDetalleFactura');
};