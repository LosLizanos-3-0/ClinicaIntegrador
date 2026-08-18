import sql from 'mssql';
import poolPromise from '../config/db';
import { DetalleReceta } from '../types';

export const insertDetalleReceta = async (data: DetalleReceta) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdReceta', sql.Int, data.IdReceta)
    .input('IdMedicamento', sql.Int, data.IdMedicamento)
    .input('Cantidad', sql.Int, data.Cantidad)
    .input('Indicaciones', sql.VarChar(300), data.Indicaciones ?? null)
    .input('IncluirFactura', sql.Bit, data.IncluirFactura ?? false)
    .input('Estado', sql.Char(1), data.Estado ?? 'A')
    .execute('InsertDetalleReceta');
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

export const updateDetalleReceta = async (id: number, data: DetalleReceta) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdDetalleReceta', sql.Int, id)
    .input('IdReceta', sql.Int, data.IdReceta)
    .input('IdMedicamento', sql.Int, data.IdMedicamento)
    .input('Cantidad', sql.Int, data.Cantidad)
    .input('Indicaciones', sql.VarChar(300), data.Indicaciones ?? null)
    .input('IncluirFactura', sql.Bit, data.IncluirFactura ?? false)
    .input('Estado', sql.Char(1), data.Estado ?? 'A')
    .execute('UpdateDetalleReceta');
};

export const camEstadoDetalleReceta = async (id: number, estado: 'A' | 'I') => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdDetalleReceta', sql.Int, id)
    .input('Estado', sql.Char(1), estado)
    .execute('CamEstadoDetalleReceta');
};

// Checkbox del frontend: "cobrar aqui" / "lo retiro en otra farmacia"
export const marcarIncluirFacturaDetalleReceta = async (id: number, incluirFactura: boolean) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdDetalleReceta', sql.Int, id)
    .input('IncluirFactura', sql.Bit, incluirFactura)
    .execute('MarcarIncluirFacturaDetalleReceta');
};