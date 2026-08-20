import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { ExpedienteMedico } from '../types';

export const insertExpedienteMedico = async (data: ExpedienteMedico, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertExpedienteMedico', [
    { name: 'IdPaciente', type: sql.Int, value: data.IdPaciente },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'IdCita', type: sql.Int, value: data.IdCita },
    { name: 'Observaciones', type: sql.VarChar(500), value: data.Observaciones ?? null },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
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

export const updateExpedienteMedico = async (id: number, data: ExpedienteMedico, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateExpedienteMedico', [
    { name: 'IdExpediente', type: sql.Int, value: id },
    { name: 'IdPaciente', type: sql.Int, value: data.IdPaciente },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'IdCita', type: sql.Int, value: data.IdCita },
    { name: 'Observaciones', type: sql.VarChar(500), value: data.Observaciones ?? null },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const camEstadoExpedienteMedico = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoExpedienteMedico', [
    { name: 'IdExpediente', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};