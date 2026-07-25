import sql from 'mssql';
import poolPromise from '../config/db';
import { UsuarioEspecialidad } from '../types';

export const insertUsuarioEspecialidad = async (data: UsuarioEspecialidad) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .input('IdEspecialidad', sql.Int, data.IdEspecialidad)
    .execute('InsertUsuarioEspecialidad');
};

export const selectUsuarioEspecialidad = async (): Promise<UsuarioEspecialidad[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectUsuarioEspecialidad');
  return result.recordset;
};

export const selectUsuarioEspecialidadByUsuario = async (idUsuario: number): Promise<UsuarioEspecialidad[]> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdUsuario', sql.Int, idUsuario).execute('SelectUsuarioEspecialidadByUsuario');
  return result.recordset;
};

export const deleteUsuarioEspecialidad = async (idUsuario: number, idEspecialidad: number) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdUsuario', sql.Int, idUsuario)
    .input('IdEspecialidad', sql.Int, idEspecialidad)
    .execute('DeleteUsuarioEspecialidad');
};