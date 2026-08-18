import sql from 'mssql';
import poolPromise from '../config/db';
import { Factura } from '../types';

export const insertFactura = async (data: Factura): Promise<number> => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdCita', sql.Int, data.IdCita)
    .input('MontoConsulta', sql.Decimal(10, 2), data.MontoConsulta ?? 0)
    .input('Estado', sql.VarChar(20), data.Estado ?? 'Pendiente')
    .execute('InsertFactura');
  return result.recordset[0].IdFactura;
};

export const selectFactura = async (): Promise<Factura[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectFactura');
  return result.recordset;
};

export const selectFacturaById = async (id: number): Promise<Factura | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdFactura', sql.Int, id).execute('SelectFacturaById');
  return result.recordset[0];
};

export const updateFactura = async (id: number, data: Factura) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdFactura', sql.Int, id)
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdCita', sql.Int, data.IdCita)
    .input('MontoConsulta', sql.Decimal(10, 2), data.MontoConsulta)
    .input('Estado', sql.VarChar(20), data.Estado)
    .execute('UpdateFactura');
};

export const updateMontoConsultaFactura = async (id: number, montoConsulta: number) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdFactura', sql.Int, id)
    .input('MontoConsulta', sql.Decimal(10, 2), montoConsulta)
    .execute('UpdateMontoConsultaFactura');
};

export const camEstadoFactura = async (id: number, estado: string) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdFactura', sql.Int, id)
    .input('Estado', sql.VarChar(20), estado)
    .execute('CamEstadoFactura');
};