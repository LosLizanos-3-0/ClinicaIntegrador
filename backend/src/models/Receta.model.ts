import sql from 'mssql';
import poolPromise from '../config/db';
import { Receta } from '../types';

export const insertReceta = async (data: Receta) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdConsulta', sql.Int, data.IdConsulta)
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .input('Estado', sql.VarChar(20), data.Estado ?? 'Pendiente')
    .execute('InsertReceta');
};

export const selectReceta = async (): Promise<Receta[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectReceta');
  return result.recordset;
};

export const selectRecetaById = async (id: number): Promise<Receta | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdReceta', sql.Int, id)
    .execute('SelectRecetaById');
  return result.recordset[0];
};

export const updateReceta = async (id: number, data: Receta) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdReceta', sql.Int, id)
    .input('IdConsulta', sql.Int, data.IdConsulta)
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .input('Estado', sql.VarChar(20), data.Estado)
    .execute('UpdateReceta');
};

export const deleteReceta = async (id: number) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdReceta', sql.Int, id)
    .execute('DeleteReceta');
};