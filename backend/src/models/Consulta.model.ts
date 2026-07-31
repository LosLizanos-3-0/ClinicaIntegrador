import sql from 'mssql';
import poolPromise from '../config/db';
import { Consulta } from '../types';

export const insertConsulta = async (data: Consulta) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdExpediente', sql.Int, data.IdExpediente)
    .input('IdCita', sql.Int, data.IdCita ?? null)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .input('Diagnostico', sql.VarChar(500), data.Diagnostico ?? null)
    .input('Tratamiento', sql.VarChar(500), data.Tratamiento ?? null)
    .input('Estado', sql.Char(1), data.Estado ?? 'A')
    .execute('InsertConsulta');
};

export const selectConsulta = async (): Promise<Consulta[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectConsulta');
  return result.recordset;
};

export const selectConsultaById = async (id: number): Promise<Consulta | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdConsulta', sql.Int, id).execute('SelectConsultaById');
  return result.recordset[0];
};

export const updateConsulta = async (id: number, data: Consulta) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdConsulta', sql.Int, id)
    .input('IdExpediente', sql.Int, data.IdExpediente)
    .input('IdCita', sql.Int, data.IdCita ?? null)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .input('Diagnostico', sql.VarChar(500), data.Diagnostico ?? null)
    .input('Tratamiento', sql.VarChar(500), data.Tratamiento ?? null)
    .input('Estado', sql.Char(1), data.Estado ?? 'A')
    .execute('UpdateConsulta');
};

export const camEstadoConsulta = async (id: number, estado: 'A' | 'I') => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdConsulta', sql.Int, id)
    .input('Estado', sql.Char(1), estado)
    .execute('CamEstadoConsulta');
};