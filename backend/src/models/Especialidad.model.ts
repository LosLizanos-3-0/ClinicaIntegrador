import sql from 'mssql';
import poolPromise from '../config/db';
import { Especialidad } from '../types';

export const insertEspecialidad = async (data: Especialidad) => {
  const pool = await poolPromise;
  await pool.request()
    .input('Estado', sql.Char(1), data.Estado)
    .input('NombreEspecialidad', sql.VarChar(80), data.NombreEspecialidad)
    .execute('InsertEspecialidad');
};

export const selectEspecialidad = async (): Promise<Especialidad[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectEspecialidad');
  return result.recordset;
};

export const selectEspecialidadById = async (id: number): Promise<Especialidad | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdEspecialidad', sql.Int, id).execute('SelectEspecialidadById');
  return result.recordset[0];
};

export const updateEspecialidad = async (id: number, data: Especialidad) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdEspecialidad', sql.Int, id)
    .input('Estado', sql.Char(1), data.Estado)
    .input('NombreEspecialidad', sql.VarChar(80), data.NombreEspecialidad)
    .execute('UpdateEspecialidad');
};

export const camEstadoEspecialidad = async (id: number, estado: 'A' | 'I') => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdEspecialidad', sql.Int, id)
    .input('Estado', sql.Char(1), estado)
    .execute('CamEstadoEspecialidad');
};