import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Especialidad } from '../types';

export const insertEspecialidad = async (data: Especialidad, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertEspecialidad', [
    { name: 'Estado', type: sql.Char(1), value: data.Estado },
    { name: 'NombreEspecialidad', type: sql.VarChar(80), value: data.NombreEspecialidad },
  ]);
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

export const updateEspecialidad = async (id: number, data: Especialidad, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateEspecialidad', [
    { name: 'IdEspecialidad', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: data.Estado },
    { name: 'NombreEspecialidad', type: sql.VarChar(80), value: data.NombreEspecialidad },
  ]);
};

export const camEstadoEspecialidad = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoEspecialidad', [
    { name: 'IdEspecialidad', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};