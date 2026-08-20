import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { DetalleFactura } from '../types';

export const insertDetalleFactura = async (data: DetalleFactura, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertDetalleFactura', [
    { name: 'IdFactura', type: sql.Int, value: data.IdFactura },
    { name: 'Concepto', type: sql.VarChar(250), value: data.Concepto },
    { name: 'Cantidad', type: sql.Int, value: data.Cantidad },
    { name: 'PrecioUnitario', type: sql.Decimal(10, 2), value: data.PrecioUnitario },
    { name: 'IdDetalleReceta', type: sql.Int, value: data.IdDetalleReceta ?? null },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
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

export const updateDetalleFactura = async (id: number, data: DetalleFactura, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateDetalleFactura', [
    { name: 'IdDetalleFactura', type: sql.Int, value: id },
    { name: 'IdFactura', type: sql.Int, value: data.IdFactura },
    { name: 'Concepto', type: sql.VarChar(250), value: data.Concepto },
    { name: 'Cantidad', type: sql.Int, value: data.Cantidad },
    { name: 'PrecioUnitario', type: sql.Decimal(10, 2), value: data.PrecioUnitario },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const camEstadoDetalleFactura = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoDetalleFactura', [
    { name: 'IdDetalleFactura', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};

// Genera automaticamente las lineas de medicamentos (cantidad * precio) que el
// paciente marco para cobrar aqui (IncluirFactura = 1) en esa receta.
export const generarDetalleFacturaDesdeReceta = async (
  idFactura: number,
  idReceta: number,
  actor: ActorInfo | null = null
) => {
  await ejecutarConActor(actor, 'GenerarDetalleFacturaDesdeReceta', [
    { name: 'IdFactura', type: sql.Int, value: idFactura },
    { name: 'IdReceta', type: sql.Int, value: idReceta },
  ]);
};