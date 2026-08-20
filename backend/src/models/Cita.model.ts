import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Cita } from '../types';

export const insertCita = async (data: Cita, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertCita', [
    { name: 'IdPaciente', type: sql.Int, value: data.IdPaciente },
    { name: 'IdEspecialidad', type: sql.Int, value: data.IdEspecialidad },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'FechaCita', type: sql.Date, value: data.FechaCita },
    { name: 'HoraCita', type: sql.VarChar(8), value: data.HoraCita },
    { name: 'Estado', type: sql.VarChar(20), value: data.Estado ?? 'Programada' },
    { name: 'Motivo', type: sql.VarChar(200), value: data.Motivo ?? null },
  ]);
};

export const selectCita = async (): Promise<Cita[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectCita');
  return result.recordset;
};

export const selectCitaById = async (id: number): Promise<Cita | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdCita', sql.Int, id).execute('SelectCitaById');
  return result.recordset[0];
};

export const updateCita = async (id: number, data: Cita, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateCita', [
    { name: 'IdCita', type: sql.Int, value: id },
    { name: 'IdPaciente', type: sql.Int, value: data.IdPaciente },
    { name: 'IdEspecialidad', type: sql.Int, value: data.IdEspecialidad },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'FechaCita', type: sql.Date, value: data.FechaCita },
    { name: 'HoraCita', type: sql.VarChar(8), value: data.HoraCita },
    { name: 'Estado', type: sql.VarChar(20), value: data.Estado },
    { name: 'Motivo', type: sql.VarChar(200), value: data.Motivo ?? null },
  ]);
};

export const camEstadoCita = async (id: number, estado: string, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoCita', [
    { name: 'IdCita', type: sql.Int, value: id },
    { name: 'Estado', type: sql.VarChar(20), value: estado },
  ]);
};