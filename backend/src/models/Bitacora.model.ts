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


export const insertBitacoraLogin = async (
  usuario: string,
  resultado: 'EXITOSO' | 'FALLIDO',
  detalle?: string,
  usuarioMostrar?: string,
  rol?: string
) => {
  const pool = await poolPromise;
  await pool.request()
    .input('Usuario', sql.VarChar(100), usuario)
    .input('Resultado', sql.VarChar(10), resultado)
    .input('Detalle', sql.NVarChar(500), detalle ?? null)
    .input('UsuarioMostrar', sql.VarChar(100), usuarioMostrar ?? null)
    .input('Rol', sql.VarChar(50), rol ?? null)
    .execute('InsertBitacoraLogin');
};