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

// Registra un intento de login (exitoso o fallido) en la bitácora.
export const insertBitacoraLogin = async (
  usuario: string,
  resultado: 'EXITOSO' | 'FALLIDO',
  detalle?: string
) => {
  const pool = await poolPromise;
  await pool.request()
    .input('Usuario', sql.VarChar(100), usuario)
    .input('Resultado', sql.VarChar(10), resultado)
    .input('Detalle', sql.NVarChar(500), detalle ?? null)
    .execute('InsertBitacoraLogin');
};