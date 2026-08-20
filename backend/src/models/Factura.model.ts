import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Factura } from '../types';

export const insertFactura = async (data: Factura, actor: ActorInfo | null = null): Promise<number> => {
  const result = await ejecutarConActor(actor, 'InsertFactura', [
    { name: 'IdPaciente', type: sql.Int, value: data.IdPaciente },
    { name: 'IdCita', type: sql.Int, value: data.IdCita },
    { name: 'MontoConsulta', type: sql.Decimal(10, 2), value: data.MontoConsulta ?? 0 },
    { name: 'Estado', type: sql.VarChar(20), value: data.Estado ?? 'Pendiente' },
  ]);
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

export const updateFactura = async (id: number, data: Factura, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateFactura', [
    { name: 'IdFactura', type: sql.Int, value: id },
    { name: 'IdPaciente', type: sql.Int, value: data.IdPaciente },
    { name: 'IdCita', type: sql.Int, value: data.IdCita },
    { name: 'MontoConsulta', type: sql.Decimal(10, 2), value: data.MontoConsulta },
    { name: 'Estado', type: sql.VarChar(20), value: data.Estado },
  ]);
};

export const updateMontoConsultaFactura = async (id: number, montoConsulta: number, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateMontoConsultaFactura', [
    { name: 'IdFactura', type: sql.Int, value: id },
    { name: 'MontoConsulta', type: sql.Decimal(10, 2), value: montoConsulta },
  ]);
};

export const camEstadoFactura = async (id: number, estado: string, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoFactura', [
    { name: 'IdFactura', type: sql.Int, value: id },
    { name: 'Estado', type: sql.VarChar(20), value: estado },
  ]);
};