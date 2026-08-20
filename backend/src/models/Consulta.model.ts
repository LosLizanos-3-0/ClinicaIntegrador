import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Consulta } from '../types';

export const insertConsulta = async (data: Consulta, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertConsulta', [
    { name: 'IdExpediente', type: sql.Int, value: data.IdExpediente },
    { name: 'IdCita', type: sql.Int, value: data.IdCita ?? null },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'Diagnostico', type: sql.VarChar(500), value: data.Diagnostico ?? null },
    { name: 'Tratamiento', type: sql.VarChar(500), value: data.Tratamiento ?? null },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
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

export const updateConsulta = async (id: number, data: Consulta, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateConsulta', [
    { name: 'IdConsulta', type: sql.Int, value: id },
    { name: 'IdExpediente', type: sql.Int, value: data.IdExpediente },
    { name: 'IdCita', type: sql.Int, value: data.IdCita ?? null },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'Diagnostico', type: sql.VarChar(500), value: data.Diagnostico ?? null },
    { name: 'Tratamiento', type: sql.VarChar(500), value: data.Tratamiento ?? null },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const camEstadoConsulta = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoConsulta', [
    { name: 'IdConsulta', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};