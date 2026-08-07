import sql from 'mssql';
import poolPromise from '../config/db';
import { Bitacora } from '../types';

export const selectBitacora = async (tabla?: string): Promise<Bitacora[]> => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Tabla', sql.VarChar(100), tabla ?? null)
    .execute('SelectBitacora');
  return result.recordset;
};
