import sql from 'mssql';
import poolPromise from '../config/db';
import { Cita } from '../types';

export const insertCita = async (data: Cita) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .input('FechaCita', sql.Date, data.FechaCita)
    .input('HoraCita', sql.VarChar(8), data.HoraCita)
    .input('Estado', sql.VarChar(20), data.Estado ?? 'Agendada')
    .input('Motivo', sql.VarChar(200), data.Motivo ?? null)
    .execute('InsertCita');
};

export const selectCita = async (): Promise<Cita[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectCita');
  return result.recordset;
};

export const selectCitaById = async (id: number): Promise<Cita | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdCita', sql.Int, id)
    .execute('SelectCitaById');
  return result.recordset[0];
};

export const updateCita = async (id: number, data: Cita) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdCita', sql.Int, id)
    .input('IdPaciente', sql.Int, data.IdPaciente)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .input('FechaCita', sql.Date, data.FechaCita)
    .input('HoraCita', sql.VarChar(8), data.HoraCita)
    .input('Estado', sql.VarChar(20), data.Estado)
    .input('Motivo', sql.VarChar(200), data.Motivo ?? null)
    .execute('UpdateCita');
};

export const deleteCita = async (id: number) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdCita', sql.Int, id)
    .execute('DeleteCita');
};