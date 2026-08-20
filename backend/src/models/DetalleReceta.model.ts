import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { DetalleReceta } from '../types';

export const insertDetalleReceta = async (data: DetalleReceta, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertDetalleReceta', [
    { name: 'IdReceta', type: sql.Int, value: data.IdReceta },
    { name: 'IdMedicamento', type: sql.Int, value: data.IdMedicamento },
    { name: 'Cantidad', type: sql.Int, value: data.Cantidad },
    { name: 'Indicaciones', type: sql.VarChar(300), value: data.Indicaciones ?? null },
    { name: 'IncluirFactura', type: sql.Bit, value: data.IncluirFactura ?? false },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const selectDetalleReceta = async (): Promise<DetalleReceta[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectDetalleReceta');
  return result.recordset;
};

export const selectDetalleRecetaById = async (id: number): Promise<DetalleReceta | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdDetalleReceta', sql.Int, id).execute('SelectDetalleRecetaById');
  return result.recordset[0];
};

export const updateDetalleReceta = async (id: number, data: DetalleReceta, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateDetalleReceta', [
    { name: 'IdDetalleReceta', type: sql.Int, value: id },
    { name: 'IdReceta', type: sql.Int, value: data.IdReceta },
    { name: 'IdMedicamento', type: sql.Int, value: data.IdMedicamento },
    { name: 'Cantidad', type: sql.Int, value: data.Cantidad },
    { name: 'Indicaciones', type: sql.VarChar(300), value: data.Indicaciones ?? null },
    { name: 'IncluirFactura', type: sql.Bit, value: data.IncluirFactura ?? false },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const camEstadoDetalleReceta = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoDetalleReceta', [
    { name: 'IdDetalleReceta', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};

// Checkbox del frontend: "cobrar aqui" / "lo retiro en otra farmacia"
export const marcarIncluirFacturaDetalleReceta = async (
  id: number,
  incluirFactura: boolean,
  actor: ActorInfo | null = null
) => {
  await ejecutarConActor(actor, 'MarcarIncluirFacturaDetalleReceta', [
    { name: 'IdDetalleReceta', type: sql.Int, value: id },
    { name: 'IncluirFactura', type: sql.Bit, value: incluirFactura },
  ]);
};