import sql from 'mssql';
import poolPromise from '../config/db';
import { ExpedienteMedico } from '../types';

export const insertExpedienteMedico = async (data: ExpedienteMedico) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .input('Observaciones', sql.VarChar(500), data.Observaciones ?? null)
    .execute('InsertExpedienteMedico');
};

export const selectExpedienteMedico = async (): Promise<ExpedienteMedico[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectExpedienteMedico');
  return result.recordset;
};

export const selectExpedienteMedicoById = async (id: number): Promise<ExpedienteMedico | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdExpediente', sql.Int, id).execute('SelectExpedienteMedicoById');
  return result.recordset[0];
};

export const updateExpedienteMedico = async (id: number, data: ExpedienteMedico) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdExpediente', sql.Int, id)
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .input('Observaciones', sql.VarChar(500), data.Observaciones ?? null)
    .execute('UpdateExpedienteMedico');
};

export const camEstadoExpedienteMedico = async (id: number, estado: 'A' | 'I') => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdExpediente', sql.Int, id)
    .input('Estado', sql.Char(1), estado)
    .execute('CamEstadoExpedienteMedico');
};