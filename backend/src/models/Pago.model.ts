import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Pago } from '../types';

export const insertPago = async (data: Pago, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertPago', [
    { name: 'IdFactura', type: sql.Int, value: data.IdFactura },
    { name: 'Monto', type: sql.Decimal(10, 2), value: data.Monto },
    { name: 'MetodoPago', type: sql.VarChar(30), value: data.MetodoPago },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const selectPago = async (): Promise<Pago[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectPago');
  return result.recordset;
};

export const selectPagoById = async (id: number): Promise<Pago | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdPago', sql.Int, id).execute('SelectPagoById');
  return result.recordset[0];
};

export const updatePago = async (id: number, data: Pago, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdatePago', [
    { name: 'IdPago', type: sql.Int, value: id },
    { name: 'IdFactura', type: sql.Int, value: data.IdFactura },
    { name: 'Monto', type: sql.Decimal(10, 2), value: data.Monto },
    { name: 'MetodoPago', type: sql.VarChar(30), value: data.MetodoPago },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const camEstadoPago = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoPago', [
    { name: 'IdPago', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};